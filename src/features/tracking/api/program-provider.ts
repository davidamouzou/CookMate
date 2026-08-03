import { STORAGE_KEYS, createId, read, readProfile, write, writeProfile } from "@/features/tracking/api/local-store";
import { readAllEntries } from "@/features/tracking/api/tracking-provider";
import type { Program, WeightEntry } from "@/features/tracking/types/program";

function readWeights(): WeightEntry[] {
    return read<WeightEntry[]>(STORAGE_KEYS.weights, []);
}

export class ProgramProvider {
    static getProgram(): Program {
        const profile = readProfile();

        return {
            startWeightKg: profile.startWeightKg,
            goalWeightKg: profile.goalWeightKg,
            paceKgPerWeek: profile.paceKgPerWeek,
            startedOn: profile.programStartedOn,
            dailyKcal: profile.dailyKcal,
        };
    }

    static saveProgram(program: Program): boolean {
        return writeProfile({
            startWeightKg: program.startWeightKg,
            goalWeightKg: program.goalWeightKg,
            paceKgPerWeek: program.paceKgPerWeek,
            programStartedOn: program.startedOn,
        });
    }

    static getWeights(fromDay: string, toDay: string): WeightEntry[] {
        // Day keys are `YYYY-MM-DD`, so lexicographic order is date order.
        return readWeights()
            .filter((entry) => entry.loggedOn >= fromDay && entry.loggedOn <= toDay)
            .sort((a, b) => a.loggedOn.localeCompare(b.loggedOn));
    }

    /** One reading per day: re-weighing replaces the day's value. */
    static recordWeight(dayKey: string, weightKg: number): WeightEntry | null {
        const existing = readWeights();
        const entry: WeightEntry = {
            id: existing.find((item) => item.loggedOn === dayKey)?.id ?? createId(),
            loggedOn: dayKey,
            weightKg,
        };

        const next = [...existing.filter((item) => item.loggedOn !== dayKey), entry];
        if (!write(STORAGE_KEYS.weights, next)) return null;

        // The first reading doubles as the programme's starting point, which is
        // what the "start → now → goal" row compares against.
        if (readProfile().startWeightKg === null) {
            writeProfile({ startWeightKg: weightKg, programStartedOn: dayKey });
        }

        return entry;
    }

    /** Daily calorie totals over a window, for the consumption trend. */
    static getDailyCalories(fromDay: string, toDay: string): Map<string, number> {
        const byDay = new Map<string, number>();

        for (const entry of readAllEntries()) {
            if (entry.loggedOn < fromDay || entry.loggedOn > toDay) continue;
            byDay.set(entry.loggedOn, (byDay.get(entry.loggedOn) ?? 0) + entry.kcal);
        }

        return byDay;
    }
}
