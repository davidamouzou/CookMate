/**
 * Regenerates recipe photos and replaces the dead Firebase Storage URLs.
 *
 *   bun run images:regenerate -- --dry-run     # list what would be done
 *   bun run images:regenerate -- --limit=3     # try a few first
 *   bun run images:regenerate                  # the whole backlog
 *   bun run images:regenerate -- --all         # also redo recipes already fixed
 *
 * The original photos are unreachable (Firebase Storage answers 402 while the
 * billing account is suspended), so they cannot be copied — they are recreated
 * from each recipe's own text with the same image model the app uses, uploaded
 * to Supabase Storage, and written back to `recipes.image`.
 *
 * Costs money: one paid image generation per recipe. Start with --dry-run.
 *
 * Idempotent and resumable: recipes already served from Supabase Storage are
 * skipped, and progress is appended to backup/regenerated-images.json.
 */
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// A secret key is optional: with only the publishable key the update relies on
// the maintenance policy from supabase/migrations/0006_recipe_image_maintenance.sql.
const WRITE_KEY =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const IMAGE_KEY = process.env.IMAGE_GEN_MODEL_KEY;

const BUCKET = "recipe-images";
const LOG_PATH = "backup/regenerated-images.json";
const GETIMG_API_URL = "https://api.getimg.ai/v1/flux-schnell/text-to-image";
const FIREBASE_PREFIX = "https://firebasestorage.googleapis.com/";
/** getimg.ai is rate-limited and billed per call; stay sequential and polite. */
const DELAY_MS = 1200;

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const redoAll = args.includes("--all");
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : Infinity;

if (!SUPABASE_URL || !WRITE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.");
    process.exit(1);
}

if (!IMAGE_KEY && !isDryRun) {
    console.error(
        "Missing IMAGE_GEN_MODEL_KEY in .env — that is the getimg.ai key the app\n" +
        "already uses for /api/generate/image. Run with --dry-run to preview without it."
    );
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, WRITE_KEY, {
    auth: { persistSession: false },
});

type Recipe = {
    id: string;
    recipe_name: string;
    description: string | null;
    cuisine: string | null;
    image: string | null;
};

/** Deterministic path, so a re-run overwrites nothing and needs no lookup. */
function storagePath(recipeId: string): string {
    return `recipes/${recipeId}.jpg`;
}

function buildPrompt(recipe: Recipe): string {
    const subject = [recipe.recipe_name, recipe.cuisine ? `(${recipe.cuisine} cuisine)` : null]
        .filter(Boolean)
        .join(" ");
    const detail = recipe.description?.trim().slice(0, 300);

    return (
        `Professional food photography of ${subject}.` +
        (detail ? ` ${detail}` : "") +
        " Appetizing, well-lit, high resolution, on a beautiful plate, restaurant quality presentation."
    );
}

async function generateImage(recipe: Recipe): Promise<Uint8Array | null> {
    const response = await fetch(GETIMG_API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${IMAGE_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt: buildPrompt(recipe),
            width: 1024,
            height: 1024,
            steps: 4,
            output_format: "jpeg",
        }),
    });

    if (!response.ok) {
        console.error(`  ✗ generation failed (HTTP ${response.status}): ${await response.text()}`);
        return null;
    }

    const data = (await response.json()) as { image?: string };
    if (!data.image) {
        console.error("  ✗ no image in the model response");
        return null;
    }

    return Uint8Array.from(atob(data.image), (char) => char.charCodeAt(0));
}

// --- Load the backlog -------------------------------------------------------

const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, recipe_name, description, cuisine, image")
    .order("created_at", { ascending: true });

if (error) {
    console.error("Could not read recipes:", error.message);
    process.exit(1);
}

const backlog = (recipes as Recipe[]).filter((recipe) => {
    if (redoAll) return true;
    // Anything not yet served from our bucket needs a photo: dead Firebase
    // links, but also rows with no image at all.
    return !recipe.image?.includes(`/storage/v1/object/public/${BUCKET}/`);
});

const targets = backlog.slice(0, limit === Infinity ? undefined : limit);
const firebaseCount = targets.filter((r) => r.image?.startsWith(FIREBASE_PREFIX)).length;

console.log(`${recipes!.length} recipes, ${backlog.length} without a working photo.`);
console.log(`  ${firebaseCount} still point at Firebase, ${targets.length - firebaseCount} have no image.`);
console.log(`Processing ${targets.length}${isDryRun ? " (dry run — nothing is generated or written)" : ""}.\n`);

