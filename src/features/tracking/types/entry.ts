export const ENTRY_SOURCES = ["manual", "ai_text", "ai_photo", "recipe"] as const;

export type EntrySource = (typeof ENTRY_SOURCES)[number];

export type FoodEntry = {
    id: string;
    /** Calendar day the entry belongs to, as `YYYY-MM-DD`. */
    loggedOn: string;
    createdAt: Date;
    title: string;
    kcal: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
    source: EntrySource;
    recipeId: string | null;
};

/** What the user is aiming for each day. */
export type DailyGoals = {
    kcal: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
};

export const DEFAULT_GOALS: DailyGoals = {
    kcal: 2000,
    carbsG: 250,
    proteinG: 120,
    fatG: 70,
};

export type MacroTotals = {
    kcal: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
};

/** What the AI returns for a described meal, before it becomes an entry. */
export type ParsedMeal = {
    title: string;
    kcal: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
};

export function sumMacros(entries: FoodEntry[]): MacroTotals {
    return entries.reduce<MacroTotals>(
        (totals, entry) => ({
            kcal: totals.kcal + entry.kcal,
            carbsG: totals.carbsG + entry.carbsG,
            proteinG: totals.proteinG + entry.proteinG,
            fatG: totals.fatG + entry.fatG,
        }),
        { kcal: 0, carbsG: 0, proteinG: 0, fatG: 0 }
    );
}

/** Local calendar day as `YYYY-MM-DD`, avoiding the UTC shift of toISOString. */
export function toDayKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function addDays(date: Date, amount: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
}
