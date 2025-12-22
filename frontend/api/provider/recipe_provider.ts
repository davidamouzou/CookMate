import { compressImageToBase64, extractErrorMessageSafe } from "@/api/functions/upload_file"
import { apiConfig } from "@/api/config";
import { Recipe } from "@/api/entities/recipe";

type BaseType = {
    base64: string;
    mimeType: string;
}

export type RecipeGenerateResponse = {
    success: boolean;
    recipe: Recipe | null;
    message?: string;
}

const convertDataURLToBase64 = (dataURL: string): BaseType | null => {
    if (dataURL.startsWith("data:image/")) {
        const base64 = dataURL.split(",")[1];
        return {
            "base64": base64,
            "mimeType": "image/$ext",
        };
    } else {
        console.error("the dataURL is not a valid image");
        return null;
    }
}



export class RecipeProvider {
    static async getRecipe(id: string): Promise<{ recipe: Recipe | null }> {
        try {
            const response = await fetch(`${apiConfig.base_url}/recipes/${id}`, {
                method: 'GET',
                headers: apiConfig.request_headers,
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
            const errorText = await response.json();
            return {
                success: false,
                recipe: null,
                message: extractErrorMessageSafe(errorText) || "Erreur lors de la génération de la recette",
            };
        }
    }

    // Generate a recipe based on an image
    static async generateWithImage(image: string, language: string = "en") {
        const imageCompress = await compressImageToBase64(image, 3)
        if (!imageCompress) { return [] }
        const imageConvert = convertDataURLToBase64(imageCompress)
        if (!imageConvert) { return [] }
    }
}