if (targets.length === 0) process.exit(0);

if (isDryRun) {
    let wouldBill = 0;

    for (const recipe of targets) {
        const { data: url } = supabase.storage.from(BUCKET).getPublicUrl(storagePath(recipe.id));
        const stored = redoAll
            ? null
            : await fetch(url.publicUrl, { method: "HEAD" }).catch(() => null);
        const reused = stored?.ok ?? false;
        if (!reused) wouldBill++;

        console.log(`  ${reused ? "·" : "$"} ${recipe.id}  ${recipe.recipe_name}`);
        if (!reused) console.log(`      prompt: ${buildPrompt(recipe).slice(0, 110)}…`);
    }

    console.log(
        `\n${wouldBill} image(s) would be generated and billed by getimg.ai; ` +
        `${targets.length - wouldBill} already in storage and reused for free.`
    );
    process.exit(0);
}

// --- Regenerate -------------------------------------------------------------

const log: Record<string, string> = existsSync(LOG_PATH)
    ? JSON.parse(await Bun.file(LOG_PATH).text())
    : {};

let replaced = 0;
const failures: { id: string; reason: string }[] = [];

for (const [index, recipe] of targets.entries()) {
    console.log(`[${index + 1}/${targets.length}] ${recipe.recipe_name}`);

    const path = storagePath(recipe.id);
    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

    // Generation is billed, so never pay twice for the same recipe: an object
    // already sitting at the deterministic path means a previous run generated
    // it but did not get to write the row back. Reuse it and go straight to the
    // update. `--all` forces a fresh image.
    const existing = redoAll
        ? null
        : await fetch(publicUrl.publicUrl, { method: "HEAD" }).catch(() => null);
    const alreadyGenerated = existing?.ok ?? false;

    if (alreadyGenerated) {
        console.log("  · image already in storage, reusing it (no generation billed)");
    } else {
        const bytes = await generateImage(recipe);
        if (!bytes) {
            failures.push({ id: recipe.id, reason: "generation" });
            continue;
        }

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, bytes, { contentType: "image/jpeg", upsert: redoAll });

        const raceLost = uploadError?.message?.toLowerCase().includes("already exists") ?? false;
        if (uploadError && !raceLost) {
            console.error(`  ✗ upload failed: ${uploadError.message}`);
            failures.push({ id: recipe.id, reason: `upload: ${uploadError.message}` });
            continue;
        }
    }

    const { data: updated, error: updateError } = await supabase
        .from("recipes")
        .update({ image: publicUrl.publicUrl })
        .eq("id", recipe.id)
        .select("id");

    if (updateError) {
        console.error(`  ✗ update failed: ${updateError.message}`);
        failures.push({ id: recipe.id, reason: `update: ${updateError.message}` });
        continue;
    }

    // RLS silently matches zero rows rather than erroring when the policy does
    // not allow the row — surface that, it is the usual cause here.
    if (!updated || updated.length === 0) {
        console.error(
            "  ✗ update matched no row — row-level security blocked it.\n" +
            "    Apply supabase/migrations/0006_recipe_image_maintenance.sql, or set\n" +
            "    SUPABASE_SECRET_KEY in .env."
        );
        failures.push({ id: recipe.id, reason: "update blocked by RLS" });
        continue;
    }

    log[recipe.id] = publicUrl.publicUrl;
    replaced++;
    console.log("  ✓ replaced");

    // Only pause between paid calls; reusing a stored image needs no throttle.
    if (!alreadyGenerated && index < targets.length - 1) await Bun.sleep(DELAY_MS);
}

await mkdir("backup", { recursive: true });
await writeFile(LOG_PATH, JSON.stringify(log, null, 2));

console.log(`\nReplaced ${replaced}/${targets.length}. Failures: ${failures.length}.`);

if (failures.length > 0) {
    const byReason = failures.reduce<Record<string, number>>((acc, failure) => {
        acc[failure.reason] = (acc[failure.reason] ?? 0) + 1;
        return acc;
    }, {});
    console.log("Failures by reason:", byReason);
    process.exit(1);
}

console.log("Remember to drop the maintenance policy:");
console.log('  drop policy "Maintenance: replace dead recipe images" on public.recipes;');
process.exit(0);
