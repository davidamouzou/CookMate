import type { NutritionFacts, RecipeDraft } from "@/features/recipes/types/recipe";

/**
 * What the visitor is looking for. Every field is optional — the finder runs
 * with a photo alone, a calorie target alone, or any mix.
 */
export type RecipeSearchCriteria = {
    /** Free text: "something with the leftovers in the fridge". */
    text?: string;
    /** Ingredients, typed or read off a photo. */
    ingredients?: string[];
    /** kcal per serving. */
    targetCalories?: number | null;
    /** Grams of protein per serving, as a floor. */
    minProtein?: number | null;
    mealType?: string;
    difficulty?: string;
    /** Minutes. */
    maxDuration?: number | null;
    language?: string;
};

export type RecipeMatch = {
    /** kcal per serving, parsed out of the nutrition facts. */
    calories: number | null;
    /** Grams of protein per serving. */
    protein: number | null;
    /** 0…1, where 1 hits every target that was asked for. */
    score: number;
};

export type FoundRecipe = RecipeDraft & {
    match: RecipeMatch;
};

/** The body of a POST /api/search/recipe response. */
export type RecipeSearchResponse = {
    recipes: FoundRecipe[];
    /** What the vision pass read off the photo, so the UI can show it back. */
    ingredients: string[];
    /** Every page the search was grounded in, whether or not it yielded a recipe. */
    sources: { title: string; url: string }[];
    queries: string[];
};

const LANGUAGE_NAMES: Record<string, string> = {
    fr: "French",
    en: "English",
    es: "Spanish",
    de: "German",
};

export function languageName(locale: string | undefined): string {
    return LANGUAGE_NAMES[locale ?? ""] ?? "English";
}

/**
 * Reads a number out of a nutrition string.
 *
 * The values come back as prose ("450 kcal", "25 g", "12,5g", "400-500 kcal"),
 * because that is how recipe sites write them and how the model echoes them.
 * A range is averaged; anything unreadable is null rather than 0, so "unknown"
 * stays distinguishable from "zero".
 */
export function parseNutritionAmount(value: string | number | undefined | null): number | null {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (!value) return null;

    // Normalise the French decimal comma, but only between digits — a comma
    // separating two values ("400, 500") is not a decimal point.
    const normalised = value.replace(/(\d),(\d)/g, "$1.$2");
    const numbers = normalised.match(/\d+(?:\.\d+)?/g);
    if (!numbers || numbers.length === 0) return null;

    const parsed = numbers.map(Number).filter((n) => Number.isFinite(n));
    if (parsed.length === 0) return null;

    // "400-500 kcal" and "400 to 500 kcal" describe one value, not two.
    const isRange = /\d\s*(?:-|–|—|to|à)\s*\d/i.test(normalised);
    if (isRange && parsed.length >= 2) {
        return (parsed[0] + parsed[1]) / 2;
    }

    return parsed[0];
}

export function readNutrition(facts: NutritionFacts | undefined): {
    calories: number | null;
    protein: number | null;
} {
    return {
        calories: parseNutritionAmount(facts?.calories),
        protein: parseNutritionAmount(facts?.protein),
    };
}

/**
 * How well a recipe hits the targets that were actually requested.
 *
 * Calories are scored on relative distance — 20 % off a 500 kcal target costs
 * the same as 20 % off a 900 kcal one. Protein is a floor, so anything at or
 * above it scores full marks and below it degrades proportionally. A missing
 * value scores 0.5: the recipe might well fit, we just cannot tell, and it
 * should not outrank one that demonstrably fits.
 */
export function scoreMatch(
    facts: NutritionFacts | undefined,
    criteria: RecipeSearchCriteria
): RecipeMatch {
    const { calories, protein } = readNutrition(facts);
    const scores: number[] = [];

    if (criteria.targetCalories) {
        scores.push(
            calories === null
                ? 0.5
                : clamp(1 - Math.abs(calories - criteria.targetCalories) / criteria.targetCalories)
        );
    }

    if (criteria.minProtein) {
        scores.push(
            protein === null ? 0.5 : protein >= criteria.minProtein ? 1 : clamp(protein / criteria.minProtein)
        );
    }

    const score = scores.length === 0 ? 1 : scores.reduce((a, b) => a + b, 0) / scores.length;

    return { calories, protein, score: round(score, 3) };
}

