"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { DayStrip, type DayStripItem } from "@/components/ui/day-strip";
import { LogRow } from "@/components/ui/log-row";
import { Pill } from "@/components/ui/pill";
import { StatTile } from "@/components/ui/stat-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackingProvider } from "@/features/tracking/api/tracking-provider";
import { AddEntry } from "@/features/tracking/components/add-entry";
import { ComposerButton } from "@/features/tracking/components/composer-button";
import {
    DEFAULT_GOALS,
    addDays,
    sumMacros,
    toDayKey,
    type DailyGoals,
    type FoodEntry,
    type ParsedMeal,
} from "@/features/tracking/types/entry";

const VISIBLE_DAYS = 7;

/** The seven-day window ending today, so the current day sits last. */
function buildDays(today: Date, locale: string): DayStripItem[] {
    return Array.from({ length: VISIBLE_DAYS }, (_, index) => {
        const date = addDays(today, index - (VISIBLE_DAYS - 1));
        return {
            key: toDayKey(date),
            day: String(date.getDate()),
            weekday: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date),
        };
    });
}

export function TodayTracker({ locale }: { locale: string }) {
    const t = useTranslations("Track");

    // Fixed at mount so the strip does not shift while the page is open.
    const [today] = useState(() => new Date());
    const days = useMemo(() => buildDays(today, locale), [today, locale]);
    const todayKey = useMemo(() => toDayKey(today), [today]);

    const [selectedDay, setSelectedDay] = useState(todayKey);
    const [goals, setGoals] = useState<DailyGoals>(DEFAULT_GOALS);
    const [entries, setEntries] = useState<FoodEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [composerOpen, setComposerOpen] = useState(false);

    // The log lives in localStorage, which only exists on the client — hence
    // reading it in an effect rather than during render.
    useEffect(() => {
        setGoals(TrackingProvider.getGoals());
    }, []);

    useEffect(() => {
        setEntries(TrackingProvider.getEntries(selectedDay));
        setIsLoading(false);
    }, [selectedDay]);

    const totals = useMemo(() => sumMacros(entries), [entries]);
    const remaining = goals.kcal - totals.kcal;

    const handleAdd = useCallback(
        async (meal: ParsedMeal) => {
            const created = TrackingProvider.addEntry(selectedDay, meal, "ai_text");
            if (created) setEntries((current) => [...current, created]);
        },
        [selectedDay]
    );

    const handleDelete = useCallback((entryId: string) => {
        // Optimistic: put the row back if the write is refused.
        const previous = entries;
        setEntries((current) => current.filter((entry) => entry.id !== entryId));

        if (!TrackingProvider.deleteEntry(entryId)) setEntries(previous);
    }, [entries]);

    const selectedDate = new Date(`${selectedDay}T00:00:00`);
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(selectedDate);

    return (
        <div className="flex flex-1 flex-col">
            <header className="flex items-baseline justify-between gap-3">
                <h1 className="font-mono text-title font-bold capitalize tracking-tight">
                    {weekday}
                </h1>
                <p className="text-right font-mono text-meta leading-tight text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    }).format(selectedDate)}
                </p>
            </header>

            <div className="mt-3">
                <DayStrip days={days} selectedKey={selectedDay} onSelect={setSelectedDay} />
            </div>

            {/* Four figures across only fit once there is room for "880/2000"
                in each; below sm they stack two by two instead of clipping. */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label={t("kcals")} value={String(totals.kcal)} goal={String(goals.kcal)} />
                <StatTile
                    label={t("carbs")}
                    value={String(Math.round(totals.carbsG))}
                    goal={String(goals.carbsG)}
                />
                <StatTile
                    label={t("protein")}
                    value={String(Math.round(totals.proteinG))}
                    goal={String(goals.proteinG)}
                />
                <StatTile
                    label={t("fats")}
                    value={String(Math.round(totals.fatG))}
                    goal={String(goals.fatG)}
                />
            </div>

            <div className="mt-4 flex-1">
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-4/5" />
                    </div>
                ) : entries.length === 0 ? (
                    <p className="py-10 text-center font-mono text-sm text-muted-foreground">
                        {t("empty")}
                    </p>
                ) : (
                    <ul>
                        {entries.map((entry) => (
                            <li key={entry.id} className="group flex items-start gap-2">
                                <LogRow
                                    className="flex-1"
                                    title={entry.title}
                                    metrics={[
                                        { value: String(entry.kcal), unit: t("kcalsUnit") },
                                        { value: `${Math.round(entry.carbsG)}g`, unit: t("carbsUnit") },
                                        { value: `${Math.round(entry.fatG)}g`, unit: t("fatUnit") },
                                        { value: `${Math.round(entry.proteinG)}g`, unit: t("proteinUnit") },
                                    ]}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleDelete(entry.id)}
                                    aria-label={t("deleteEntry", { title: entry.title })}
                                    className="row-action mt-1.5 rounded-md p-1.5 text-muted-foreground transition hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <p className="mt-6 text-center font-mono text-label text-muted-foreground/70">
                {t("aiFootnote")}
            </p>

            {/* Right-aligned once both pills share a line. Below that they wrap,
                and two right-aligned fragments of different widths read as
                ragged, so the narrowest tier aligns them left. */}
            {entries.length > 0 ? (
                <div className="mt-3 flex flex-wrap justify-start gap-1.5 xs:justify-end">
                    <Pill tone={remaining >= 0 ? "green" : "coral"}>
                        {remaining >= 0
                            ? t("remaining", { count: remaining })
                            : t("over", { count: Math.abs(remaining) })}
                    </Pill>
                    <Pill tone="neutral">{t("entryCount", { count: entries.length })}</Pill>
                </div>
            ) : null}

            <AddEntry
                locale={locale}
                open={composerOpen}
                onClose={() => setComposerOpen(false)}
                onAdd={handleAdd}
            />

            <ComposerButton
                label={selectedDay === todayKey ? t("todayButton") : weekday}
                actionLabel={t("addTitle")}
                isToday={selectedDay === todayKey}
                onAction={() => setComposerOpen((open) => !open)}
                onLabelClick={() => setSelectedDay(todayKey)}
            />
        </div>
    );
}
