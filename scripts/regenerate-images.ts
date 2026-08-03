/**
 * Regenerates the photo of every recipe whose image fails to load.
 *
 *   bun run images:regenerate -- --dry-run     # list what would be done
 *   bun run images:regenerate -- --limit=3     # try a few first
 *   bun run images:regenerate                  # the whole backlog
 *   bun run images:regenerate -- --all         # also redo recipes that load fine
 *
 * A recipe needs a new photo when its `image` column does not actually serve an
 * image: no URL at all, a dead Firebase Storage link (402 while the billing
 * account is suspended), or a Supabase URL whose object has since gone missing.
 * The URL alone does not say which — every one is fetched and checked, so a
 * broken image is caught wherever it is hosted, ours included.
 *
 * Broken photos cannot be copied from anywhere, so they are recreated from each
 * recipe's own text with the same image model the app uses, uploaded to Supabase
 * Storage, and written back to `recipes.image`.
 *
 * Costs money: one paid image generation per recipe. Start with --dry-run.
 *
 * Idempotent and resumable: recipes whose photo already loads are skipped, and
 * progress is appended to backup/regenerated-images.json.
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
/** getimg.ai is rate-limited and billed per call; stay sequential and polite. */
const DELAY_MS = 1200;
/** Health checks are free HEADs against two hosts — a small pool is plenty. */
const CHECK_CONCURRENCY = 8;
const CHECK_TIMEOUT_MS = 15_000;

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

/**
 * Whether a URL really serves an image, the same way the browser finds out.
 *
 * Deliberately lenient: a regeneration is billed, so only answer "broken" on
 * hard evidence — an error status, an unreachable host, or a body the browser
 * could not paint (an error page served as JSON/HTML, or an empty object).
 * Anything ambiguous (a missing content-type, a HEAD the host refuses) counts
 * as healthy and is left alone rather than paid for again.
 */
type ImageCheck = {
    /** Why the image cannot be shown, or null when it loads. */
    broken: string | null;
    /** HTTP status, or null when the host could not be reached at all. */
    status: number | null;
};

async function checkImage(url: string | null): Promise<ImageCheck> {
    if (!url) return { broken: "no image", status: null };

    let response: Response;
    try {
        response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(CHECK_TIMEOUT_MS) });
    } catch (error) {
        const detail = error instanceof Error ? error.message : "fetch failed";
        return { broken: `unreachable: ${detail}`, status: null };
    }

    // Some hosts reject HEAD but serve GET fine; confirm before condemning it.
    if (response.status === 405 || response.status === 501) {
        try {
            response = await fetch(url, {
                method: "GET",
                headers: { Range: "bytes=0-0" },
                signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
            });
        } catch (error) {
            const detail = error instanceof Error ? error.message : "fetch failed";
            return { broken: `unreachable: ${detail}`, status: null };
        }
    }

    const status = response.status;
    if (!response.ok) return { broken: `HTTP ${status}`, status };

    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.startsWith("image/")) {
        return { broken: `not an image (${contentType.split(";")[0]})`, status };
    }

    const length = response.headers.get("content-length");
    if (length !== null && Number(length) === 0) return { broken: "empty file", status };

    return { broken: null, status };
}

/** Runs `task` over `items` with a bounded pool, preserving input order. */
async function mapPool<T, R>(items: T[], size: number, task: (item: T) => Promise<R>): Promise<R[]> {
    const results = new Array<R>(items.length);
    let cursor = 0;

    const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await task(items[index]);
        }
    });

    await Promise.all(workers);
    return results;
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

const all = recipes as Recipe[];

// Which photos are actually broken is a property of the URL's response, not of
// its shape: our own bucket can 404 once an object is deleted, and a link that
// looks dead may still serve. Ask every one of them.
console.log(`Checking ${all.length} recipe image(s)…`);
const health = await mapPool(all, CHECK_CONCURRENCY, (recipe) => checkImage(recipe.image));

/** The reason each recipe is in the backlog, for the report and the reuse rule. */
const broken = new Map<string, string>();
all.forEach((recipe, index) => {
    const reason = health[index].broken;
    if (reason) broken.set(recipe.id, reason);
});

const backlog = redoAll ? all : all.filter((recipe) => broken.has(recipe.id));
const targets = backlog.slice(0, limit === Infinity ? undefined : limit);

