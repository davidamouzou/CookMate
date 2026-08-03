import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
    reactStrictMode: true,

    // Supabase credentials use the NEXT_PUBLIC_ prefix and are picked up
    // automatically, so they do not belong here.
    // These two are server-only (read by the /api/generate routes). They are
    // inlined wherever they are referenced, so never reference them from a
    // client component.
    env: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        IMAGE_GEN_MODEL_KEY: process.env.IMAGE_GEN_MODEL_KEY,
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