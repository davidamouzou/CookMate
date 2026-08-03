import type { Metadata } from "next";
import { CalendarCheck, Droplet, Flag, Sparkles, Target, TrendingUp } from "lucide-react";
import { DayStrip } from "@/components/ui/day-strip";
import { FeatureTile } from "@/components/ui/feature-tile";
import { LogRow } from "@/components/ui/log-row";
import { Marker } from "@/components/ui/marker";
import { Pill } from "@/components/ui/pill";
import { SectionCard } from "@/components/ui/section-card";
import { StatTile } from "@/components/ui/stat-tile";
import { TONES } from "@/components/ui/tone";

export const metadata: Metadata = {
    title: "Design system",
    robots: { index: false, follow: false },
};

const DAYS = [
    { key: "2025-12-24", day: "24", weekday: "Wed" },
    { key: "2025-12-25", day: "25", weekday: "Thu" },
    { key: "2025-12-26", day: "26", weekday: "Fri" },
    { key: "2025-12-27", day: "27", weekday: "Sat" },
    { key: "2025-12-28", day: "28", weekday: "Sun" },
    { key: "2025-12-29", day: "29", weekday: "Mon" },
    { key: "2025-12-30", day: "30", weekday: "Tue" },
];

const MEALS = [
    {
        title: "2 small sesame pastries",
        metrics: [
            { value: "300", unit: "kcals" },
            { value: "30g", unit: "carbs" },
            { value: "18g", unit: "fat" },
            { value: "6g", unit: "protein" },
        ],
    },
    {
        title: "1 can Monster Zero Sugar",
        metrics: [
            { value: "10", unit: "kcals" },
            { value: "3g", unit: "carbs" },
            { value: "0g", unit: "fat" },
            { value: "0g", unit: "protein" },
        ],
    },
    {
        title: "2 servings of homemade borscht with 10 dumplings",
        metrics: [
            { value: "500", unit: "kcals" },
            { value: "80g", unit: "carbs" },
            { value: "10g", unit: "fat" },
            { value: "10g", unit: "protein" },
        ],
    },
];

export default function DesignSystemPage() {
    return (
        <main className="min-h-screen bg-surface px-4 py-10">
            <div className="mx-auto flex max-w-3xl flex-col gap-8">
                <header>
                    <h1 className="font-mono text-3xl font-bold tracking-tight">
                        Design <Marker tone="green">system</Marker>
                    </h1>
                    <p className="mt-2 font-mono text-sm text-muted-foreground">
                        Tokens and primitives for the tracking screens.
                    </p>
                </header>

                <SectionCard title="Tones" aside="soft fill + ink">
                    <div className="flex flex-wrap gap-2">
                        {TONES.map((tone) => (
                            <Pill key={tone} tone={tone}>
                                {tone}
                            </Pill>
                        ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <StatTile label="Kcals" value="1065" goal="2725" />
                        <StatTile label="Carbs" value="52" goal="272" tone="orange" />
                        <StatTile label="Protein" value="82" tone="green" hint="of 183g" />
                        <StatTile label="Hydration" value="2061" goal="3480" tone="blue" />
                        <StatTile label="Caffeine" value="220" goal="400" tone="purple" />
                        <StatTile label="Weight" value="95.8" hint="-0.5 kg" tone="yellow" />
                    </div>
                </SectionCard>

                <SectionCard title="Typography">
                    <div className="space-y-3">
                        <p className="font-display text-4xl leading-none">
                            Hand-lettered accents
                        </p>
                        <p className="font-mono text-2xl font-bold">
                            Snap <Marker tone="blue" colorText={false}>your meal.</Marker>
                        </p>
                        <p className="font-mono text-2xl font-bold">
                            Your <Marker tone="green">results.</Marker>
                        </p>
                        <p className="font-sans text-sm text-muted-foreground">
                            Body copy stays in Outfit; the tracking UI uses JetBrains Mono so
                            figures line up column to column.
                        </p>
                        <p className="font-mono text-sm tabular">
                            1 796 kcal/day · 2 205 kcals · 90.8 kg · ~19 wks.
                        </p>
                    </div>
                </SectionCard>

                <SectionCard title="Wednesday" aside="24 December 2025">
                    <DayStrip days={DAYS} selectedKey="2025-12-24" />
                    <div className="mt-3 grid grid-cols-4 gap-2">
                        <StatTile label="Kcals" value="2830" />
                        <StatTile label="Carbs" value="346" />
                        <StatTile label="Protein" value="82" />
                        <StatTile label="Fats" value="118" />
                    </div>
                    <div className="mt-3 divide-y divide-border/50">
                        {MEALS.map((meal) => (
                            <LogRow key={meal.title} title={meal.title} metrics={meal.metrics} />
                        ))}
                    </div>
                    <div className="mt-3 flex flex-wrap justify-end gap-1.5">
                        <Pill tone="yellow">↓ 1.4kg</Pill>
                        <Pill tone="green">↑ 13.1k</Pill>
                        <Pill tone="orange">+389kcal</Pill>
                    </div>
                </SectionCard>

                <SectionCard title="Feature grid">
                    <div className="grid grid-cols-2 divide-x divide-y divide-border/50 sm:grid-cols-3">
                        <FeatureTile
                            icon={<Target />}
                            title="Custom goals"
                            description="Set your target and we'll build the plan."
                        />
                        <FeatureTile
                            icon={<TrendingUp />}
                            title="Smart adaptation"
                            description="We adjust to your progress and pace."
                            tone="purple"
                        />
                        <FeatureTile
                            icon={<CalendarCheck />}
                            title="Step by step"
                            description="Daily guidance that keeps you moving forward."
                            tone="orange"
                        />
                        <FeatureTile
                            icon={<Flag />}
                            title="Stay on track"
                            description="Clear milestones and meaningful feedback."
                        />
                        <FeatureTile
                            icon={<Droplet />}
                            title="Hydration"
                            description="Track water, drinks and caffeine."
                            tone="blue"
                        />
                        <FeatureTile
                            icon={<Sparkles />}
                            title="AI tracking"
                            description="Type or snap a meal, get instant macros."
                            tone="purple"
                        />
                    </div>
                </SectionCard>
            </div>
        </main>
    );
}
