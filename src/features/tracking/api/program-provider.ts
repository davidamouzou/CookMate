import { supabase } from "@/lib/supabase";
import type { WeightEntryRow } from "@/lib/database.types";
import type { Program, WeightEntry } from "@/features/tracking/types/program";

const WEIGHTS_TABLE = "weight_entries";

function toWeight(row: WeightEntryRow): WeightEntry {
    return {
        id: row.id,
        loggedOn: row.logged_on,
        // numeric columns come back as strings over PostgREST.
        weightKg: Number(row.weight_kg),
    };
}

export class ProgramProvider {
    static async getProgram(userId: string): Promise<Program | null> {
        const { data, error } = await supabase
            .from("profiles")
            .select(
                "start_weight_kg, goal_weight_kg, pace_kg_per_week, program_started_on, daily_kcal"
            )
            .eq("id", userId)
            .maybeSingle();

        if (error || !data) {
            if (error) console.error("Could not load programme:", error.message);
            return null;
        }

        return {
            startWeightKg: data.start_weight_kg === null ? null : Number(data.start_weight_kg),
            goalWeightKg: data.goal_weight_kg === null ? null : Number(data.goal_weight_kg),
            paceKgPerWeek: Number(data.pace_kg_per_week),
            startedOn: data.program_started_on,
            dailyKcal: data.daily_kcal,
        };
    }

    static async saveProgram(userId: string, program: Program): Promise<boolean> {
        const { error } = await supabase
            .from("profiles")
            .update({
                start_weight_kg: program.startWeightKg,
                goal_weight_kg: program.goalWeightKg,
                pace_kg_per_week: program.paceKgPerWeek,
                program_started_on: program.startedOn,
            })
            .eq("id", userId);

        if (error) console.error("Could not save programme:", error.message);
        return !error;
    }

    static async getWeights(userId: string, fromDay: string, toDay: string): Promise<WeightEntry[]> {
        const { data, error } = await supabase
            .from(WEIGHTS_TABLE)
            .select("*")
            .eq("user_id", userId)
            .gte("logged_on", fromDay)
            .lte("logged_on", toDay)
            .order("logged_on", { ascending: true });

        if (error) {
            console.error("Could not load weights:", error.message);
            return [];
        }

        return (data ?? []).map(toWeight);
    }

    /** One reading per day: re-weighing replaces the day's value. */
    static async recordWeight(
        userId: string,
        dayKey: string,
        weightKg: number
    ): Promise<WeightEntry | null> {
        const { data, error } = await supabase
            .from(WEIGHTS_TABLE)
            .upsert(
                { user_id: userId, logged_on: dayKey, weight_kg: weightKg },
                { onConflict: "user_id,logged_on" }
            )
            .select("*")
            .single();

        if (error || !data) {
            console.error("Could not record weight:", error?.message);
            return null;
        }

        return toWeight(data);
    }

    /** Daily calorie totals over a window, for the consumption trend. */
    static async getDailyCalories(
        userId: string,
        fromDay: string,
        toDay: string
    ): Promise<Map<string, number>> {
        const { data, error } = await supabase
            .from("food_entries")
            .select("logged_on, kcal")
            .eq("user_id", userId)
            .gte("logged_on", fromDay)
            .lte("logged_on", toDay);

        if (error) {
            console.error("Could not load calorie history:", error.message);
            return new Map();
        }

        const byDay = new Map<string, number>();
        for (const row of data ?? []) {
            byDay.set(row.logged_on, (byDay.get(row.logged_on) ?? 0) + row.kcal);
        }
        return byDay;
    }
}
