import * as React from "react";
import { cn } from "@/lib/utils";
import { toneSoft, type Tone } from "@/components/ui/tone";

type StatTileProps = {
    /** Small caption above the figure, e.g. "Kcals". */
    label: string;
    /** Main figure. Kept as a string so callers control formatting. */
    value: string;
    /** Optional denominator rendered as "1065/2725". */
    goal?: string;
    /** Optional caption under the figure, e.g. "kcals" or "-409 kcal to target". */
    hint?: string;
    tone?: Tone;
    className?: string;
};

/**
 * The compact figure tile used across the tracking screens: a muted label, a
 * large tabular figure, and an optional goal or hint.
 */
export function StatTile({
    label,
    value,
    goal,
    hint,
    tone = "neutral",
    className,
}: StatTileProps) {
    return (
        <div
            className={cn(
                "rounded-xl border border-border/60 px-3 py-2.5",
                tone === "neutral" ? "bg-surface-raised" : toneSoft[tone],
                className
            )}
        >
            <p className="font-mono text-[0.6875rem] leading-none opacity-70">{label}</p>
            <p className="mt-1.5 font-mono text-xl font-bold leading-none tabular">
                {value}
                {goal ? (
                    <span className="text-sm font-medium opacity-50">/{goal}</span>
                ) : null}
            </p>
            {hint ? (
                <p className="mt-1 font-mono text-[0.6875rem] leading-none opacity-60">{hint}</p>
            ) : null}
        </div>
    );
}
