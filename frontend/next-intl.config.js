export default async function getConfig(locale) {
    const loc = locale || 'en';
    try {
        const messages = (await import(`./messages/${loc}.json`)).default;
        return {
            locales: ['en', 'fr'],
            defaultLocale: 'en',
            messages,
        };
    } catch (err) {
        // If messages for the locale cannot be found, rethrow with helpful message
        throw new Error(
            `Could not load messages for locale "${loc}". Make sure ./messages/${loc}.json exists.`
        );
    }
}
