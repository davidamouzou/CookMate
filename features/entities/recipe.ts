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
}

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
