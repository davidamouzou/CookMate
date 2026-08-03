import type { NextRequest } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { extractClientIp, parseUserAgent } from "@/lib/analytics/user-agent";
import { extractGeo } from "@/lib/analytics/geo";

/**
 * Records one page view: IP, device and location.
 *
 * Called from the middleware behind `waitUntil`, so it never blocks the
 * response. Failures are swallowed on purpose — telemetry must not break
 * navigation.
 *
 * The location comes from the CDN edge headers, which are free and require no
 * third-party geolocation lookup — see `geo.ts`. They are absent in local dev,
 * where the row is written with the location columns null.
 */
export async function recordVisit(request: NextRequest): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
        const headers = request.headers;
        const userAgent = headers.get("user-agent");
        const { deviceType, os, browser, isBot } = parseUserAgent(userAgent);
        const geo = extractGeo(headers);

        const { pathname } = request.nextUrl;
        const locale = pathname.split("/")[1];

        await supabase.from("visits").insert({
            ip: extractClientIp(headers),
            country: geo.country,
            region: geo.region,
            region_code: geo.regionCode,
            city: geo.city,
            postal_code: geo.postalCode,
            continent: geo.continent,
            timezone: geo.timezone,
            latitude: geo.latitude,
            longitude: geo.longitude,
            device_type: deviceType,
            os,
            browser,
            user_agent: userAgent,
            is_bot: isBot,
            path: pathname,
            locale: locale === "fr" || locale === "en" ? locale : null,
            referrer: headers.get("referer"),
        });
    } catch {
        // Never surface telemetry errors to the visitor.
    }
}
