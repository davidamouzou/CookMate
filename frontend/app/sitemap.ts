import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.BASE_URL || 'https://yourdomain.com';
    const locales = ['en', 'fr'];
    const currentDate = new Date();

    // Define your static routes
    const staticRoutes = ['', '/about', '/contact', '/blog', '/recipes'];

    // Generate sitemap entries for each locale and route
    const sitemapEntries: MetadataRoute.Sitemap = [];

    locales.forEach((locale) => {
        staticRoutes.forEach((route) => {
            sitemapEntries.push({
                url: `${baseUrl}/${locale}${route}`,
                lastModified: currentDate,
                changeFrequency: route === '' || route === '/recipes' ? 'daily' : 'weekly',
                priority: route === '' ? 1.0 : 0.8,
            });
        });
    });

    return sitemapEntries;
}
