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
 *
 * Seven 44px chips do not fit a 320px screen, so below `sm` the strip scrolls
 * and carries the edge fade that says so. The fade used to eat the chip you
 * actually wanted: today sits at the far end, and scrolling it into view parks
 * it against the right edge, under the mask. The row now bleeds 12px into the
 * page gutter and pads the same amount back in, so the fade only ever covers
 * that padding — a chip at either extreme still lands in clear space.
 */
export function DayStrip({ days, selectedKey, onSelect, className }: DayStripProps) {
    const selectedRef = React.useRef<HTMLButtonElement>(null);

    // Narrow phones cannot show the whole week, and the day that matters is the
    // selected one — usually today, at the far end of the strip. Bring it into
    // view instead of leaving it clipped off the right edge.
    React.useEffect(() => {
        selectedRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
    }, [selectedKey]);

    return (
        <div
            className={cn(
                "scrollbar-hidden edge-fade -mx-3 flex snap-x snap-mandatory gap-1 overflow-x-auto scroll-p-3 px-3",
                // From sm the whole week fits, so the chips grow to fill the row
                // and both the scroll affordance and the bleed come off.
                "sm:mx-0 sm:snap-none sm:px-0 sm:[mask-image:none]",
                className
            )}
            role="tablist"
            aria-label="Select a day"
        >
            {days.map((item) => {
                const isSelected = item.key === selectedKey;

                return (
                    <button
                        key={item.key}
                        ref={isSelected ? selectedRef : undefined}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => onSelect?.(item.key)}
                        className={cn(
                            "tap flex min-w-[2.75rem] shrink-0 snap-center flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5",
                            "sm:flex-1",
                            "font-mono leading-none transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                            // Dark ink on the orange, not white: white on this
                            // hue is 1.99:1 and the day number disappears.
                            isSelected
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <span className="text-sm font-bold tabular">{item.day}</span>
                        <span className="text-label opacity-80">{item.weekday}</span>
                    </button>
                );
            })}
        </div>
    );
}
