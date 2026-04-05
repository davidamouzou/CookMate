import { extractErrorMessageSafe } from "@/features/functions/upload_file"
import { apiConfig, isApiConfigured } from "@/features/config";
import { Recipe } from "@/features/entities/recipe";

export type RecipeGenerateResponse = {
    success: boolean;
    recipe: Recipe | null;
    message?: string;
}

const missingApiMessage = "API backend is not configured. Set BASE_URL in .env.local.";

export class RecipeProvider {
    static async getRecipe(id: string): Promise<{ recipe: Recipe | null }> {
        try {
            const requestUrl = buildApiUrl(`/recipes/${id}`);
            if (!requestUrl) {
                return { recipe: null };
            }

            const response = await fetch(requestUrl, {
                method: 'GET',
                headers: apiConfig.request_headers,
                cache: 'no-store',
            })
            if (response.ok) {
                const data = await safeReadJson<Recipe>(response);
                return { recipe: data };
            } else {
                return { recipe: null };
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            return { recipe: null };
        }
    }
    //get last recipes
    static async getLastRecipes(offset: number, limit: number): Promise<{ recipes: Recipe[], totalCount: number }> {
        try {
            const requestUrl = buildApiUrl(`/recipes/?offset=${offset}&limit=${limit}`);
            if (!requestUrl) {
                return { recipes: [], totalCount: 0 };
            }

            const response = await fetch(requestUrl, {
                method: 'GET',
                headers: apiConfig.request_headers,
                cache: 'no-store',
            })
            if (response.ok) {
                const data = await safeReadJson<Recipe[]>(response);
                return { recipes: data ?? [], totalCount: data?.length ?? 0 };

            } else {
                return { recipes: [], totalCount: 0 };
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            return { recipes: [], totalCount: 0 };
        }
    }

    static async saveRecipe(recipe: Recipe): Promise<{ success: boolean, recipe: Recipe | null }> {
        try {
            recipe.created_by = '1'
            const requestUrl = buildApiUrl("/recipes/add");
            if (!requestUrl) {
                return { success: false, recipe: null };
            }

            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: apiConfig.request_headers,
                body: JSON.stringify(recipe),
            });
            if (response.ok) {
                const recipeSaveData = await safeReadJson<Recipe[]>(response);
                if (!recipeSaveData) {
                    return { success: false, recipe: null };
                }
                const recipeSave = recipeSaveData[0] as Recipe;
                return { success: true, recipe: recipeSave };
            }
            return { success: false, recipe: null };
        } catch (error) {
            console.error("Unexpected error:", error);
            return { success: false, recipe: null };
        }
    }

    static async generateImage(image: string): Promise<string | null> {
        try {
            const requestUrl = buildApiUrl("/generate/image");
            if (!requestUrl) {
                return null;
            }

            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: apiConfig.request_headers,
                body: JSON.stringify({ description: image }),
            })

            if (response.ok) {
                const payload = await safeReadJson<{ url?: string }>(response);
                return payload?.url ?? null;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            return null;
        }
    }

    static async generateRecipe(prompt: string, language: string = "en"): Promise<RecipeGenerateResponse> {
        const requestUrl = buildApiUrl("/generate/recipe");
        if (!requestUrl) {
            return {
                success: false,
                recipe: null,
                message: missingApiMessage,
            };
        }

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: apiConfig.request_headers,
            body: JSON.stringify({ text: prompt, language: language }),
        })

        if (response.ok) {
            const recipe = await safeReadJson<Recipe>(response);
            if (!recipe) {
                return {
                    success: false,
                    recipe: null,
                    message: "The API returned a non-JSON response instead of a recipe.",
                };
            }
            return {
                success: true,
                recipe,
            } // convert to Recipe objet ts
        } else {
            const errorPayload = await safeReadError(response);
            return {
                success: false,
                recipe: null,
                message: errorPayload || "Erreur lors de la génération de la recette",
            };
        }
    }

    static async generateRecipeFromImage(imageDataUrl: string, language: string = "en"): Promise<RecipeGenerateResponse> {
        // Extract pure base64 content from data URL (e.g., data:image/png;base64,XXXXX)
        const base64 = imageDataUrl.includes(",") ? imageDataUrl.split(",")[1] : imageDataUrl;

        const requestUrl = buildApiUrl("/generate/recipe");
        if (!requestUrl) {
            return {
                success: false,
                recipe: null,
                message: missingApiMessage,
            };
        }

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: apiConfig.request_headers,
            body: JSON.stringify({
                text: "Generate a recipe from the provided image ingredients.",
                language,
                files: [{ base64 }],
            }),
        });

        if (response.ok) {
            const recipe = await safeReadJson<Recipe>(response);
            if (!recipe) {
                return {
                    success: false,
                    recipe: null,
                    message: "The API returned a non-JSON response instead of a recipe.",
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
    }
}

function buildApiUrl(path: string): string | null {
    if (!isApiConfigured) {
        console.error(missingApiMessage);
        return null;
    }

    return `${apiConfig.base_url}${path}`;
}

async function safeReadJson<T>(response: Response): Promise<T | null> {
    try {
        const payload = await response.text();
        if (!payload) {
            return null;
        }

        return JSON.parse(payload) as T;
    } catch (error) {
        console.error("Expected a JSON API response but received something else.", error);
        return null;
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
