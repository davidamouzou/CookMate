"use client";

import { CalendarDays, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ComposerButtonProps = {
    /** Current day label shown on the left pill. */
    label: string;
    actionLabel: string;
    /** Hides the "jump to today" pill when the selected day already is today. */
    isToday: boolean;
    onAction: () => void;
    onLabelClick: () => void;
};

/**
 * The row sitting just above the tab bar: a "back to today" pill on the left
 * and the AI composer trigger on the right.
 */
export function ComposerButton({
    label,
    actionLabel,
    isToday,
    onAction,
    onLabelClick,
}: ComposerButtonProps) {
    return (
        <div className="mt-3 flex items-center justify-between gap-3">
            {isToday ? (
                <span className="font-mono text-xs text-muted-foreground">{label}</span>
            ) : (
                <button
                    type="button"
                    onClick={onLabelClick}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface-raised px-3 py-1.5",
                        "tap",
                        "font-mono text-xs font-bold transition-colors hover:border-primary/50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                >
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                    {label}
                </button>
            )}

            <button
                type="button"
                onClick={onAction}
                aria-label={actionLabel}
                className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-full",
                    "bg-surface-inverted text-surface-inverted-foreground shadow-lifted",
                    "transition-transform hover:scale-105",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
            >
                <Sparkles className="h-5 w-5" aria-hidden />
            </button>
        </div>
    );
}
