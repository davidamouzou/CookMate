export type Recipe = {
    id: number;
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
    nutrition_facts: Record<string, any>;
}