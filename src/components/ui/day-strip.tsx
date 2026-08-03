"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type DayStripItem = {
    /** Stable key, typically an ISO date. */
    key: string;
    /** Day number, e.g. "24". */
    day: string;
    /** Three-letter weekday, e.g. "Wed". */
    weekday: string;
};

type DayStripProps = {
    days: DayStripItem[];
    selectedKey: string;
    onSelect?: (key: string) => void;
    className?: string;
};

/**
 * Horizontal day selector from the daily log screen. The active day is a filled
 * orange chip; the rest stay quiet.
 */
export function DayStrip({ days, selectedKey, onSelect, className }: DayStripProps) {
    return (
        <div
            className={cn("scrollbar-hidden flex gap-1 overflow-x-auto", className)}
            role="tablist"
            aria-label="Select a day"
        >
            {days.map((item) => {
                const isSelected = item.key === selectedKey;

                return (
                    <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => onSelect?.(item.key)}
                        className={cn(
                            "flex min-w-[2.75rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5",
                            "font-mono leading-none transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                            isSelected
                                ? "bg-track-orange text-white"
                                : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <span className="text-sm font-bold tabular">{item.day}</span>
                        <span className="text-[0.625rem] opacity-80">{item.weekday}</span>
                    </button>
                );
            })}
        </div>
    );
}
