/**
 * Visitor location, read from the CDN edge headers.
 *
 * The edge already resolves the IP to a place before the request reaches us,
 * so there is no third-party geolocation lookup and no extra latency. Two
 * vocabularies are supported: Cloudflare's `cf-*` headers (production, via the
 * "Add visitor location headers" managed transform) and Vercel's
 * `x-vercel-ip-*` (preview deploys). Neither exists in local dev, where every
 * field comes back null.
 *
 * Precision is city-level at best — this is a rough origin, not a GPS fix.
 */
export type GeoLocation = {
    country: string | null;
    region: string | null;
    regionCode: string | null;
    city: string | null;
    postalCode: string | null;
    continent: string | null;
    timezone: string | null;
    latitude: number | null;
    longitude: number | null;
};

export const EMPTY_GEO: GeoLocation = {
    country: null,
    region: null,
    regionCode: null,
    city: null,
    postalCode: null,
    continent: null,
    timezone: null,
    latitude: null,
    longitude: null,
};

/**
 * Values the edge sends when it could not resolve the address. Cloudflare uses
 * `XX` for unknown and `T1` for Tor exits; both would otherwise be stored as if
 * they were real ISO codes.
 */
const PLACEHOLDERS = new Set(["", "xx", "t1", "unknown", "null", "undefined"]);

/**
 * Reads a header, decoding percent-escapes. Vercel URL-encodes city names
 * ("San%20Francisco") because header values must stay ASCII.
 */
function readHeader(headers: Headers, ...names: string[]): string | null {
    for (const name of names) {
        const raw = headers.get(name)?.trim();
        if (!raw || PLACEHOLDERS.has(raw.toLowerCase())) continue;

        try {
            const decoded = decodeURIComponent(raw).trim();
            if (decoded && !PLACEHOLDERS.has(decoded.toLowerCase())) return decoded;
        } catch {
            // Malformed escape sequence: the raw value is still usable.
            return raw;
        }
    }

    return null;
}

/** Coordinates arrive as strings and are occasionally empty or malformed. */
function readCoordinate(
    headers: Headers,
    limit: number,
    ...names: string[]
): number | null {
    const raw = readHeader(headers, ...names);
    if (raw === null) return null;

    const value = Number.parseFloat(raw);
    return Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
}

export function extractGeo(headers: Headers): GeoLocation {
    return {
        country: readHeader(headers, "cf-ipcountry", "x-vercel-ip-country"),
        region: readHeader(headers, "cf-region", "x-vercel-ip-country-region"),
        regionCode: readHeader(headers, "cf-region-code"),
        city: readHeader(headers, "cf-ipcity", "x-vercel-ip-city"),
        postalCode: readHeader(headers, "cf-postal-code", "x-vercel-ip-postal-code"),
        continent: readHeader(headers, "cf-ipcontinent", "x-vercel-ip-continent"),
        timezone: readHeader(headers, "cf-timezone", "x-vercel-ip-timezone"),
        latitude: readCoordinate(headers, 90, "cf-iplatitude", "x-vercel-ip-latitude"),
        longitude: readCoordinate(headers, 180, "cf-iplongitude", "x-vercel-ip-longitude"),
    };
}

/** "Paris, FR" — for logs and admin views. Null when nothing resolved. */
export function formatLocation(geo: GeoLocation): string | null {
    const parts = [geo.city, geo.region, geo.country].filter(
        (part): part is string => Boolean(part)
    );

    // Some edges repeat the country as the region, which would read
    // "Paris, FR, FR". On a duplicate the broader label wins, because that is
    // the one whose spelling is canonical.
    const unique = parts.filter(
        (part, index) =>
            !parts.slice(index + 1).some((broader) => broader.toLowerCase() === part.toLowerCase())
    );

    return unique.length > 0 ? unique.join(", ") : null;
}
