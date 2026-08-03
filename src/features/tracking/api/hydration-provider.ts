import { supabase } from "@/lib/supabase";
import type { DrinkEntryRow } from "@/lib/database.types";
import {
    DEFAULT_HYDRATION_GOALS,
    type DrinkEntry,
    type HydrationGoals,
} from "@/features/tracking/types/hydration";

const DRINKS_TABLE = "drink_entries";

function toDrink(row: DrinkEntryRow): DrinkEntry {
    return {
        id: row.id,
        loggedOn: row.logged_on,
        createdAt: new Date(row.created_at),
        title: row.title,
        volumeMl: row.volume_ml,
        hydrationPct: row.hydration_pct,
        caffeineMg: row.caffeine_mg,
    };
}

export class HydrationProvider {
    static async getGoals(userId: string): Promise<HydrationGoals> {
        const { data, error } = await supabase
            .from("profiles")
            .select("daily_water_ml, daily_caffeine_mg")
            .eq("id", userId)
            .maybeSingle();

        if (error || !data) {
            if (error) console.error("Could not load hydration goals:", error.message);
            return DEFAULT_HYDRATION_GOALS;
        }

        return { waterMl: data.daily_water_ml, caffeineMg: data.daily_caffeine_mg };
    }

    static async getDrinks(userId: string, dayKey: string): Promise<DrinkEntry[]> {
        const { data, error } = await supabase
            .from(DRINKS_TABLE)
            .select("*")
            .eq("user_id", userId)
            .eq("logged_on", dayKey)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Could not load drinks:", error.message);
            return [];
        }

        return (data ?? []).map(toDrink);
    }

    /** Daily hydration totals over a window, for the bar chart. */
    static async getDailyHydration(
        userId: string,
        fromDay: string,
        toDay: string
    ): Promise<Map<string, number>> {
        const { data, error } = await supabase
            .from(DRINKS_TABLE)
            .select("logged_on, volume_ml, hydration_pct")
            .eq("user_id", userId)
            .gte("logged_on", fromDay)
            .lte("logged_on", toDay);

        if (error) {
            console.error("Could not load hydration history:", error.message);
            return new Map();
        }

        const byDay = new Map<string, number>();
        for (const row of data ?? []) {
            const effective = Math.round((row.volume_ml * row.hydration_pct) / 100);
            byDay.set(row.logged_on, (byDay.get(row.logged_on) ?? 0) + effective);
        }
        return byDay;
    }

    static async addDrink(
        userId: string,
        dayKey: string,
        drink: Omit<DrinkEntry, "id" | "loggedOn" | "createdAt">
    ): Promise<DrinkEntry | null> {
        const { data, error } = await supabase
            .from(DRINKS_TABLE)
            .insert({
                user_id: userId,
                logged_on: dayKey,
                title: drink.title,
                volume_ml: drink.volumeMl,
                hydration_pct: drink.hydrationPct,
                caffeine_mg: drink.caffeineMg,
            })
            .select("*")
            .single();

        if (error || !data) {
            console.error("Could not add drink:", error?.message);
            return null;
        }

        return toDrink(data);
    }

    static async deleteDrink(userId: string, drinkId: string): Promise<boolean> {
        const { error } = await supabase
            .from(DRINKS_TABLE)
            .delete()
            .eq("id", drinkId)
            .eq("user_id", userId);

        if (error) console.error("Could not delete drink:", error.message);
        return !error;
    }
}
