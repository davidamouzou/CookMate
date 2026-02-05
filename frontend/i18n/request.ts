import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    const locale = await requestLocale;
    console.log('request.ts locale:', locale);

    // Ensure that a valid locale is used
    const resolvedLocale = locale && routing.locales.includes(locale as "fr" | "en")
        ? (locale as "fr" | "en")
        : routing.defaultLocale;

    return {
        locale: resolvedLocale,
        messages: (await import(`../messages/${resolvedLocale}.json`)).default
    };
});
