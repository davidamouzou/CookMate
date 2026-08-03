import { describe, expect, it } from "vitest";
import { extractGeo, formatLocation } from "./geo";

const headers = (values: Record<string, string>) => new Headers(values);

describe("extractGeo", () => {
    it("reads the Cloudflare location headers", () => {
        const geo = extractGeo(
            headers({
                "cf-ipcountry": "FR",
                "cf-region": "Île-de-France",
                "cf-region-code": "IDF",
                "cf-ipcity": "Paris",
                "cf-postal-code": "75001",
                "cf-ipcontinent": "EU",
                "cf-timezone": "Europe/Paris",
                "cf-iplatitude": "48.8566",
                "cf-iplongitude": "2.3522",
            })
        );

        expect(geo).toEqual({
            country: "FR",
            region: "Île-de-France",
            regionCode: "IDF",
            city: "Paris",
            postalCode: "75001",
            continent: "EU",
            timezone: "Europe/Paris",
            latitude: 48.8566,
            longitude: 2.3522,
        });
    });

    it("falls back to the Vercel headers and decodes escaped city names", () => {
        const geo = extractGeo(
            headers({
                "x-vercel-ip-country": "US",
                "x-vercel-ip-city": "San%20Francisco",
                "x-vercel-ip-latitude": "37.7749",
                "x-vercel-ip-longitude": "-122.4194",
            })
        );

        expect(geo.country).toBe("US");
        expect(geo.city).toBe("San Francisco");
        expect(geo.longitude).toBe(-122.4194);
    });

    it("returns nulls in local dev, where no edge header exists", () => {
        const geo = extractGeo(headers({ "user-agent": "curl/8.0" }));
        expect(Object.values(geo).every((value) => value === null)).toBe(true);
    });

    it("treats the edge placeholders as unknown", () => {
        // Cloudflare answers XX when it cannot resolve the address, and T1 for
        // a Tor exit node. Neither is a country.
        expect(extractGeo(headers({ "cf-ipcountry": "XX" })).country).toBeNull();
        expect(extractGeo(headers({ "cf-ipcountry": "T1" })).country).toBeNull();
    });

    it("rejects coordinates that are not real ones", () => {
        expect(extractGeo(headers({ "cf-iplatitude": "not-a-number" })).latitude).toBeNull();
        // Latitude only runs to ±90; anything past that is a broken header.
        expect(extractGeo(headers({ "cf-iplatitude": "120" })).latitude).toBeNull();
        expect(extractGeo(headers({ "cf-iplongitude": "-181" })).longitude).toBeNull();
    });

    it("keeps a zero coordinate", () => {
        expect(extractGeo(headers({ "cf-iplatitude": "0" })).latitude).toBe(0);
    });
});

describe("formatLocation", () => {
    it("joins the parts it has", () => {
        const geo = extractGeo(
            headers({ "cf-ipcountry": "FR", "cf-ipcity": "Paris", "cf-region": "Île-de-France" })
        );
        expect(formatLocation(geo)).toBe("Paris, Île-de-France, FR");
    });

    it("collapses a region that repeats the country", () => {
        const geo = extractGeo(headers({ "cf-ipcountry": "FR", "cf-region": "fr" }));
        expect(formatLocation(geo)).toBe("FR");
    });

    it("is null when nothing resolved", () => {
        expect(formatLocation(extractGeo(headers({})))).toBeNull();
    });
});
