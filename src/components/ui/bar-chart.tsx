"use client";

import { useState } from "react";
import { useMeasuredWidth } from "@/hooks/use-measured-width";
import { cn } from "@/lib/utils";

export type Bar = {
    /**
     * Stable identity. Labels repeat once the window is longer than a week —
     * two Tuesdays in a fortnight — so they cannot serve as React keys.
     */
    key: string;
    label: string;
    value: number;
};

type BarChartProps = {
    bars: Bar[];
    /** Reference line, e.g. the daily hydration goal. */
    target?: number | null;
    unit?: string;
    height?: number;
    className?: string;
    tableCaption?: string;
};

/**
 * Height per tier, from the width the chart is actually given rather than from
 * a page breakpoint — the same component reads right in the page column and in
 * the narrower side column.
 */
function heightFor(width: number): number {
    if (width < 480) return 120;
    if (width < 900) return 160;
    return 200;
}

/**
 * Daily magnitude as bars — hydration per day.
 *
 * One series, so no legend. Bars carry a 2px surface gap and 4px rounded tops
 * anchored to the baseline; bars at or above target take the full hue, those
 * below take a muted step of the same hue so the comparison reads without a
 * second colour.
 */
export function BarChart({
    bars,
    target,
    unit = "",
    height,
    className,
    tableCaption,
}: BarChartProps) {
    const [hovered, setHovered] = useState<number | null>(null);
    const { ref, width } = useMeasuredWidth<HTMLDivElement>();

    const max = Math.max(...bars.map((bar) => bar.value), target ?? 0, 1);
    const barCount = Math.max(bars.length, 1);
    const chartHeight = height ?? heightFor(width);

    return (
        <figure className={cn("m-0", className)} ref={ref}>
            <div
                className="relative flex items-end gap-[2px]"
                style={{ height: chartHeight }}
                onMouseLeave={() => setHovered(null)}
            >
                {target ? (
                    <div
                        className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/50"
                        style={{ bottom: `${(target / max) * 100}%` }}
                        aria-hidden
                    />
                ) : null}

                {bars.map((bar, index) => {
                    const reached = target ? bar.value >= target : true;

                    return (
                        <button
                            key={bar.key}
                            type="button"
                            onMouseEnter={() => setHovered(index)}
                            onFocus={() => setHovered(index)}
                            onBlur={() => setHovered(null)}
                            // A finger has no hover: tapping a bar pins its value.
                            onPointerDown={() => setHovered(index)}
                            aria-label={`${bar.label}: ${Math.round(bar.value)}${unit}`}
                            className="group relative flex h-full flex-1 items-end focus-visible:outline-none"
                            style={{ minWidth: `${100 / barCount}%` }}
                        >
                            <span
                                className={cn(
                                    "w-full rounded-t transition-all",
                                    reached ? "bg-plot-hydration" : "bg-plot-hydration/35",
                                    hovered === index && "opacity-80"
                                )}
                                style={{
                                    height: `${Math.max((bar.value / max) * 100, bar.value > 0 ? 3 : 0)}%`,
                                    borderTopLeftRadius: 4,
                                    borderTopRightRadius: 4,
                                }}
                            />
                        </button>
                    );
                })}

                {hovered !== null ? (
                    <div
                        className="pointer-events-none absolute -top-1 z-10 rounded-md bg-surface-inverted px-2 py-1 font-mono text-label text-surface-inverted-foreground tabular"
                        style={{
                            left: `${((hovered + 0.5) / barCount) * 100}%`,
                            transform: "translateX(-50%)",
                        }}
                    >
                        {bars[hovered].label} · {Math.round(bars[hovered].value)}
                        {unit}
                    </div>
                ) : null}
            </div>

            {tableCaption ? (
                <figcaption className="sr-only">
                    <table>
                        <caption>{tableCaption}</caption>
                        <tbody>
                            {bars.map((bar) => (
                                <tr key={bar.key}>
                                    <th scope="row">{bar.label}</th>
                                    <td>{`${Math.round(bar.value)}${unit}`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </figcaption>
            ) : null}
        </figure>
    );
}
