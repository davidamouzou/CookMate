"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { BarChart, type Bar } from "@/components/ui/bar-chart";
import { LogRow } from "@/components/ui/log-row";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { HydrationProvider } from "@/features/tracking/api/hydration-provider";
import { TrackingProvider } from "@/features/tracking/api/tracking-provider";
import { SessionNotice } from "@/features/tracking/components/session-notice";
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

const HISTORY_DAYS = 7;

const PRESET_TONE: Record<string, string> = {
    blue: "bg-track-blue-soft text-track-blue-ink",
    orange: "bg-track-orange-soft text-track-orange-ink",
    purple: "bg-track-purple-soft text-track-purple-ink",
    neutral: "bg-muted text-muted-foreground",
};

export function WaterTracker({ locale }: { locale: string }) {
    const t = useTranslations("Water");

    const [today] = useState(() => new Date());
    const todayKey = useMemo(() => toDayKey(today), [today]);

    const [userId, setUserId] = useState<string | null>(null);
    const [goals, setGoals] = useState<HydrationGoals>(DEFAULT_HYDRATION_GOALS);
    const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
    const [history, setHistory] = useState<Map<string, number>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [sessionFailed, setSessionFailed] = useState(false);

    const loadHistory = useCallback(
        async (id: string) => {
            const from = toDayKey(addDays(today, -(HISTORY_DAYS - 1)));
            setHistory(await HydrationProvider.getDailyHydration(id, from, todayKey));
        },
        [today, todayKey]
    );

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const id = await TrackingProvider.ensureSession();
            if (cancelled) return;

            if (!id) {
                setSessionFailed(true);
                setIsLoading(false);
                return;
            }

            setUserId(id);
            const [loadedGoals, loadedDrinks] = await Promise.all([
                HydrationProvider.getGoals(id),
                HydrationProvider.getDrinks(id, todayKey),
            ]);
            if (cancelled) return;

            setGoals(loadedGoals);
            setDrinks(loadedDrinks);
            await loadHistory(id);
            setIsLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [todayKey, loadHistory]);

    const totals = useMemo(() => sumHydration(drinks), [drinks]);

    const bars: Bar[] = useMemo(
        () =>
            Array.from({ length: HISTORY_DAYS }, (_, index) => {
                const date = addDays(today, index - (HISTORY_DAYS - 1));
                const key = toDayKey(date);
                return {
                    label: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date),
                    value: key === todayKey ? totals.hydrationMl : (history.get(key) ?? 0),
                };
            }),
        [today, locale, history, todayKey, totals.hydrationMl]
    );

    const handleAdd = useCallback(
        async (presetKey: string) => {
            if (!userId) return;

            const preset = DRINK_PRESETS.find((item) => item.key === presetKey);
            if (!preset) return;

            const created = await HydrationProvider.addDrink(userId, todayKey, {
                title: t(`presets.${preset.key}`),
                volumeMl: preset.volumeMl,
                hydrationPct: preset.hydrationPct,
                caffeineMg: preset.caffeineMg,
            });

            if (created) setDrinks((current) => [...current, created]);
        },
        [userId, todayKey, t]
    );

    const handleDelete = useCallback(
        async (drinkId: string) => {
            if (!userId) return;

            const previous = drinks;
            setDrinks((current) => current.filter((drink) => drink.id !== drinkId));

            const ok = await HydrationProvider.deleteDrink(userId, drinkId);
            if (!ok) setDrinks(previous);
        },
        [userId, drinks]
    );

    if (sessionFailed) {
        return (
            <SessionNotice
                isRetrying={isLoading}
                onRetry={() => window.location.reload()}
            />
        );
    }

    const goalPct = goals.waterMl > 0 ? Math.round((totals.hydrationMl / goals.waterMl) * 100) : 0;

    return (
        <div className="flex min-h-full flex-col">
            <header className="flex items-baseline gap-2">
                <h1 className="font-mono text-2xl font-bold leading-none tracking-tight">
                    {t("today")}
                </h1>
                <span className="font-mono text-2xl font-bold leading-none text-track-blue">
                    {t("water")}
                </span>
            </header>

            <div className="mt-3 grid grid-cols-4 gap-2">
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

            <div className="mt-4 flex-1">
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
                                    onClick={() => void handleDelete(drink.id)}
                                    aria-label={t("deleteDrink", { title: drink.title })}
                                    className="mt-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
                                >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <section className="mt-4 rounded-2xl border border-border/60 bg-surface-raised p-4">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h2 className="font-mono text-sm font-bold">{t("weekTitle")}</h2>
                    <p className="font-mono text-[0.6875rem] text-muted-foreground tabular">
                        {formatLitres(totals.hydrationMl)} · {t("ofGoal", { pct: goalPct })}
                    </p>
                </div>
                <BarChart
                    bars={bars}
                    target={goals.waterMl}
                    unit=" ml"
                    tableCaption={t("weekTitle")}
                />
                <div className="mt-1 flex gap-[2px]">
                    {bars.map((bar) => (
                        <span
                            key={bar.label}
                            className="flex-1 text-center font-mono text-[0.5625rem] text-muted-foreground"
                        >
                            {bar.label}
                        </span>
                    ))}
                </div>
            </section>

            <div className="mt-3 grid grid-cols-4 gap-2">
                {DRINK_PRESETS.map((preset) => (
                    <button
                        key={preset.key}
                        type="button"
                        onClick={() => void handleAdd(preset.key)}
                        className={cn(
                            "flex flex-col items-start gap-0.5 rounded-xl px-2.5 py-2 text-left transition-opacity hover:opacity-80",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            PRESET_TONE[preset.tone]
                        )}
                    >
                        <Plus className="h-3 w-3 opacity-60" aria-hidden />
                        <span className="font-mono text-[0.625rem] font-bold leading-tight">
                            {t(`presets.${preset.key}`)}
                        </span>
                        <span className="font-mono text-[0.5625rem] opacity-70 tabular">
                            {preset.volumeMl} ml
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
