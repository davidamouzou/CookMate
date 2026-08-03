/**
 * Upserts the exported Firestore recipes into the Supabase `recipes` table,
 * rewriting image URLs to their Supabase Storage equivalent when available.
 *
 *   bun run migrate:import
 *
 * Idempotent: rows are upserted on their original Firestore id, so re-running
 * after `migrate:images` succeeds will simply refresh the image URLs.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const EXPORT_PATH = "backup/firestore-recipes.json";
const MAP_PATH = "backup/image-map.json";

if (!SUPABASE_URL || !PUBLISHABLE_KEY) {
    console.error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env."
    );
    process.exit(1);
}

if (!existsSync(EXPORT_PATH)) {
    console.error(`Missing ${EXPORT_PATH}. Run \`bun run migrate:export\` first.`);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false },
});

type FirestoreRecipe = Record<string, unknown> & { id: string };

const recipes: FirestoreRecipe[] = JSON.parse(await Bun.file(EXPORT_PATH).text());
const imageMap: Record<string, string> = existsSync(MAP_PATH)
    ? JSON.parse(await Bun.file(MAP_PATH).text())
    : {};

const asStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.map(String) : [];

const asNumber = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? value : null;

const asString = (value: unknown): string | null =>
    typeof value === "string" && value.length > 0 ? value : null;

let unmappedImages = 0;

const rows = recipes.map((recipe) => {
    const originalImage = asString(recipe.image);
    const mapped = originalImage ? imageMap[originalImage] : null;

    if (originalImage && !mapped) unmappedImages++;

    return {
        // Preserve the Firestore document id so /recipes/[id] URLs keep working.
        id: recipe.id,
        recipe_name: asString(recipe.recipe_name) ?? "Untitled recipe",
        description: asString(recipe.description),
        // Fall back to the Firebase URL when the photo could not be copied yet,
        // so re-running after migrate:images heals the row.
        image: mapped ?? originalImage,
        ingredients: asStringArray(recipe.ingredients),
        instructions: asStringArray(recipe.instructions),
        continent: asString(recipe.continent),
        language: asString(recipe.language),
        duration_to_cook: asNumber(recipe.duration_to_cook),
        servings: asNumber(recipe.servings),
        difficulty: asString(recipe.difficulty),
        cuisine: asString(recipe.cuisine),
        meal_type: asString(recipe.meal_type),
        nutrition_facts:
            recipe.nutrition_facts && typeof recipe.nutrition_facts === "object"
                ? recipe.nutrition_facts
                : {},
        created_by: asString(recipe.created_by) ?? "anonymous",
        created_at: asString(recipe.created_at) ?? new Date().toISOString(),
    };
});

// ON CONFLICT DO NOTHING only needs INSERT rights, which the "Anyone can submit
// a recipe" policy grants to the publishable key. Rows that already exist are
// therefore skipped, not overwritten — re-running is safe but will not refresh
// image URLs. To refresh them, delete the affected rows and import again.
const { error, count } = await supabase
    .from("recipes")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true, count: "exact" });

if (error) {
    console.error("Import failed:", error.message);
    process.exit(1);
}

console.log(`Inserted ${count ?? 0} new recipes (${rows.length} in the export, existing ids skipped).`);

if (unmappedImages > 0) {
    console.log(
        `\n${unmappedImages} recipe(s) still point at Firebase Storage because the\n` +
        "photo could not be copied. Run `bun run migrate:images` once Firebase\n" +
        "billing is restored, then re-run this import to rewrite the URLs."
    );
}

process.exit(0);
