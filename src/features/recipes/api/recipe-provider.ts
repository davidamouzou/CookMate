import { extractErrorMessageSafe, uploadImageToStorage } from "@/features/recipes/api/upload-file"
import { isSupabaseConfigured, missingSupabaseMessage, supabase } from "@/lib/supabase";
import type { RecipeRow } from "@/lib/database.types";
import { Recipe, RecipeDraft } from "@/features/recipes/types/recipe";
import type {
    FoundRecipe,
    RecipeSearchCriteria,
} from "@/features/recipes/lib/recipe-search";
import type { GeminiSource } from "@/lib/ai/gemini";

export type RecipeGenerateResponse = {
    success: boolean;
    recipe: Recipe | null;
    message?: string;
}

export type RecipeSearchResult = {
    success: boolean;
    recipes: FoundRecipe[];
    /** Ingredients read off the photo, echoed back so the UI can show them. */
    ingredients: string[];
    sources: GeminiSource[];
    /**
     * Why it failed, when it did. `quota` is worth its own case: search
     * grounding has a daily allowance separate from plain generation, so this
     * feature can be the only thing that stops working.
     */
    code?: "quota" | "error";
    message?: string;
};

const RECIPES_TABLE = "recipes";

function toRecipe(row: RecipeRow): Recipe {
    return {
        ...row,
        description: row.description ?? "",
        image: row.image ?? "",
        continent: row.continent ?? "",
        language: row.language ?? "",
        duration_to_cook: row.duration_to_cook ?? 0,
        servings: row.servings ?? 0,
        difficulty: row.difficulty ?? "",
        cuisine: row.cuisine ?? "",
        meal_type: row.meal_type ?? "",
        nutrition_facts: row.nutrition_facts ?? {},
        origin: row.origin ?? "ai",
        source_url: row.source_url ?? null,
        source_name: row.source_name ?? null,
        created_at: new Date(row.created_at),
    };
}

export class RecipeProvider {
    static async getRecipe(id: string): Promise<{ recipe: Recipe | null }> {
        try {
            if (!isSupabaseConfigured) {
                console.error(missingSupabaseMessage);
                return { recipe: null };
            }

            const { data, error } = await supabase
                .from(RECIPES_TABLE)
                .select("*")
                .eq("id", id)
                .maybeSingle();

            if (error) {
                console.error("Failed to load recipe:", error.message);
                return { recipe: null };
            }

            return { recipe: data ? toRecipe(data) : null };
        } catch (error) {
            console.error("Unexpected error:", error);
            return { recipe: null };
        }
    }

    static async getLastRecipes(offset: number, limitCount: number): Promise<{ recipes: Recipe[], totalCount: number }> {
        try {
            if (!isSupabaseConfigured) {
                console.error(missingSupabaseMessage);
                return { recipes: [], totalCount: 0 };
            }

            // `range` is inclusive on both ends, and offset is honoured on every
            // call — unlike the previous Firestore cursor, which lived in a
            // module-level variable and desynced across concurrent callers.
            const { data, error, count } = await supabase
                .from(RECIPES_TABLE)
                .select("*", { count: "exact" })
                .order("created_at", { ascending: false })
                .range(offset, offset + limitCount - 1);

            if (error) {
                console.error("Failed to load recipes:", error.message);
                return { recipes: [], totalCount: 0 };
            }

            const recipes = (data ?? []).map(toRecipe);
            return { recipes, totalCount: count ?? recipes.length };
        } catch (error) {
            console.error("Unexpected error:", error);
            return { recipes: [], totalCount: 0 };
        }
    }

