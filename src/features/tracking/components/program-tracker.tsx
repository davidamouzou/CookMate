"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendChart, type TrendPoint } from "@/components/ui/trend-chart";
import { ProgramProvider } from "@/features/tracking/api/program-provider";
import { TrackingProvider } from "@/features/tracking/api/tracking-provider";
import { SessionNotice } from "@/features/tracking/components/session-notice";
import { addDays, toDayKey } from "@/features/tracking/types/entry";
import {
    averageOf,
    movingAverage,
    weeksToGoal,
    type Program,
    type WeightEntry,
} from "@/features/tracking/types/program";

const TREND_DAYS = 14;

export function ProgramTracker({ locale }: { locale: string }) {
    const t = useTranslations("Program");

    const [today] = useState(() => new Date());
    const todayKey = useMemo(() => toDayKey(today), [today]);

    const [userId, setUserId] = useState<string | null>(null);
    const [program, setProgram] = useState<Program | null>(null);
    const [weights, setWeights] = useState<WeightEntry[]>([]);
    const [calories, setCalories] = useState<Map<string, number>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [sessionFailed, setSessionFailed] = useState(false);
    const [weightInput, setWeightInput] = useState("");

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
            const from = toDayKey(addDays(today, -(TREND_DAYS - 1)));

            const [loadedProgram, loadedWeights, loadedCalories] = await Promise.all([
                ProgramProvider.getProgram(id),
                ProgramProvider.getWeights(id, from, todayKey),
                ProgramProvider.getDailyCalories(id, from, todayKey),
            ]);
            if (cancelled) return;

            setProgram(loadedProgram);
            setWeights(loadedWeights);
            setCalories(loadedCalories);
            setIsLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [today, todayKey]);

    const days = useMemo(
        () =>
            Array.from({ length: TREND_DAYS }, (_, index) =>
                addDays(today, index - (TREND_DAYS - 1))
            ),
        [today]
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

    const handleRecordWeight = useCallback(async () => {
        if (!userId) return;

        const parsed = Number.parseFloat(weightInput.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed <= 0) return;

        const saved = await ProgramProvider.recordWeight(userId, todayKey, parsed);
        if (!saved) return;

        setWeights((current) => [
            ...current.filter((entry) => entry.loggedOn !== todayKey),
            saved,
        ]);
        setWeightInput("");
    }, [userId, weightInput, todayKey]);

    if (sessionFailed) {
        return (
            <SessionNotice
                isRetrying={isLoading}
                onRetry={() => window.location.reload()}
            />
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    return (
        <div className="flex min-h-full flex-col">
            {/* Programme header, tinted green as in the design */}
            <section className="rounded-2xl bg-track-green-soft p-4 text-track-green-ink">
                <h1 className="font-mono text-xl font-bold leading-none">{t("title")}</h1>
                <p className="mt-1.5 font-mono text-[0.6875rem] opacity-70">
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

                <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                        <p className="font-mono text-[0.5625rem] uppercase tracking-wide opacity-60">
                            {t("dailyGoal")}
                        </p>
                        <p className="font-mono text-2xl font-bold leading-none tabular">
                            {program?.dailyKcal ?? "—"}
                        </p>
                        <p className="font-mono text-[0.6875rem] opacity-70">{t("kcals")}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-mono text-[0.5625rem] uppercase tracking-wide opacity-60">
                            {t("programGoal")}
                        </p>
                        <p className="font-mono text-2xl font-bold leading-none tabular">
                            {program?.goalWeightKg !== null && program?.goalWeightKg !== undefined
                                ? `${program.goalWeightKg} kg`
                                : "—"}
                        </p>
                        <p className="font-mono text-[0.6875rem] opacity-70 tabular">
                            {t("pace", { pace: program?.paceKgPerWeek ?? 0 })}
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex items-start justify-between gap-4 border-t border-current/15 pt-3">
                    <div>
                        <p className="font-mono text-[0.6875rem] opacity-70">{t("weeklyAverage")}</p>
                        <p className="font-mono text-lg font-bold leading-none tabular">
                            {weeklyAverage === null ? "—" : Math.round(weeklyAverage)}
                            <span className="ml-1 text-[0.6875rem] font-medium opacity-70">
                                {t("kcalPerDay")}
                            </span>
                        </p>
                        {toTarget !== null ? (
                            <p className="font-mono text-[0.6875rem] opacity-70 tabular">
                                {t("toTarget", { delta: toTarget > 0 ? `+${toTarget}` : String(toTarget) })}
                            </p>
                        ) : null}
                    </div>
                    <div className="text-right">
                        <p className="font-mono text-[0.6875rem] opacity-70">{t("timeToGoal")}</p>
                        <p className="font-mono text-lg font-bold leading-none tabular">
                            {weeks === null ? "—" : t("weeks", { count: weeks })}
                        </p>
                        <p className="font-mono text-[0.6875rem] opacity-70">{t("atCurrentPace")}</p>
                    </div>
                </div>

                <div className="mt-3 flex justify-between gap-2 border-t border-current/15 pt-3 font-mono text-[0.6875rem] tabular">
                    <span className="opacity-70">
                        {t("start")}: {program?.startWeightKg ?? "—"}
                        {program?.startWeightKg ? " kg" : ""}
                    </span>
                    <span className="font-bold">
                        {t("now")}: {currentWeight ?? "—"}
                        {currentWeight ? " kg" : ""}
                    </span>
                    <span className="opacity-70">
                        {t("goal")}: {program?.goalWeightKg ?? "—"}
                        {program?.goalWeightKg ? " kg" : ""}
                    </span>
                </div>
            </section>

            <section className="mt-3 rounded-2xl border border-border/60 bg-surface-raised p-4">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                    <h2 className="font-mono text-sm font-bold">
                        {t("trendTitle", { days: TREND_DAYS })}
                    </h2>
                    <span className="font-mono text-[0.6875rem] text-muted-foreground">
                        {t("movingAverage")}
                    </span>
                </div>
                <TrendChart
                    points={points}
                    trend={trend}
                    target={program?.dailyKcal ?? null}
                    targetLabel={t("goalShort")}
                    unit=" kcal"
                    tableCaption={t("trendTitle", { days: TREND_DAYS })}
                />
            </section>

            <section className="mt-3 rounded-2xl border border-border/60 bg-surface-raised p-4">
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
                                void handleRecordWeight();
                            }
                        }}
                    />
                    <Button
                        type="button"
                        onClick={() => void handleRecordWeight()}
                        disabled={weightInput.trim().length === 0}
                        className="shrink-0 font-mono"
                    >
                        {t("save")}
                    </Button>
                </div>
                <p className="mt-2 font-mono text-[0.625rem] text-muted-foreground">
                    {t("oneReadingPerDay")}
                </p>
            </section>
        </div>
    );
}
