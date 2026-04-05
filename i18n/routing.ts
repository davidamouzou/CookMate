import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
    // A list of all locales that are supported
    locales,

    // Used when no locale matches
    defaultLocale: 'en'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will assist with routing strategy.
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
