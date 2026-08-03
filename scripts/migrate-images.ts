/**
 * Copies every recipe photo from Firebase Storage to Supabase Storage and
 * records the old URL -> new URL mapping in backup/image-map.json.
 *
 *   bun run migrate:images
 *
 * Safe to re-run: already-migrated URLs are skipped, so it can be resumed
 * after a partial failure (e.g. Firebase billing being restored mid-way).
 */
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const BUCKET = "recipe-images";
const MAP_PATH = "backup/image-map.json";
const EXPORT_PATH = "backup/firestore-recipes.json";

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

type Recipe = { id: string; image?: string };

const recipes: Recipe[] = JSON.parse(await Bun.file(EXPORT_PATH).text());
const imageMap: Record<string, string> = existsSync(MAP_PATH)
    ? JSON.parse(await Bun.file(MAP_PATH).text())
    : {};

/** Derives a stable object path so re-runs overwrite instead of duplicating. */
function targetPath(recipeId: string, sourceUrl: string): string {
    const match = decodeURIComponent(sourceUrl).match(/\.(jpe?g|png|webp|gif)/i);
    const extension = (match?.[1] ?? "jpg").toLowerCase();
    return `recipes/${recipeId}.${extension}`;
}

let migrated = 0;
let skipped = 0;
const failures: { id: string; status: string }[] = [];

for (const recipe of recipes) {
    const sourceUrl = recipe.image;

    if (!sourceUrl) {
        skipped++;
        continue;
    }

    if (imageMap[sourceUrl]) {
        skipped++;
        continue;
    }

    let response: Response;
    try {
        response = await fetch(sourceUrl);
    } catch (error) {
        failures.push({ id: recipe.id, status: error instanceof Error ? error.message : "fetch failed" });
        continue;
    }

    if (!response.ok) {
        // 402 means the Firebase billing account is suspended: the photo is not
        // gone, it is just unreachable until billing is restored. Re-run later.
        failures.push({ id: recipe.id, status: `HTTP ${response.status}` });
        continue;
    }

    const blob = await response.blob();
    const path = targetPath(recipe.id, sourceUrl);
    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    // `upsert` would need an UPDATE policy on storage.objects, which the
    // publishable key does not have. Uploading fresh and treating an existing
    // object as success keeps the script re-runnable with insert rights only.
    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType, upsert: false });

    const alreadyUploaded = error?.message?.toLowerCase().includes("already exists") ?? false;

    if (error && !alreadyUploaded) {
        failures.push({ id: recipe.id, status: `upload: ${error.message}` });
        continue;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    imageMap[sourceUrl] = data.publicUrl;
    migrated++;
    console.log(`  ✓ ${recipe.id} -> ${path}`);
}

await mkdir("backup", { recursive: true });
await writeFile(MAP_PATH, JSON.stringify(imageMap, null, 2));

console.log(`\nMigrated ${migrated}, already done ${skipped}, failed ${failures.length}.`);

if (failures.length > 0) {
    const byStatus = failures.reduce<Record<string, number>>((acc, f) => {
        acc[f.status] = (acc[f.status] ?? 0) + 1;
        return acc;
    }, {});
    console.log("Failures by status:", byStatus);
    if (Object.keys(byStatus).some((s) => s.includes("402"))) {
        console.log(
            "\nHTTP 402 = Firebase billing account suspended. Restore billing at\n" +
            "https://console.cloud.google.com/billing then re-run this script;\n" +
            "images already copied are skipped."
        );
    }
    process.exit(1);
}

process.exit(0);