    /**
     * Stores a recipe through /api/recipes.
     *
     * The write goes through the server rather than straight to Supabase so
     * the submitter's IP and location are recorded alongside it — the browser
     * cannot see its own public address.
     */
    static async saveRecipe(
        recipe: Recipe | RecipeDraft,
        locale?: string
    ): Promise<{ success: boolean; recipe: Recipe | null; duplicate?: boolean }> {
        try {
            const query = locale ? `?locale=${encodeURIComponent(locale)}` : "";
            const response = await fetch(`/api/recipes${query}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipe }),
            });

            if (!response.ok) {
                console.error("Failed to save recipe:", await safeReadError(response));
                return { success: false, recipe: null };
            }

            const { recipe: row, duplicate } = (await response.json()) as {
                recipe: RecipeRow;
                duplicate?: boolean;
            };

            return { success: true, recipe: toRecipe(row), duplicate };
        } catch (error) {
            console.error("Unexpected error:", error);
            return { success: false, recipe: null };
        }
    }

    /**
     * Finds recipes that already exist on the web, via search-grounded AI.
     *
     * Unlike `generateRecipe`, nothing here is invented: each result carries
     * the page it was found on. The image is generated afterwards, when a
     * result is saved — searching for four recipes should not cost four
     * image generations.
     */
    static async findRecipes(
        criteria: RecipeSearchCriteria & { image?: string }
    ): Promise<RecipeSearchResult> {
        const empty = { recipes: [], ingredients: [], sources: [] };

        try {
            const response = await fetch("/api/search/recipe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(criteria),
            });

            if (!response.ok) {
                return {
                    success: false,
                    ...empty,
                    code: response.status === 429 ? "quota" : "error",
                    message: (await safeReadError(response)) ?? undefined,
                };
            }

            const data = (await response.json()) as Omit<RecipeSearchResult, "success">;

            return {
                success: true,
                recipes: data.recipes ?? [],
                ingredients: data.ingredients ?? [],
                sources: data.sources ?? [],
            };
        } catch (error) {
            console.error("Unexpected error:", error);
            return {
                success: false,
                ...empty,
                code: "error",
                message: error instanceof Error ? error.message : undefined,
            };
        }
    }

    /**
     * Illustrates a recipe and stores it. Used for both a found recipe and a
     * generated one; a recipe that already has an image keeps it.
     */
    static async publishRecipe(
        draft: RecipeDraft,
        locale?: string
    ): Promise<{ success: boolean; recipe: Recipe | null; duplicate?: boolean }> {
        const image =
            draft.image ||
            (await RecipeProvider.generateImage(draft.description || draft.recipe_name)) ||
            "";

        return RecipeProvider.saveRecipe({ ...draft, image }, locale);
    }

    static async generateImage(description: string): Promise<string | null> {
        try {
            const response = await fetch("/api/generate/image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description }),
            });

            if (!response.ok) {
                console.error("Failed to generate image");
                return null;
            }

            const data = await response.json();

            if (data.base64) {
                // Upload the generated image to Supabase Storage
                const imageUrl = await uploadImageToStorage(data.base64, data.contentType || "image/jpeg");
                return imageUrl;
            }

            return null;
        } catch (error) {
            console.error("Unexpected error:", error);
            return null;
        }
    }

    static async generateRecipe(prompt: string, language: string = "en"): Promise<RecipeGenerateResponse> {
        try {
            const response = await fetch("/api/generate/recipe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: prompt, language }),
            });

            if (response.ok) {
                const recipe = await response.json() as Recipe;
                if (!recipe || !recipe.recipe_name) {
                    return {
                        success: false,
                        recipe: null,
                        message: "The API returned an invalid recipe format.",
                    };
                }
                return { success: true, recipe };
            } else {
                const errorData = await safeReadError(response);
                return {
                    success: false,
                    recipe: null,
                    message: errorData || "Erreur lors de la génération de la recette",
                };
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            return {
                success: false,
                recipe: null,
                message: error instanceof Error ? error.message : "Erreur inattendue",
            };
        }
    }

    static async generateRecipeFromImage(imageDataUrl: string, language: string = "en"): Promise<RecipeGenerateResponse> {
        try {
            // Extract pure base64 content from data URL (e.g., data:image/png;base64,XXXXX)
            const base64 = imageDataUrl.includes(",") ? imageDataUrl.split(",")[1] : imageDataUrl;

            const response = await fetch("/api/generate/recipe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: "Generate a recipe from the provided image ingredients.",
                    language,
                    files: [{ base64 }],
                }),
            });

            if (response.ok) {
                const recipe = await response.json() as Recipe;
                if (!recipe || !recipe.recipe_name) {
                    return {
                        success: false,
                        recipe: null,
                        message: "The API returned an invalid recipe format.",
                    };
                }
                return { success: true, recipe };
            }

            const errorText = await safeReadError(response);
            return {
                success: false,
                recipe: null,
                message: errorText || "Erreur lors de la génération de la recette à partir de l'image",
            };
        } catch (error) {
            console.error("Unexpected error:", error);
            return {
                success: false,
                recipe: null,
                message: error instanceof Error ? error.message : "Erreur inattendue",
            };
        }
    }
}

async function safeReadError(response: Response): Promise<string | null> {
    try {
        const body = await response.text();
        if (!body) {
            return null;
        }

        try {
            const asJson = JSON.parse(body);
            if (asJson && typeof asJson === "object") {
                if ("message" in asJson && typeof asJson.message === "string") return asJson.message;
                if ("error" in asJson && typeof asJson.error === "string") return asJson.error;
            }
            return typeof asJson === "string" ? asJson : JSON.stringify(asJson);
        } catch {
            return extractErrorMessageSafe(body) || body;
        }
    } catch {
        return null;
    }
}
