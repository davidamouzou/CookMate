"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { BarChart, type Bar } from "@/components/ui/bar-chart";
import { LogRow } from "@/components/ui/log-row";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { HydrationProvider } from "@/features/tracking/api/hydration-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { addDays, toDayKey } from "@/features/tracking/types/entry";
import {
    DEFAULT_HYDRATION_GOALS,
    DRINK_PRESETS,
    formatLitres,
    sumHydration,
    type DrinkEntry,
    type HydrationGoals,
} from "@/features/tracking/types/hydration";
import { cn } from "@/lib/utils";

/**
 * A week fits a phone; a desktop has room for a fortnight without the bars
 * thinning into hairlines.
 */
const HISTORY_DAYS = 7;
const HISTORY_DAYS_WIDE = 14;

const PRESET_TONE: Record<string, string> = {
    blue: "bg-track-blue-soft text-track-blue-ink",
    orange: "bg-track-orange-soft text-track-orange-ink",
    purple: "bg-track-purple-soft text-track-purple-ink",
    // `bg-muted` alone is within a percent of the page canvas, so the neutral
    // preset used to read as plain text rather than as a button.
    neutral: "border border-border bg-surface-raised text-muted-foreground",
};

export function WaterTracker({ locale }: { locale: string }) {
    const t = useTranslations("Water");

    const isWide = useMediaQuery("(min-width: 1440px)");
    const historyDays = isWide ? HISTORY_DAYS_WIDE : HISTORY_DAYS;

    const [today] = useState(() => new Date());
    const todayKey = useMemo(() => toDayKey(today), [today]);

    const [goals, setGoals] = useState<HydrationGoals>(DEFAULT_HYDRATION_GOALS);
    const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
    const [history, setHistory] = useState<Map<string, number>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    // The log lives in localStorage, which only exists on the client — hence
    // reading it in an effect rather than during render.
    useEffect(() => {
        const from = toDayKey(addDays(today, -(historyDays - 1)));

        setGoals(HydrationProvider.getGoals());
        setDrinks(HydrationProvider.getDrinks(todayKey));
        setHistory(HydrationProvider.getDailyHydration(from, todayKey));
        setIsLoading(false);
        // `historyDays` is a dependency: widening the window has to fetch it.
    }, [today, todayKey, historyDays]);

    const totals = useMemo(() => sumHydration(drinks), [drinks]);

    const bars: Bar[] = useMemo(
        () =>
            Array.from({ length: historyDays }, (_, index) => {
                const date = addDays(today, index - (historyDays - 1));
                const key = toDayKey(date);
                return {
                    key,
                    label: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date),
                    value: key === todayKey ? totals.hydrationMl : (history.get(key) ?? 0),
                };
            }),
        [today, locale, history, todayKey, historyDays, totals.hydrationMl]
    );

    const handleAdd = useCallback(
        (presetKey: string) => {
            const preset = DRINK_PRESETS.find((item) => item.key === presetKey);
            if (!preset) return;

            const created = HydrationProvider.addDrink(todayKey, {
                title: t(`presets.${preset.key}`),
                volumeMl: preset.volumeMl,
                hydrationPct: preset.hydrationPct,
                caffeineMg: preset.caffeineMg,
            });

            if (created) setDrinks((current) => [...current, created]);
        },
        [todayKey, t]
    );

    const handleDelete = useCallback((drinkId: string) => {
        // Optimistic: put the row back if the write is refused.
        const previous = drinks;
        setDrinks((current) => current.filter((drink) => drink.id !== drinkId));

        if (!HydrationProvider.deleteDrink(drinkId)) setDrinks(previous);
    }, [drinks]);

    const goalPct = goals.waterMl > 0 ? Math.round((totals.hydrationMl / goals.waterMl) * 100) : 0;
    /** One label per day up to a week, then one per pair. */
    const labelStride = historyDays > 7 ? 2 : 1;

    return (
        <div className="flex flex-1 flex-col">
            <header className="flex items-baseline gap-2">
                <h1 className="font-mono text-title font-bold tracking-tight">
                    {t("today")}
                </h1>
                <span className="font-mono text-title font-bold text-track-blue-ink">
                    {t("water")}
                </span>
            </header>

            {/* Four figures across only fit once there is room for "510/2500"
                in each; below sm they stack two by two instead of clipping. */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile
                    label={t("hydration")}
                    value={String(totals.hydrationMl)}
                    goal={String(goals.waterMl)}
                />
                <StatTile label={t("intake")} value={String(totals.intakeMl)} />
                <StatTile
                    label={t("caffeine")}
                    value={String(totals.caffeineMg)}
                    goal={String(goals.caffeineMg)}
                />
                <StatTile label={t("drinks")} value={String(totals.drinks)} />
            </div>

            {/* From lg the log and the week sit side by side rather than the
                log pushing the chart below the fold on a wide screen. Below lg
                they simply stack: giving the log `flex-1` there stretched it to
                the foot of the viewport and pushed the chart off the bottom. */}
            <div className="mt-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
                <div>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-3/4" />
                        </div>
                    ) : drinks.length === 0 ? (
                        <p className="py-8 text-center font-mono text-sm text-muted-foreground">
                            {t("empty")}
                        </p>
                    ) : (
                        <ul>
                            {drinks.map((drink) => (
                                <li key={drink.id} className="group flex items-start gap-2">
                                    <LogRow
                                        className="flex-1"
                                        title={drink.title}
                                        leading={
                                            <span
                                                className="mt-1 block h-3 w-1.5 rounded-full bg-plot-hydration"
                                                aria-hidden
                                            />
                                        }
                                        metrics={[
                                            { value: `${drink.volumeMl}`, unit: "ml" },
                                            { value: `${drink.hydrationPct}%`, unit: t("hydrationUnit") },
                                            ...(drink.caffeineMg > 0
                                                ? [{ value: `${drink.caffeineMg}`, unit: t("caffeineUnit") }]
                                                : []),
                                        ]}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(drink.id)}
                                        aria-label={t("deleteDrink", { title: drink.title })}
                                        className="row-action mt-1.5 rounded-md p-1.5 text-muted-foreground transition hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div>
                    <section className="mt-4 rounded-2xl border border-border/60 bg-surface-raised p-4 lg:mt-0">
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <h2 className="font-mono text-sm font-bold">
                                {t("weekTitle", { days: historyDays })}
                            </h2>
                            <p className="font-mono text-meta text-muted-foreground tabular">
                                {formatLitres(totals.hydrationMl)} · {t("ofGoal", { pct: goalPct })}
                            </p>
                        </div>
                        <BarChart
                            bars={bars}
                            target={goals.waterMl}
                            unit=" ml"
                            tableCaption={t("weekTitle", { days: historyDays })}
                        />
                        {/* Past a week the weekday names repeat and crowd, so one
                            label covers each pair of days rather than being
                            squeezed to an ellipsis. The chart itself names every
                            bar on hover or tap. */}
                        <div className="mt-1 flex gap-[2px]">
                            {bars.map((bar, index) =>
                                index % labelStride !== 0 ? null : (
                                    <span
                                        key={bar.key}
                                        style={{ flex: labelStride }}
                                        className="min-w-0 truncate text-center font-mono text-label text-muted-foreground"
                                    >
                                        {bar.label}
                                    </span>
                                )
                            )}
                        </div>
                    </section>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {DRINK_PRESETS.map((preset) => (
                            <button
                                key={preset.key}
                                type="button"
                                onClick={() => handleAdd(preset.key)}
                                className={cn(
                                    "flex flex-col items-start gap-0.5 rounded-xl px-2.5 py-2 text-left transition-opacity hover:opacity-80",
                                    "tap",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    PRESET_TONE[preset.tone]
                                )}
                            >
                                <Plus className="h-3 w-3 opacity-60" aria-hidden />
                                <span className="font-mono text-label font-bold leading-tight">
                                    {t(`presets.${preset.key}`)}
                                </span>
                                <span className="font-mono text-label opacity-70 tabular">
                                    {preset.volumeMl} ml
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
