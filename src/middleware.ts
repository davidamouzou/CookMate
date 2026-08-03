import createMiddleware from 'next-intl/middleware';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { recordVisit } from './lib/analytics/record-visit';

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request: NextRequest, event: NextFetchEvent) {
    // Fire-and-forget: the visit is written after the response is sent, so
    // telemetry never adds latency to navigation.
    event.waitUntil(recordVisit(request));

    return handleI18nRouting(request);
}

export const config = {
    // Match only internationalized pathnames
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/(fr|en)/:path*']
};
