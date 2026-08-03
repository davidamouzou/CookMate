import { describe, expect, it } from "vitest";
import { extractClientIp, isValidIp, parseUserAgent } from "./user-agent";

const IPHONE =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD =
    "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/604.1";
const ANDROID_PHONE =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";
const MAC_CHROME =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const WINDOWS_EDGE =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0";
const GOOGLEBOT =
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

describe("parseUserAgent", () => {
    it("identifies a phone", () => {
        const result = parseUserAgent(IPHONE);
        expect(result.deviceType).toBe("mobile");
        expect(result.os).toBe("iOS");
        expect(result.browser).toBe("Safari");
        expect(result.isBot).toBe(false);
    });

    it("distinguishes a tablet from a phone", () => {
        expect(parseUserAgent(IPAD).deviceType).toBe("tablet");
        expect(parseUserAgent(ANDROID_PHONE).deviceType).toBe("mobile");
    });

    it("identifies desktop browsers", () => {
        expect(parseUserAgent(MAC_CHROME)).toMatchObject({
            deviceType: "desktop",
            os: "macOS",
            browser: "Chrome",
        });
        // Edge also contains "Chrome/", so order matters.
        expect(parseUserAgent(WINDOWS_EDGE).browser).toBe("Edge");
    });

    it("flags bots", () => {
        const result = parseUserAgent(GOOGLEBOT);
        expect(result.isBot).toBe(true);
        expect(result.deviceType).toBe("bot");
    });

    it("handles a missing user agent", () => {
        expect(parseUserAgent(null)).toEqual({
            deviceType: "unknown",
            os: null,
            browser: null,
            isBot: false,
        });
    });
});

describe("isValidIp", () => {
    it("accepts valid addresses", () => {
        expect(isValidIp("192.168.1.1")).toBe(true);
        expect(isValidIp("2a01:e0a:1ff:cf40::1")).toBe(true);
    });

    it("rejects malformed addresses", () => {
        expect(isValidIp("999.1.1.1")).toBe(false);
        expect(isValidIp("not-an-ip")).toBe(false);
        expect(isValidIp("")).toBe(false);
    });
});

describe("extractClientIp", () => {
    it("prefers the Cloudflare header", () => {
        const headers = new Headers({
            "cf-connecting-ip": "203.0.113.5",
            "x-forwarded-for": "198.51.100.1, 10.0.0.1",
        });
        expect(extractClientIp(headers)).toBe("203.0.113.5");
    });

    it("falls back to the first x-forwarded-for hop", () => {
        const headers = new Headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" });
        expect(extractClientIp(headers)).toBe("198.51.100.1");
    });

    it("returns null when no header carries a usable address", () => {
        expect(extractClientIp(new Headers())).toBeNull();
        expect(extractClientIp(new Headers({ "x-real-ip": "garbage" }))).toBeNull();
    });
});