const byReason = backlog.reduce<Record<string, number>>((acc, recipe) => {
    const reason = broken.get(recipe.id) ?? "loads fine (forced by --all)";
    acc[reason] = (acc[reason] ?? 0) + 1;
    return acc;
}, {});

console.log(`\n${all.length} recipes, ${broken.size} whose photo fails to load.`);
for (const [reason, count] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count}x ${reason}`);
}
console.log(`Processing ${targets.length}${isDryRun ? " (dry run — nothing is generated or written)" : ""}.\n`);

if (targets.length === 0) {
    console.log("Every recipe photo loads. Nothing to do.");
    process.exit(0);
}

/**
 * What is sitting at a recipe's deterministic storage path.
 *
 * `usable` lets a run skip the billed call and go straight to the row update —
 * a previous run generated the photo but did not get to write the row back.
 * `broken` additionally means the upload has to overwrite rather than insert,
 * or the row would keep pointing at an unusable file.
 */
type StoredState = "usable" | "broken" | "absent";

async function storedImageState(recipe: Recipe, publicUrl: string): Promise<StoredState> {
    // The row's own failing URL: already checked, and known bad. Re-probing it
    // would just repeat the request that failed.
    if (recipe.image === publicUrl && broken.has(recipe.id)) return "broken";

    const check = await checkImage(publicUrl);
    if (!check.broken) return "usable";

    // Storage answers 400 or 404 for a key it does not hold — nothing to reuse
    // and nothing to overwrite, so a plain insert will do.
    return check.status === 404 || check.status === 400 ? "absent" : "broken";
}

if (isDryRun) {
    let wouldBill = 0;

    for (const recipe of targets) {
        const { data: url } = supabase.storage.from(BUCKET).getPublicUrl(storagePath(recipe.id));
        const stored = await storedImageState(recipe, url.publicUrl);
        const reused = stored === "usable" && !redoAll;
        if (!reused) wouldBill++;

        const reason = broken.get(recipe.id) ?? "forced by --all";
        console.log(`  ${reused ? "·" : "$"} ${recipe.id}  ${recipe.recipe_name}  (${reason})`);
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
    const reason = broken.get(recipe.id) ?? "forced by --all";
    console.log(`[${index + 1}/${targets.length}] ${recipe.recipe_name} — ${reason}`);

    const path = storagePath(recipe.id);
    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

    // Generation is billed, so never pay twice for the same recipe: reuse a
    // usable object instead of regenerating it. `--all` forces a fresh photo.
    const stored = await storedImageState(recipe, publicUrl.publicUrl);
    const alreadyGenerated = stored === "usable" && !redoAll;

    if (alreadyGenerated) {
        console.log("  · image already in storage, reusing it (no generation billed)");
    } else {
        const bytes = await generateImage(recipe);
        if (!bytes) {
            failures.push({ id: recipe.id, reason: "generation" });
            continue;
        }

        // Overwrite only when something unusable is in the way. Plain inserts
        // work with just the publishable key; upsert needs the extra storage
        // policy from 0007, so do not ask for it unless it is really needed.
        const mustOverwrite = stored !== "absent";
        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, bytes, { contentType: "image/jpeg", upsert: mustOverwrite });

        const raceLost = uploadError?.message?.toLowerCase().includes("already exists") ?? false;
        if (uploadError && !raceLost) {
            console.error(`  ✗ upload failed: ${uploadError.message}`);
            if (mustOverwrite) {
                console.error(
                    "    Overwriting a broken object needs update rights: apply\n" +
                    "    supabase/migrations/0007_recipe_image_repair.sql, or set SUPABASE_SECRET_KEY."
                );
            }
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
            "    0006 only unlocks rows still pointing at Firebase; a recipe with no\n" +
            "    image, or a Supabase URL whose object went missing, needs\n" +
            "    supabase/migrations/0007_recipe_image_repair.sql — or SUPABASE_SECRET_KEY in .env."
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

console.log("Remember to drop the maintenance policies:");
console.log('  drop policy "Maintenance: replace dead recipe images" on public.recipes;');
console.log('  drop policy "Maintenance: repair broken recipe images" on public.recipes;');
console.log('  drop policy "Maintenance: overwrite a broken recipe image" on storage.objects;');
process.exit(0);
