"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendChart, type TrendPoint } from "@/components/ui/trend-chart";
import { ProgramProvider } from "@/features/tracking/api/program-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { addDays, toDayKey } from "@/features/tracking/types/entry";
import {
    averageOf,
    movingAverage,
    weeksToGoal,
    type Program,
    type WeightEntry,
} from "@/features/tracking/types/program";

/**
 * A desktop buys density, not scale: the same chart shows a month instead of a
 * fortnight. Below that the points would crowd, so the window stays short.
 */
const TREND_DAYS = 14;
const TREND_DAYS_WIDE = 30;

export function ProgramTracker({ locale }: { locale: string }) {
    const t = useTranslations("Program");

    const isWide = useMediaQuery("(min-width: 1440px)");
    const trendDays = isWide ? TREND_DAYS_WIDE : TREND_DAYS;

    const [today] = useState(() => new Date());
    const todayKey = useMemo(() => toDayKey(today), [today]);

    const [program, setProgram] = useState<Program | null>(null);
    const [weights, setWeights] = useState<WeightEntry[]>([]);
    const [calories, setCalories] = useState<Map<string, number>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [weightInput, setWeightInput] = useState("");

    // The programme lives in localStorage, which only exists on the client —
    // hence reading it in an effect rather than during render.
    useEffect(() => {
        const from = toDayKey(addDays(today, -(trendDays - 1)));

        setProgram(ProgramProvider.getProgram());
        setWeights(ProgramProvider.getWeights(from, todayKey));
        setCalories(ProgramProvider.getDailyCalories(from, todayKey));
        setIsLoading(false);
        // `trendDays` is a dependency: widening the window has to fetch it.
    }, [today, todayKey, trendDays]);

    const days = useMemo(
        () =>
            Array.from({ length: trendDays }, (_, index) =>
                addDays(today, index - (trendDays - 1))
            ),
        [today, trendDays]
    );

    const points: TrendPoint[] = useMemo(
        () =>
            days.map((date) => {
                const key = toDayKey(date);
                const value = calories.get(key);
                return {
                    label: new Intl.DateTimeFormat(locale, {
                        day: "numeric",
                        month: "short",
                    }).format(date),
                    // A day with no entries is a gap, not a zero.
                    value: value === undefined ? null : value,
                };
            }),
        [days, calories, locale]
    );

    const trend = useMemo(() => movingAverage(points.map((point) => point.value)), [points]);
    const weeklyAverage = useMemo(() => averageOf(points.map((point) => point.value)), [points]);

    const currentWeight = weights.length > 0 ? weights[weights.length - 1].weightKg : null;
    const weeks = program ? weeksToGoal(currentWeight, program) : null;
    const toTarget =
        program && weeklyAverage !== null ? Math.round(weeklyAverage - program.dailyKcal) : null;

    const handleRecordWeight = useCallback(() => {
        const parsed = Number.parseFloat(weightInput.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed <= 0) return;

        const saved = ProgramProvider.recordWeight(todayKey, parsed);
        if (!saved) return;

        setWeights((current) => [
            ...current.filter((entry) => entry.loggedOn !== todayKey),
            saved,
        ]);
        // The first reading can seed the start weight, so re-read the programme.
        setProgram(ProgramProvider.getProgram());
        setWeightInput("");
    }, [weightInput, todayKey]);

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            {/* Programme header, tinted green as in the design */}
            <section className="rounded-2xl bg-track-green-soft p-4 text-track-green-ink">
                <h1 className="font-mono text-title font-bold">{t("title")}</h1>
                <p className="mt-1.5 font-mono text-meta opacity-70">
                    {program?.startedOn
                        ? t("since", {
                            date: new Intl.DateTimeFormat(locale, {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            }).format(new Date(`${program.startedOn}T00:00:00`)),
                        })
                        : t("noProgram")}
                </p>

                <div className="mt-4 flex items-start justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                        <p className="font-mono text-label uppercase tracking-wide opacity-60">
                            {t("dailyGoal")}
                        </p>
                        <p className="font-mono text-figure font-bold tabular">
                            {program?.dailyKcal ?? "—"}
                        </p>
                        <p className="font-mono text-meta opacity-70">{t("kcals")}</p>
                    </div>
                    <div className="min-w-0 text-right">
                        <p className="font-mono text-label uppercase tracking-wide opacity-60">
                            {t("programGoal")}
                        </p>
                        <p className="font-mono text-figure font-bold tabular">
                            {program?.goalWeightKg !== null && program?.goalWeightKg !== undefined
                                ? `${program.goalWeightKg} kg`
                                : "—"}
                        </p>
                        <p className="font-mono text-meta opacity-70 tabular">
                            {t("pace", { pace: program?.paceKgPerWeek ?? 0 })}
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex items-start justify-between gap-3 border-t border-current/15 pt-3 sm:gap-4">
                    <div className="min-w-0">
                        <p className="font-mono text-meta opacity-70">{t("weeklyAverage")}</p>
                        <p className="font-mono text-lg font-bold leading-none tabular">
                            {weeklyAverage === null ? "—" : Math.round(weeklyAverage)}
                            <span className="ml-1 text-meta font-medium opacity-70">
                                {t("kcalPerDay")}
                            </span>
                        </p>
                        {toTarget !== null ? (
                            <p className="font-mono text-meta opacity-70 tabular">
                                {t("toTarget", { delta: toTarget > 0 ? `+${toTarget}` : String(toTarget) })}
                            </p>
                        ) : null}
                    </div>
                    <div className="min-w-0 text-right">
                        <p className="font-mono text-meta opacity-70">{t("timeToGoal")}</p>
                        <p className="font-mono text-lg font-bold leading-none tabular">
                            {weeks === null ? "—" : t("weeks", { count: weeks })}
                        </p>
                        <p className="font-mono text-meta opacity-70">{t("atCurrentPace")}</p>
                    </div>
                </div>

                {/* Three readings of the same measure, so they line up in equal
                    columns. The caption sits above its figure rather than beside
                    it: at 320px "Départ: 84.2 kg" on one line either wraps mid
                    value or loses its unit to an ellipsis. */}
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-current/15 pt-3 font-mono text-label tabular sm:text-meta">
                    <span className="opacity-70">
                        <span className="block">{t("start")}</span>
                        {program?.startWeightKg ?? "—"}
                        {program?.startWeightKg ? " kg" : ""}
                    </span>
                    <span className="text-center font-bold">
                        <span className="block font-medium opacity-70">{t("now")}</span>
                        {currentWeight ?? "—"}
                        {currentWeight ? " kg" : ""}
                    </span>
                    <span className="text-right opacity-70">
                        <span className="block">{t("goal")}</span>
                        {program?.goalWeightKg ?? "—"}
                        {program?.goalWeightKg ? " kg" : ""}
                    </span>
                </div>
            </section>

            {/* From lg the trend and the weight form share a row: the chart gets
                the width it deserves and the form stops sitting alone. */}
            <div className="mt-3 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-4">
                <section className="rounded-2xl border border-border/60 bg-surface-raised p-4">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <h2 className="font-mono text-sm font-bold">
                            {t("trendTitle", { days: trendDays })}
                        </h2>
                        <span className="font-mono text-meta text-muted-foreground">
                            {t("movingAverage")}
                        </span>
                    </div>
                    <TrendChart
                        points={points}
                        trend={trend}
                        target={program?.dailyKcal ?? null}
                        targetLabel={t("goalShort")}
                        unit=" kcal"
                        tableCaption={t("trendTitle", { days: trendDays })}
                    />
                </section>

                <section className="mt-3 rounded-2xl border border-border/60 bg-surface-raised p-4 lg:mt-0">
                    <h2 className="mb-2 font-mono text-sm font-bold">{t("logWeight")}</h2>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            min="0"
                            value={weightInput}
                            onChange={(event) => setWeightInput(event.target.value)}
                            placeholder={t("weightPlaceholder")}
                            className="font-mono text-sm"
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    handleRecordWeight();
                                }
                            }}
                        />
                        <Button
                            type="button"
                            onClick={() => handleRecordWeight()}
                            disabled={weightInput.trim().length === 0}
                            className="shrink-0 font-mono"
                        >
                            {t("save")}
                        </Button>
                    </div>
                    <p className="mt-2 font-mono text-label text-muted-foreground">
                        {t("oneReadingPerDay")}
                    </p>
                </section>
            </div>
        </div>
    );
}
