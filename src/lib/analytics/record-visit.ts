import type { NextRequest } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { extractClientIp, parseUserAgent } from "@/lib/analytics/user-agent";

/**
 * Records one page view: IP, device and country.
 *
 * Called from the middleware behind `waitUntil`, so it never blocks the
 * response. Failures are swallowed on purpose — telemetry must not break
 * navigation.
 *
 * Country/city/timezone come from the Cloudflare edge headers, which are free
 * and require no third-party geolocation lookup. They are absent in local dev.
 */
export async function recordVisit(request: NextRequest): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
        const headers = request.headers;
        const userAgent = headers.get("user-agent");
        const { deviceType, os, browser, isBot } = parseUserAgent(userAgent);

        const { pathname } = request.nextUrl;
        const locale = pathname.split("/")[1];

        await supabase.from("visits").insert({
            ip: extractClientIp(headers),
            country: headers.get("cf-ipcountry"),
            city: headers.get("cf-ipcity"),
            timezone: headers.get("cf-timezone"),
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
