export type DeviceType = "mobile" | "tablet" | "desktop" | "bot" | "unknown";

export type ParsedUserAgent = {
    deviceType: DeviceType;
    os: string | null;
    browser: string | null;
    isBot: boolean;
};

const BOT_PATTERN =
    /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|preview|headless|lighthouse|pingdom|uptime|curl|wget|python-requests|axios|node-fetch/i;

const TABLET_PATTERN = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i;
const MOBILE_PATTERN = /mobi|iphone|ipod|android|blackberry|iemobile|opera mini|windows phone/i;

/** Ordered: the first match wins, so narrower engines come before broader ones. */
const OS_RULES: [RegExp, string][] = [
    [/windows nt 10/i, "Windows 10/11"],
    [/windows nt/i, "Windows"],
    [/iphone os (\d+)[._](\d+)/i, "iOS"],
    [/ipad.*os (\d+)[._](\d+)/i, "iPadOS"],
    [/mac os x/i, "macOS"],
    [/android[ /](\d+)/i, "Android"],
    [/android/i, "Android"],
    [/cros/i, "ChromeOS"],
    [/linux/i, "Linux"],
];

const BROWSER_RULES: [RegExp, string][] = [
    [/edg[ea]?\//i, "Edge"],
    [/opr\/|opera/i, "Opera"],
    [/samsungbrowser/i, "Samsung Internet"],
    [/firefox\/|fxios/i, "Firefox"],
    [/crios\//i, "Chrome"],
    [/chrome\//i, "Chrome"],
    [/safari\//i, "Safari"],
];

function firstMatch(rules: [RegExp, string][], userAgent: string): string | null {
    for (const [pattern, label] of rules) {
        if (pattern.test(userAgent)) return label;
    }
    return null;
}

/**
 * Best-effort user-agent parsing. Deliberately coarse: it records the kind of
 * device someone used, not a fingerprint that could re-identify them.
 */
export function parseUserAgent(userAgent: string | null): ParsedUserAgent {
    if (!userAgent) {
        return { deviceType: "unknown", os: null, browser: null, isBot: false };
    }

    if (BOT_PATTERN.test(userAgent)) {
        return { deviceType: "bot", os: null, browser: null, isBot: true };
    }

    const deviceType: DeviceType = TABLET_PATTERN.test(userAgent)
        ? "tablet"
        : MOBILE_PATTERN.test(userAgent)
            ? "mobile"
            : "desktop";

    return {
        deviceType,
        os: firstMatch(OS_RULES, userAgent),
        browser: firstMatch(BROWSER_RULES, userAgent),
        isBot: false,
    };
}

/**
 * Extracts the client IP from proxy headers, most trustworthy first.
 * `x-forwarded-for` is a client-controlled list, so only the first hop is kept.
 */
export function extractClientIp(headers: Headers): string | null {
    const candidates = [
        headers.get("cf-connecting-ip"),
        headers.get("x-real-ip"),
        headers.get("x-forwarded-for")?.split(",")[0],
    ];

    for (const candidate of candidates) {
        const ip = candidate?.trim();
        if (ip && isValidIp(ip)) return ip;
    }

    return null;
}

/** Guards the `inet` column: an invalid value would fail the insert. */
export function isValidIp(value: string): boolean {
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4.test(value)) {
        return value.split(".").every((part) => Number(part) <= 255);
    }
    // Loose IPv6 check: hex groups and colons, optionally compressed.
    return /^[0-9a-f:]+$/i.test(value) && value.includes(":");
}
