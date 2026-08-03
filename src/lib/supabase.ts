import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const missingSupabaseMessage =
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.";

// The publishable key is a public credential; row-level security is what
// protects the data. Falling back to placeholders keeps `createClient` from
// throwing during builds without env vars — callers gate on
// `isSupabaseConfigured`.
export const supabase = createClient<Database>(
    supabaseUrl ?? "https://placeholder.supabase.co",
    supabasePublishableKey ?? "placeholder-publishable-key",
    {
        auth: {
            // The tracking screens need a stable per-user session so row-level
            // security can scope entries to `auth.uid()`.
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
        },
    }
);

export const RECIPE_IMAGES_BUCKET = "recipe-images";