function clamp(value: number): number {
    return Math.min(1, Math.max(0, value));
}

function round(value: number, digits: number): number {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

/** Best match first. Ties keep the order the search returned them in. */
export function rankRecipes(recipes: FoundRecipe[]): FoundRecipe[] {
    return [...recipes].sort((a, b) => b.match.score - a.match.score);
}

/** Human-readable summary of the criteria, reused in both prompts. */
export function describeCriteria(criteria: RecipeSearchCriteria): string {
    const lines: string[] = [];

    if (criteria.text?.trim()) lines.push(`- Request: ${criteria.text.trim()}`);

    if (criteria.ingredients?.length) {
        lines.push(
            `- Must mainly use these ingredients (the visitor has them at hand): ${criteria.ingredients.join(", ")}`
        );
    }

    if (criteria.targetCalories) {
        lines.push(
            `- Around ${criteria.targetCalories} kcal per serving (accept anything within ±15%)`
        );
    }

    if (criteria.minProtein) {
        lines.push(`- At least ${criteria.minProtein} g of protein per serving`);
    }

    if (criteria.mealType) lines.push(`- Meal type: ${criteria.mealType}`);
    if (criteria.difficulty) lines.push(`- Difficulty: ${criteria.difficulty}`);
    if (criteria.maxDuration) lines.push(`- Ready in ${criteria.maxDuration} minutes or less`);

    return lines.length > 0 ? lines.join("\n") : "- No constraint: suggest well-loved everyday recipes.";
}

/**
 * Pass one: find real recipes on the web.
 *
 * The instruction to not invent anything is the whole point of the feature —
 * the app already has a generator, and what this adds is provenance.
 */
export function buildSearchPrompt(criteria: RecipeSearchCriteria): string {
    return `You are a culinary researcher with web search. Find recipes that ALREADY EXIST on the web and match the request below.

Rules:
- Search the web and only report recipes you actually found on a real, reachable page. Never invent one, and never merge two pages into a single recipe.
- Prefer established recipe sites and food blogs with complete ingredient lists and steps.
- Return the 3 best matches, best first.
- For each one report: the title, the site name, the exact page URL, a two-sentence description, the complete ingredient list with quantities, the numbered steps, the number of servings, the total time in minutes, the difficulty, the cuisine and continent, the meal type, and the per-serving nutrition (calories, protein, carbohydrates, fat, fibre, sugar). If the page does not state the nutrition, estimate it from the ingredients and say so.
- If nothing on the web matches, say exactly: NO_RESULTS

What the visitor is looking for:
${describeCriteria(criteria)}

Write the recipe content in ${languageName(criteria.language)}.`;
}

/** Pass two: turn the research notes into rows we can store. */
export function buildStructurePrompt(notes: string, criteria: RecipeSearchCriteria): string {
    return `Convert the research notes below into JSON. Do not invent recipes that are not in the notes, and do not drop any.

Return ONLY a JSON object of this exact shape:
{
  "recipes": [
    {
      "recipe_name": "string",
      "description": "string, two sentences",
      "ingredients": ["string with quantity"],
      "instructions": ["step"],
      "continent": "Europe | Asia | Africa | North America | South America | Oceania",
      "cuisine": "string",
      "duration_to_cook": 0,
      "servings": 0,
      "difficulty": "easy | medium | hard",
      "meal_type": "breakfast | lunch | dinner | snack | dessert",
      "source_name": "the site the recipe was found on",
      "source_url": "the exact page URL from the notes, or null if the notes give none",
      "nutrition_facts": {
        "calories": "450 kcal",
        "protein": "25g",
        "carbohydrates": "30g",
        "fat": "15g",
        "dietary_fiber": "5g",
        "sugar": "8g"
      }
    }
  ]
}

Rules:
- Copy each source_url character for character from the notes. Never shorten, guess or fabricate a URL.
- duration_to_cook and servings are numbers, in minutes and portions.
- Nutrition is per serving. Estimate it from the ingredients only when the notes give none.
- Write the content in ${languageName(criteria.language)}, but keep the enum values (difficulty, meal_type, continent) in English.
- If the notes contain no recipe, return {"recipes": []}.

Research notes:
${notes}`;
}

/** Pass zero: read the ingredients off the visitor's photo. */
export function buildVisionPrompt(language: string | undefined): string {
    return `List the food ingredients you can identify in this photo.

Return ONLY JSON: {"ingredients": ["string"], "confident": true}
- Name each ingredient in ${languageName(language)}, in the singular, with no quantity.
- Include only edible ingredients you can actually see. Ignore plates, utensils, packaging text and background objects.
- At most 15 ingredients, most prominent first.
- If the photo contains no food, return {"ingredients": [], "confident": false}.`;
}

type RawRecipe = Record<string, unknown>;

/**
 * Validates one recipe object from the model and fills in what the table
 * needs. Returns null when the essentials are missing — a recipe with no name,
 * no ingredients or no steps is not worth showing, let alone storing.
 */
export function normalizeFoundRecipe(
    raw: RawRecipe,
    criteria: RecipeSearchCriteria
): FoundRecipe | null {
    const name = text(raw.recipe_name);
    const ingredients = stringList(raw.ingredients);
    const instructions = stringList(raw.instructions);

    if (!name || ingredients.length === 0 || instructions.length === 0) return null;

    const sourceUrl = httpUrl(raw.source_url);
    const nutrition = nutritionFacts(raw.nutrition_facts);

    return {
        recipe_name: name,
        description: text(raw.description) ?? "",
        image: "",
        ingredients,
        instructions,
        continent: text(raw.continent) ?? "",
        cuisine: text(raw.cuisine) ?? "",
        meal_type: text(raw.meal_type)?.toLowerCase() ?? "",
        difficulty: text(raw.difficulty)?.toLowerCase() ?? "",
        duration_to_cook: positiveInt(raw.duration_to_cook) ?? 0,
        servings: positiveInt(raw.servings) ?? 0,
        language: criteria.language ?? "en",
        nutrition_facts: nutrition,
        created_by: "cookmate-finder",
        // A recipe with no reachable source was not found on the web, whatever
        // the model claims, so it is labelled for what it is.
        origin: sourceUrl ? "web" : "ai",
        source_url: sourceUrl,
        source_name: text(raw.source_name) ?? (sourceUrl ? hostOf(sourceUrl) : null),
        match: scoreMatch(nutrition, criteria),
    };
}

/** Drops recipes that break a hard constraint, and near-duplicates. */
export function filterFound(
    recipes: FoundRecipe[],
    criteria: RecipeSearchCriteria
): FoundRecipe[] {
    const seen = new Set<string>();

    return recipes.filter((recipe) => {
        // A stated duration over the limit is a fact, not a preference. A
        // missing duration (0) is unknown and stays in.
        if (
            criteria.maxDuration &&
            recipe.duration_to_cook > 0 &&
            recipe.duration_to_cook > criteria.maxDuration
        ) {
            return false;
        }

        const key = (recipe.source_url ?? recipe.recipe_name).toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);

        return true;
    });
}

