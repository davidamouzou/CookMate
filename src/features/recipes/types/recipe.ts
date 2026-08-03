/** Where a recipe came from — see supabase/migrations/0008. */
export type RecipeOrigin = "ai" | "web" | "user";

export type Recipe = {
    id: string;
    image: string;
    created_at: Date;
    recipe_name: string;
    created_by: string;
    ingredients: string[];
    instructions: string[];
    continent: string;
    language: string;
    duration_to_cook: number;
    servings: number;
    difficulty: string;
    cuisine: string;
    description: string;
    meal_type: string;
    nutrition_facts: NutritionFacts;
    /** 'ai' when the model wrote it, 'web' when it was found on a real page. */
    origin: RecipeOrigin;
    /** The page a 'web' recipe was found on. Null for generated ones. */
    source_url: string | null;
    /** The site that page belongs to, for attribution. */
    source_name: string | null;
}

/** A recipe that has not been stored yet: no id, no creation date. */
export type RecipeDraft = Omit<Recipe, "id" | "created_at">;

export type NutritionFacts = {
    calories?: string;
    protein?: string;
    carbohydrates?: string;
    fat?: string;
    vitamins?: string;
    minerals?: string;
    dietary_fiber?: string;
    sugar?: string;
    salt?: string;
    antioxidants?: string;
};
