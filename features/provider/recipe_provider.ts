import { extractErrorMessageSafe } from "@/features/functions/upload_file"
import { apiConfig } from "@/features/config";
import { Recipe } from "@/features/entities/recipe";

export type RecipeGenerateResponse = {
    success: boolean;
    recipe: Recipe | null;
    message?: string;
}



export class RecipeProvider {
    static async getRecipe(id: string): Promise<{ recipe: Recipe | null }> {
        try {
            const response = await fetch(`${apiConfig.base_url}/recipes/${id}`, {
                method: 'GET',
                headers: apiConfig.request_headers,
                cache: 'no-store',
            })
            if (response.ok) {
                const data = await response.json();
                return { recipe: data as Recipe };
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
            const response = await fetch(`${apiConfig.base_url}/recipes/?offset=${offset}&limit=${limit}`, {
                method: 'GET',
                headers: apiConfig.request_headers,
                cache: 'no-store',
            })
            if (response.ok) {
                const data = await response.json();
                return { recipes: data as Recipe[], totalCount: 20 };

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
            const response = await fetch(`${apiConfig.base_url}/recipes/add`, {
                method: 'POST',
                headers: apiConfig.request_headers,
                body: JSON.stringify(recipe),
            });
            if (response.ok) {
                const recipeSaveData = await response.json();
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
            const response = await fetch(`${apiConfig.base_url}/generate/image`, {
                method: 'POST',
                headers: apiConfig.request_headers,
                body: JSON.stringify({ description: image }),
            })

            if (response.ok) {
                return (await response.json())['url'] as string;;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            return null;
        }
    }

    static async generateRecipe(prompt: string, language: string = "en"): Promise<RecipeGenerateResponse> {
        const response = await fetch(`${apiConfig.base_url}/generate/recipe`, {
            method: 'POST',
            headers: apiConfig.request_headers,
            body: JSON.stringify({ text: prompt, language: language }),
        })

        if (response.ok) {
            const recipe = await response.json()
            return {
                success: true,
                recipe: recipe as Recipe,
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

        const response = await fetch(`${apiConfig.base_url}/generate/recipe`, {
            method: 'POST',
            headers: apiConfig.request_headers,
            body: JSON.stringify({
                text: "Generate a recipe from the provided image ingredients.",
                language,
                files: [{ base64 }],
            }),
        });

        if (response.ok) {
            const recipe = await response.json();
            return { success: true, recipe: recipe as Recipe };
        }

        const errorText = await safeReadError(response);
        return {
            success: false,
            recipe: null,
            message: errorText || "Erreur lors de la génération de la recette à partir de l'image",
        };
    }
}

async function safeReadError(response: Response): Promise<string | null> {
    try {
        const asJson = await response.clone().json();
        if (asJson && typeof asJson === "object") {
            if ("message" in asJson && typeof asJson.message === "string") return asJson.message;
            if ("error" in asJson && typeof asJson.error === "string") return asJson.error;
        }
        return typeof asJson === "string" ? asJson : JSON.stringify(asJson);
    } catch {
        try {
            const asText = await response.text();
            return extractErrorMessageSafe(asText) || asText;
        } catch {
            return null;
        }
    }
}
