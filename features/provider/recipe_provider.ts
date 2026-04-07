import { extractErrorMessageSafe, uploadImageToStorage } from "@/features/functions/upload_file"
import { firebaseDb, isFirebaseConfigured } from "@/features/config";
import { Recipe } from "@/features/entities/recipe";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    query,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    DocumentSnapshot,
} from "firebase/firestore";

export type RecipeGenerateResponse = {
    success: boolean;
    recipe: Recipe | null;
    message?: string;
}

const missingFirebaseMessage = "Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* in .env.local.";
const RECIPES_COLLECTION = "recipes";

// Keep track of last document for pagination
let lastVisibleDoc: DocumentSnapshot | null = null;

export class RecipeProvider {
    static async getRecipe(id: string): Promise<{ recipe: Recipe | null }> {
        try {
            if (!isFirebaseConfigured) {
                console.error(missingFirebaseMessage);
                return { recipe: null };
            }

            const docRef = doc(firebaseDb, RECIPES_COLLECTION, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const recipe: Recipe = {
                    id: docSnap.id,
                    ...data,
                    created_at: data.created_at?.toDate() || new Date(),
                } as Recipe;
                return { recipe };
            }
            return { recipe: null };
        } catch (error) {
            console.error("Unexpected error:", error);
            return { recipe: null };
        }
    }

    static async getLastRecipes(offset: number, limitCount: number): Promise<{ recipes: Recipe[], totalCount: number }> {
        try {
            if (!isFirebaseConfigured) {
                console.error(missingFirebaseMessage);
                return { recipes: [], totalCount: 0 };
            }

            let q;
            if (offset === 0 || !lastVisibleDoc) {
                // First page
                q = query(
                    collection(firebaseDb, RECIPES_COLLECTION),
                    orderBy("created_at", "desc"),
                    limit(limitCount)
                );
            } else {
                // Subsequent pages
                q = query(
                    collection(firebaseDb, RECIPES_COLLECTION),
                    orderBy("created_at", "desc"),
                    startAfter(lastVisibleDoc),
                    limit(limitCount)
                );
            }

            const querySnapshot = await getDocs(q);

            if (querySnapshot.docs.length > 0) {
                lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            }

            const recipes: Recipe[] = querySnapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    created_at: data.created_at?.toDate() || new Date(),
                } as Recipe;
            });

            return { recipes, totalCount: recipes.length };
        } catch (error) {
            console.error("Unexpected error:", error);
            return { recipes: [], totalCount: 0 };
        }
    }

    static async saveRecipe(recipe: Recipe): Promise<{ success: boolean, recipe: Recipe | null }> {
        try {
            if (!isFirebaseConfigured) {
                console.error(missingFirebaseMessage);
                return { success: false, recipe: null };
            }

            const recipeData = {
                ...recipe,
                created_at: Timestamp.now(),
                created_by: recipe.created_by || "anonymous",
            };

            // Remove the id field as Firestore will generate one
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _id, ...dataWithoutId } = recipeData;

            const docRef = await addDoc(collection(firebaseDb, RECIPES_COLLECTION), dataWithoutId);

            const savedRecipe: Recipe = {
                ...recipe,
                id: docRef.id,
            };

            return { success: true, recipe: savedRecipe };
        } catch (error) {
            console.error("Unexpected error:", error);
            return { success: false, recipe: null };
        }
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
                // Upload the generated image to Firebase Storage
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
