import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
    reactStrictMode: true,

    env: {
        API_KEY: process.env.API_KEY,
        BASE_URL: process.env.BASE_URL,
    },
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**', // Autorise tous les domaines
            },
        ],
    },
};

export default withNextIntl(nextConfig);