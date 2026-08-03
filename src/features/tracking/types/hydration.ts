export type DrinkEntry = {
    id: string;
    loggedOn: string;
    createdAt: Date;
    title: string;
    volumeMl: number;
    /** Share of the volume counting as hydration: water 100, coffee ~90. */
    hydrationPct: number;
    caffeineMg: number;
};

export type HydrationGoals = {
    waterMl: number;
    caffeineMg: number;
};

export const DEFAULT_HYDRATION_GOALS: HydrationGoals = {
    waterMl: 2500,
    caffeineMg: 400,
};

export type HydrationTotals = {
    /** Effective hydration, i.e. volume weighted by `hydrationPct`. */
    hydrationMl: number;
    /** Raw liquid volume, whatever it was. */
    intakeMl: number;
    caffeineMg: number;
    drinks: number;
};

/** Quick-add buttons, mirroring the shortcuts row in the design. */
export type DrinkPreset = {
    key: string;
    volumeMl: number;
    hydrationPct: number;
    caffeineMg: number;
    tone: "blue" | "orange" | "neutral" | "purple";
};

export const DRINK_PRESETS: DrinkPreset[] = [
    { key: "water", volumeMl: 330, hydrationPct: 100, caffeineMg: 0, tone: "blue" },
    { key: "coffee", volumeMl: 200, hydrationPct: 90, caffeineMg: 80, tone: "orange" },
    { key: "tea", volumeMl: 240, hydrationPct: 90, caffeineMg: 28, tone: "purple" },
    { key: "soda", volumeMl: 500, hydrationPct: 90, caffeineMg: 160, tone: "neutral" },
];

export function sumHydration(entries: DrinkEntry[]): HydrationTotals {
    return entries.reduce<HydrationTotals>(
        (totals, entry) => ({
            hydrationMl: totals.hydrationMl + Math.round((entry.volumeMl * entry.hydrationPct) / 100),
            intakeMl: totals.intakeMl + entry.volumeMl,
            caffeineMg: totals.caffeineMg + entry.caffeineMg,
            drinks: totals.drinks + 1,
        }),
        { hydrationMl: 0, intakeMl: 0, caffeineMg: 0, drinks: 0 }
    );
}

export function formatLitres(ml: number): string {
    return `${(ml / 1000).toFixed(1)}L`;
}
