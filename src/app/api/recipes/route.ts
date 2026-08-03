import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { extractClientIp } from "@/lib/analytics/user-agent";
import { extractGeo } from "@/lib/analytics/geo";
import { normalizeFoundRecipe } from "@/features/recipes/lib/recipe-search";
import type { RecipeInsert, RecipeRow } from "@/lib/database.types";

/**
 * Stores a recipe and logs who submitted it.
 *
 * The insert moved server-side for one reason: the client cannot see its own
 * public IP, and asking it for one would mean trusting whatever it claimed.
 * Here the address comes from the edge headers on the request itself.
 *
 * The IP is written to `recipe_submissions`, not to `recipes` — `recipes` is
 * world-readable, so an `ip` column there would publish every contributor's
 * address. See supabase/migrations/0008.
 */

const PostgresUniqueViolation = "23505";

export async function POST(request: NextRequest) {
    if (!isSupabaseConfigured) {
        return NextResponse.json({ error: "Database is not configured" }, { status: 500 });
    }

    let body: Record<string, unknown>;
    try {
        body = (await request.json()) as Record<string, unknown>;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const raw = (body.recipe ?? body) as Record<string, unknown>;
    const language = typeof raw.language === "string" ? raw.language : "en";

    // The same validation the search route runs its results through: a client
    // can post anything, so nothing here is taken on trust.
    const draft = normalizeFoundRecipe(raw, { language });
    if (!draft) {
        return NextResponse.json(
            { error: "A recipe needs a name, ingredients and instructions" },
            { status: 400 }
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { match: _match, ...payload } = draft;

    const insert: RecipeInsert = {
        ...payload,
        image: storageUrl(raw.image) ?? "",
        created_by: text(raw.created_by)?.slice(0, 120) ?? "anonymous",
    };

    const { data, error } = await supabase
        .from("recipes")
        .insert(insert)
        .select("*")
        .single();

    // The same web page imported twice: hand back the row that already exists
    // rather than a failure the visitor can do nothing about.
    if (error?.code === PostgresUniqueViolation && insert.source_url) {
        const existing = await supabase
            .from("recipes")
            .select("*")
            .eq("source_url", insert.source_url)
            .maybeSingle();

        if (existing.data) {
            return NextResponse.json({ recipe: existing.data, duplicate: true });
        }
    }

    if (error || !data) {
        console.error("Failed to save recipe:", error?.message);
        return NextResponse.json({ error: "Failed to save recipe" }, { status: 500 });
    }

    await logSubmission(request, data);

    return NextResponse.json({ recipe: data, duplicate: false });
}

/**
 * Records the IP and location behind a submission. Best-effort: the recipe is
 * already stored, and losing the attribution row must not fail the request.
 */
async function logSubmission(request: NextRequest, recipe: RecipeRow): Promise<void> {
    try {
        const headers = request.headers;
        const geo = extractGeo(headers);
        const userAgent = headers.get("user-agent");
        const locale = new URL(request.url).searchParams.get("locale");

        const { error } = await supabase.from("recipe_submissions").insert({
            recipe_id: recipe.id,
            ip: extractClientIp(headers),
            country: geo.country,
            region: geo.region,
            city: geo.city,
            postal_code: geo.postalCode,
            timezone: geo.timezone,
            latitude: geo.latitude,
            longitude: geo.longitude,
            user_agent: userAgent,
            locale: locale === "fr" || locale === "en" ? locale : null,
            origin: recipe.origin,
        });

        if (error) console.error("Failed to log recipe submission:", error.message);
    } catch (error) {
        console.error("Failed to log recipe submission:", error);
    }
}

function text(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * The image must be a URL we produced. Anything else — a data URL, a hotlink
 * to a third-party CDN — is dropped, and the card falls back to its
 * placeholder.
 */
function storageUrl(value: unknown): string | null {
    const raw = text(value);
    if (!raw) return null;

    try {
        const url = new URL(raw);
        if (url.protocol !== "https:") return null;

        const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
        return url.hostname === supabaseHost ? url.toString() : null;
    } catch {
        return null;
    }
}
