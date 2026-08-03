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
        // Optional model overrides, read by src/lib/ai/gemini.ts. Listed here
        // so an override still applies once the app runs on Workers, where
        // process.env is not populated from the shell.
        GEMINI_MODEL: process.env.GEMINI_MODEL,
        GEMINI_SEARCH_MODEL: process.env.GEMINI_SEARCH_MODEL,
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