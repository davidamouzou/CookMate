import {
    STORAGE_KEYS,
    createId,
    read,
    readProfile,
    write,
    writeProfile,
} from "@/features/tracking/api/local-store";
import {
    type DailyGoals,
    type EntrySource,
    type FoodEntry,
    type ParsedMeal,
} from "@/features/tracking/types/entry";

/** On-disk shape: `createdAt` cannot survive JSON as a Date. */
type StoredEntry = Omit<FoodEntry, "createdAt"> & { createdAt: string };

function toEntry(stored: StoredEntry): FoodEntry {
    return { ...stored, createdAt: new Date(stored.createdAt) };
}

function readEntries(): StoredEntry[] {
    return read<StoredEntry[]>(STORAGE_KEYS.entries, []);
}

/** All entries, newest last, as the log reads chronologically. */
export function readAllEntries(): FoodEntry[] {
    return readEntries().map(toEntry);
}

export class TrackingProvider {
    static getGoals(): DailyGoals {
        const profile = readProfile();
        return {
            kcal: profile.dailyKcal,
            carbsG: profile.dailyCarbsG,
            proteinG: profile.dailyProteinG,
            fatG: profile.dailyFatG,
        };
    }

    static updateGoals(goals: DailyGoals): boolean {
        return writeProfile({
            dailyKcal: goals.kcal,
            dailyCarbsG: goals.carbsG,
            dailyProteinG: goals.proteinG,
            dailyFatG: goals.fatG,
        });
    }

    /** Entries for one calendar day, oldest first. */
    static getEntries(dayKey: string): FoodEntry[] {
        return readEntries()
            .filter((entry) => entry.loggedOn === dayKey)
            .map(toEntry)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    static addEntry(
        dayKey: string,
        meal: ParsedMeal,
        source: EntrySource = "manual",
        recipeId: string | null = null
    ): FoodEntry | null {
        const stored: StoredEntry = {
            id: createId(),
            loggedOn: dayKey,
            createdAt: new Date().toISOString(),
            title: meal.title,
            kcal: Math.max(0, Math.round(meal.kcal)),
            carbsG: meal.carbsG,
            proteinG: meal.proteinG,
            fatG: meal.fatG,
            source,
            recipeId,
        };

        if (!write(STORAGE_KEYS.entries, [...readEntries(), stored])) return null;
        return toEntry(stored);
    }

    static deleteEntry(entryId: string): boolean {
        return write(
            STORAGE_KEYS.entries,
            readEntries().filter((entry) => entry.id !== entryId)
        );
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
