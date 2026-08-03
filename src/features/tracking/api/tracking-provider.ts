import { isSupabaseConfigured, missingSupabaseMessage, supabase } from "@/lib/supabase";
import type { FoodEntryRow, ProfileRow } from "@/lib/database.types";
import {
    DEFAULT_GOALS,
    type DailyGoals,
    type EntrySource,
    type FoodEntry,
    type ParsedMeal,
} from "@/features/tracking/types/entry";

const ENTRIES_TABLE = "food_entries";
const PROFILES_TABLE = "profiles";

function toEntry(row: FoodEntryRow): FoodEntry {
    return {
        id: row.id,
        loggedOn: row.logged_on,
        createdAt: new Date(row.created_at),
        title: row.title,
        kcal: row.kcal,
        // numeric columns come back as strings over PostgREST.
        carbsG: Number(row.carbs_g),
        proteinG: Number(row.protein_g),
        fatG: Number(row.fat_g),
        source: row.source as EntrySource,
        recipeId: row.recipe_id,
    };
}

function toGoals(row: ProfileRow): DailyGoals {
    return {
        kcal: row.daily_kcal,
        carbsG: row.daily_carbs_g,
        proteinG: row.daily_protein_g,
        fatG: row.daily_fat_g,
    };
}

export class TrackingProvider {
    /**
     * Returns the current user id, creating an anonymous session on first use.
     * Anonymous users are real auth users, so RLS scopes their data properly.
     */
    static async ensureSession(): Promise<string | null> {
        if (!isSupabaseConfigured) {
            console.error(missingSupabaseMessage);
            return null;
        }

        const { data: existing } = await supabase.auth.getSession();
        if (existing.session?.user) return existing.session.user.id;

        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
            // The most common cause is anonymous sign-ins being disabled in the
            // Supabase dashboard.
            console.error("Could not start a session:", error.message);
            return null;
        }

        return data.user?.id ?? null;
    }

    /** Reads the user's daily targets, creating the row with defaults if absent. */
    static async getGoals(userId: string): Promise<DailyGoals> {
        const { data, error } = await supabase
            .from(PROFILES_TABLE)
            .select("*")
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            console.error("Could not load goals:", error.message);
            return DEFAULT_GOALS;
        }

        if (data) return toGoals(data);

        const { data: created, error: insertError } = await supabase
            .from(PROFILES_TABLE)
            .insert({
                id: userId,
                daily_kcal: DEFAULT_GOALS.kcal,
                daily_carbs_g: DEFAULT_GOALS.carbsG,
                daily_protein_g: DEFAULT_GOALS.proteinG,
                daily_fat_g: DEFAULT_GOALS.fatG,
            })
            .select("*")
            .single();

        if (insertError || !created) {
            console.error("Could not create profile:", insertError?.message);
            return DEFAULT_GOALS;
        }

        return toGoals(created);
    }

    static async updateGoals(userId: string, goals: DailyGoals): Promise<boolean> {
        const { error } = await supabase
            .from(PROFILES_TABLE)
            .update({
                daily_kcal: goals.kcal,
                daily_carbs_g: goals.carbsG,
                daily_protein_g: goals.proteinG,
                daily_fat_g: goals.fatG,
            })
            .eq("id", userId);

        if (error) console.error("Could not save goals:", error.message);
        return !error;
    }

    /** Entries for one calendar day, oldest first so the log reads chronologically. */
    static async getEntries(userId: string, dayKey: string): Promise<FoodEntry[]> {
        const { data, error } = await supabase
            .from(ENTRIES_TABLE)
            .select("*")
            .eq("user_id", userId)
            .eq("logged_on", dayKey)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Could not load entries:", error.message);
            return [];
        }

        return (data ?? []).map(toEntry);
    }

    static async addEntry(
        userId: string,
        dayKey: string,
        meal: ParsedMeal,
        source: EntrySource = "manual",
        recipeId: string | null = null
    ): Promise<FoodEntry | null> {
        const { data, error } = await supabase
            .from(ENTRIES_TABLE)
            .insert({
                user_id: userId,
                logged_on: dayKey,
                title: meal.title,
                kcal: Math.max(0, Math.round(meal.kcal)),
                carbs_g: meal.carbsG,
                protein_g: meal.proteinG,
                fat_g: meal.fatG,
                source,
                recipe_id: recipeId,
            })
            .select("*")
            .single();

        if (error || !data) {
            console.error("Could not add entry:", error?.message);
            return null;
        }

        return toEntry(data);
    }

    static async deleteEntry(userId: string, entryId: string): Promise<boolean> {
        const { error } = await supabase
            .from(ENTRIES_TABLE)
            .delete()
            .eq("id", entryId)
            .eq("user_id", userId);

        if (error) console.error("Could not delete entry:", error.message);
        return !error;
    }

    /** Asks the AI to turn a free-text meal description into macros. */
    static async parseMeal(description: string, language = "en"): Promise<ParsedMeal | null> {
        try {
            const response = await fetch("/api/track/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: description, language }),
            });

            if (!response.ok) {
                console.error("Meal parsing failed with status", response.status);
                return null;
            }

            const meal = (await response.json()) as ParsedMeal;
            return meal?.title ? meal : null;
        } catch (error) {
            console.error("Unexpected error:", error);
            return null;
        }
    }
}
