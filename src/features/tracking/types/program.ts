export type WeightEntry = {
    id: string;
    loggedOn: string;
    weightKg: number;
};

export type Program = {
    startWeightKg: number | null;
    goalWeightKg: number | null;
    /** Negative loses weight, positive gains. */
    paceKgPerWeek: number;
    startedOn: string | null;
    dailyKcal: number;
};

/**
 * Weeks left at the configured pace. Null when the goal is already met, the
 * pace points away from the goal, or the programme is not set up — all cases
 * where a number would be misleading rather than useful.
 */
export function weeksToGoal(currentKg: number | null, program: Program): number | null {
    const { goalWeightKg, paceKgPerWeek } = program;

    if (currentKg === null || goalWeightKg === null || paceKgPerWeek === 0) return null;

    const remaining = goalWeightKg - currentKg;
    if (Math.abs(remaining) < 0.05) return null;

    // Pace must point towards the goal.
    if (Math.sign(remaining) !== Math.sign(paceKgPerWeek)) return null;

    return Math.ceil(Math.abs(remaining / paceKgPerWeek));
}

/**
 * Centred moving average, used as the trend line over the daily calorie dots.
 * Windows are clipped at the series edges rather than dropped, so the line
 * spans the whole range.
 */
export function movingAverage(values: (number | null)[], window = 7): (number | null)[] {
    const half = Math.floor(window / 2);

    return values.map((_, index) => {
        const slice = values
            .slice(Math.max(0, index - half), index + half + 1)
            .filter((value): value is number => value !== null);

        if (slice.length === 0) return null;
        return slice.reduce((sum, value) => sum + value, 0) / slice.length;
    });
}

export function averageOf(values: (number | null)[]): number | null {
    const present = values.filter((value): value is number => value !== null);
    if (present.length === 0) return null;
    return present.reduce((sum, value) => sum + value, 0) / present.length;
}
