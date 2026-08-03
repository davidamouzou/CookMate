import type { NutritionFacts, RecipeOrigin } from "@/features/recipes/types/recipe";

/**
 * Shape of the `recipes` table (see supabase/migrations/0001_init_recipes.sql).
 * Regenerate with `bunx supabase gen types typescript` once the Supabase CLI is
 * linked to the project.
 */
export type RecipeRow = {
    id: string;
    recipe_name: string;
    description: string | null;
    image: string | null;
    ingredients: string[];
    instructions: string[];
    continent: string | null;
    language: string | null;
    duration_to_cook: number | null;
    servings: number | null;
    difficulty: string | null;
    cuisine: string | null;
    meal_type: string | null;
    nutrition_facts: NutritionFacts;
    created_by: string;
    created_at: string;
    /** Added by 0008_recipe_discovery_and_geo.sql. */
    origin: RecipeOrigin;
    source_url: string | null;
    source_name: string | null;
};

/** `origin` defaults to 'ai' in the table, so it is optional on insert. */
export type RecipeInsert = Omit<RecipeRow, "id" | "created_at" | "origin"> & {
    id?: string;
    created_at?: string;
    origin?: RecipeOrigin;
};

/** See supabase/migrations/0003_visits.sql and 0008_recipe_discovery_and_geo.sql. */
export type VisitRow = {
    id: number;
    created_at: string;
    ip: string | null;
    country: string | null;
    region: string | null;
    region_code: string | null;
    city: string | null;
    postal_code: string | null;
    continent: string | null;
    timezone: string | null;
    latitude: number | null;
    longitude: number | null;
    device_type: string | null;
    os: string | null;
    browser: string | null;
    user_agent: string | null;
    is_bot: boolean;
    path: string | null;
    locale: string | null;
    referrer: string | null;
};

export type VisitInsert = Omit<VisitRow, "id" | "created_at" | "is_bot"> & {
    is_bot?: boolean;
};

/**
 * Who submitted a recipe and from where — see
 * supabase/migrations/0008_recipe_discovery_and_geo.sql. Kept apart from
 * `recipes` because that table is world-readable and this one holds an IP.
 */
export type RecipeSubmissionRow = {
    id: number;
    created_at: string;
    recipe_id: string;
    ip: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
    postal_code: string | null;
    timezone: string | null;
    latitude: number | null;
    longitude: number | null;
    user_agent: string | null;
    locale: string | null;
    origin: string | null;
};

export type RecipeSubmissionInsert = Omit<RecipeSubmissionRow, "id" | "created_at"> & {
    created_at?: string;
};

/** See supabase/migrations/0004_tracking.sql. */
export type ProfileRow = {
    id: string;
    created_at: string;
    daily_kcal: number;
    daily_carbs_g: number;
    daily_protein_g: number;
    daily_fat_g: number;
} & ProfileProgramColumns;

/** Columns added by supabase/migrations/0005_hydration_program.sql. */
export type ProfileProgramColumns = {
    daily_water_ml: number;
    daily_caffeine_mg: number;
    start_weight_kg: number | null;
    goal_weight_kg: number | null;
    pace_kg_per_week: number;
    program_started_on: string | null;
};

/** Every column but `id` has a database default, so all of them are optional. */
export type ProfileInsert = { id: string } & Partial<Omit<ProfileRow, "id">>;

export type DrinkEntryRow = {
    id: string;
    user_id: string;
    created_at: string;
    logged_on: string;
    title: string;
    volume_ml: number;
    hydration_pct: number;
    caffeine_mg: number;
};

export type DrinkEntryInsert = Omit<DrinkEntryRow, "id" | "created_at"> & {
    id?: string;
    created_at?: string;
};

export type WeightEntryRow = {
    id: string;
    user_id: string;
    created_at: string;
    logged_on: string;
    weight_kg: number;
};

export type WeightEntryInsert = Omit<WeightEntryRow, "id" | "created_at"> & {
    id?: string;
    created_at?: string;
};

export type FoodEntryRow = {
    id: string;
    user_id: string;
    created_at: string;
    logged_on: string;
    title: string;
    kcal: number;
    carbs_g: number;
    protein_g: number;
    fat_g: number;
    source: string;
    recipe_id: string | null;
};

export type FoodEntryInsert = Omit<FoodEntryRow, "id" | "created_at"> & {
    id?: string;
    created_at?: string;
};

export type Database = {
    public: {
        Tables: {
            recipes: {
                Row: RecipeRow;
                Insert: RecipeInsert;
                Update: Partial<RecipeInsert>;
                Relationships: [];
            };
            visits: {
                Row: VisitRow;
                Insert: VisitInsert;
                Update: Partial<VisitInsert>;
                Relationships: [];
            };
            recipe_submissions: {
                Row: RecipeSubmissionRow;
                Insert: RecipeSubmissionInsert;
                Update: Partial<RecipeSubmissionInsert>;
                Relationships: [];
            };
            profiles: {
                Row: ProfileRow;
                Insert: ProfileInsert;
                Update: Partial<ProfileInsert>;
                Relationships: [];
            };
            food_entries: {
                Row: FoodEntryRow;
                Insert: FoodEntryInsert;
                Update: Partial<FoodEntryInsert>;
                Relationships: [];
            };
            drink_entries: {
                Row: DrinkEntryRow;
                Insert: DrinkEntryInsert;
                Update: Partial<DrinkEntryInsert>;
                Relationships: [];
            };
            weight_entries: {
                Row: WeightEntryRow;
                Insert: WeightEntryInsert;
                Update: Partial<WeightEntryInsert>;
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};