function text(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0);
}

function positiveInt(value: unknown): number | null {
    const parsed = typeof value === "number" ? value : parseNutritionAmount(String(value ?? ""));
    if (parsed === null || !Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.round(parsed);
}

/** Only http(s) URLs are stored: the value ends up in an anchor tag. */
function httpUrl(value: unknown): string | null {
    const raw = text(value);
    if (!raw) return null;

    try {
        const url = new URL(raw);
        return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
    } catch {
        return null;
    }
}

function hostOf(url: string): string | null {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return null;
    }
}

const NUTRITION_KEYS = [
    "calories",
    "protein",
    "carbohydrates",
    "fat",
    "dietary_fiber",
    "sugar",
    "salt",
    "vitamins",
    "minerals",
    "antioxidants",
] as const;

function nutritionFacts(value: unknown): NutritionFacts {
    if (!value || typeof value !== "object") return {};

    const source = value as Record<string, unknown>;
    const facts: NutritionFacts = {};

    for (const key of NUTRITION_KEYS) {
        const raw = source[key];
        if (typeof raw === "string" && raw.trim()) {
            facts[key] = raw.trim();
        } else if (typeof raw === "number" && Number.isFinite(raw)) {
            // Bare numbers lose their unit; the two that matter are recoverable.
            facts[key] = key === "calories" ? `${raw} kcal` : `${raw}g`;
        }
    }

    return facts;
}
