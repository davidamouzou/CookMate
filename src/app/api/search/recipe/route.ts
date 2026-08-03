import { NextRequest, NextResponse } from "next/server";
import {
    GeminiError,
    SEARCH_MODEL,
    callGemini,
    callGeminiJson,
    isGeminiConfigured,
    parseImagePayload,
} from "@/lib/ai/gemini";
import {
    buildSearchPrompt,
    buildStructurePrompt,
    buildVisionPrompt,
    filterFound,
    normalizeFoundRecipe,
    rankRecipes,
    type FoundRecipe,
    type RecipeSearchCriteria,
    type RecipeSearchResponse,
} from "@/features/recipes/lib/recipe-search";

/**
 * Finds recipes that already exist on the web.
 *
 * This is the counterpart to /api/generate/recipe, not a replacement for it:
 * that route invents a recipe, this one searches for real ones and reports
 * where each came from. Three model calls, in order:
 *
 *   1. vision — read the ingredients off the visitor's photo (skipped if none)
 *   2. search — a Google-Search-grounded call that finds real pages
 *   3. structure — a plain JSON call that turns the findings into table rows
 *
 * Two calls rather than one because the API refuses `responseMimeType:
 * application/json` together with the search tool.
 */

/** ~4.5 MB of image once base64 is decoded — beyond that, resize client-side. */
const MAX_IMAGE_BASE64_LENGTH = 6_000_000;

const MAX_TEXT_LENGTH = 500;

type SearchBody = {
    text?: string;
    /** Data URL or bare base64. */
    image?: string;
    targetCalories?: number;
    minProtein?: number;
    mealType?: string;
    difficulty?: string;
    maxDuration?: number;
    language?: string;
};

export async function POST(request: NextRequest) {
    if (!isGeminiConfigured()) {
        return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    let body: SearchBody;
    try {
        body = (await request.json()) as SearchBody;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const image = body.image?.trim();
    if (image && image.length > MAX_IMAGE_BASE64_LENGTH) {
        return NextResponse.json({ error: "Image is too large" }, { status: 413 });
    }

    const criteria = readCriteria(body);
    const hasCriteria =
        Boolean(image) ||
        Boolean(criteria.text) ||
        Boolean(criteria.targetCalories) ||
        Boolean(criteria.minProtein) ||
        Boolean(criteria.mealType) ||
        Boolean(criteria.difficulty);

    if (!hasCriteria) {
        return NextResponse.json(
            { error: "Describe what you are looking for, add a photo, or set a nutrition target" },
            { status: 400 }
        );
    }

    try {
        // 1. Ingredients from the photo.
        const detected = image ? await detectIngredients(image, criteria.language) : [];
        if (detected.length > 0) {
            criteria.ingredients = [...(criteria.ingredients ?? []), ...detected];
        }

        // A photo that turned out to hold no food, with nothing else to go on,
        // is a dead end — say so instead of searching for "a recipe".
        if (image && detected.length === 0 && !criteria.text && !criteria.targetCalories && !criteria.minProtein) {
            return NextResponse.json({
                recipes: [],
                ingredients: [],
                sources: [],
                queries: [],
            } satisfies RecipeSearchResponse);
        }

        // 2. Grounded web search.
        const research = await callGemini({
            model: SEARCH_MODEL,
            prompt: buildSearchPrompt(criteria),
            search: true,
            temperature: 0.3,
        });

        if (research.text.includes("NO_RESULTS")) {
            return NextResponse.json({
                recipes: [],
                ingredients: detected,
                sources: research.sources,
                queries: research.queries,
            } satisfies RecipeSearchResponse);
        }

        // 3. Structure what was found.
        const structured = await callGeminiJson<{ recipes?: unknown[] }>({
            prompt: buildStructurePrompt(research.text, criteria),
            temperature: 0,
        });

        const recipes = rankRecipes(
            filterFound(
                (structured.recipes ?? [])
                    .filter((raw): raw is Record<string, unknown> => Boolean(raw) && typeof raw === "object")
                    .map((raw) => normalizeFoundRecipe(raw, criteria))
                    .filter((recipe): recipe is FoundRecipe => recipe !== null),
                criteria
            )
        );

        return NextResponse.json({
            recipes,
            ingredients: detected,
            sources: research.sources,
            queries: research.queries,
        } satisfies RecipeSearchResponse);
    } catch (error) {
        if (error instanceof GeminiError) {
            console.error("Recipe search failed:", error.message);
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        console.error("Recipe search failed:", error);
        return NextResponse.json({ error: "Recipe search failed" }, { status: 502 });
    }
}

/** Reads the ingredients off the photo. A failure here is not fatal. */
async function detectIngredients(image: string, language: string | undefined): Promise<string[]> {
    const parsed = parseImagePayload(image);
    if (!parsed) return [];

    try {
        const result = await callGeminiJson<{ ingredients?: unknown }>({
            prompt: buildVisionPrompt(language),
            image: parsed,
            temperature: 0,
        });

        if (!Array.isArray(result.ingredients)) return [];

        return result.ingredients
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map((item) => item.trim())
            .slice(0, 15);
    } catch (error) {
        // The search can still run on the text and nutrition targets alone.
        console.error("Ingredient detection failed:", error);
        return [];
    }
}

function readCriteria(body: SearchBody): RecipeSearchCriteria {
    return {
        text: typeof body.text === "string" ? body.text.trim().slice(0, MAX_TEXT_LENGTH) : undefined,
        targetCalories: bounded(body.targetCalories, 50, 3000),
        minProtein: bounded(body.minProtein, 1, 300),
        maxDuration: bounded(body.maxDuration, 1, 600),
        mealType: enumValue(body.mealType, ["breakfast", "lunch", "dinner", "snack", "dessert"]),
        difficulty: enumValue(body.difficulty, ["easy", "medium", "hard"]),
        language: body.language === "fr" ? "fr" : "en",
    };
}

/** Keeps a nonsense target from reaching the prompt. */
function bounded(value: unknown, min: number, max: number): number | null {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    const rounded = Math.round(value);
    return rounded >= min && rounded <= max ? rounded : null;
}

function enumValue(value: unknown, allowed: string[]): string | undefined {
    if (typeof value !== "string") return undefined;
    const normalised = value.trim().toLowerCase();
    return allowed.includes(normalised) ? normalised : undefined;
}
