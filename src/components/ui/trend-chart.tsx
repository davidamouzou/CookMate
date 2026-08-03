"use client";

import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type TrendPoint = {
    /** Day key, used as the tooltip label. */
    label: string;
    value: number | null;
};

type TrendChartProps = {
    points: TrendPoint[];
    /** Centred moving average, same length as `points`. */
    trend?: (number | null)[];
    /** Horizontal reference line, e.g. the daily calorie goal. */
    target?: number | null;
    targetLabel?: string;
    unit?: string;
    height?: number;
    className?: string;
    /** Rendered under the chart as the table alternative. */
    tableCaption?: string;
};

const PADDING = { top: 8, right: 8, bottom: 18, left: 34 };

/**
 * Daily values as dots with a moving-average line — the consumption trend.
 *
 * One series, so no legend: the section title names it. The line colour is a
 * validated plot hue, not a UI accent, because accents fail contrast as marks.
 */
export function TrendChart({
    points,
    trend,
    target,
    targetLabel,
    unit = "",
    height = 150,
    className,
    tableCaption,
}: TrendChartProps) {
    const gradientId = useId();
    const [hovered, setHovered] = useState<number | null>(null);

    const width = 320;
    const plotWidth = width - PADDING.left - PADDING.right;
    const plotHeight = height - PADDING.top - PADDING.bottom;

    const { min, max } = useMemo(() => {
        const values = [
            ...points.map((point) => point.value),
            ...(trend ?? []),
            target ?? null,
        ].filter((value): value is number => value !== null);

        if (values.length === 0) return { min: 0, max: 1 };

        const rawMin = Math.min(...values);
        const rawMax = Math.max(...values);
        // Pad by 10% so marks never touch the frame, and never invert.
        const pad = Math.max((rawMax - rawMin) * 0.1, 1);
        return { min: Math.max(0, rawMin - pad), max: rawMax + pad };
    }, [points, trend, target]);

    const x = (index: number) =>
        PADDING.left + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
    const y = (value: number) =>
        PADDING.top + plotHeight - ((value - min) / (max - min || 1)) * plotHeight;

    // Cheap enough to recompute each render, and it keeps the scale helpers
    // (which close over min/max) out of a dependency array.
    let trendPath = "";
    if (trend) {
        let started = false;
        trend.forEach((value, index) => {
            if (value === null) {
                started = false;
                return;
            }
            trendPath += `${started ? "L" : "M"}${x(index).toFixed(1)},${y(value).toFixed(1)}`;
            started = true;
        });
    }

    const hoveredPoint = hovered === null ? null : points[hovered];

    return (
        <figure className={cn("m-0", className)}>
            <div className="relative">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full"
                    role="img"
                    aria-label={tableCaption}
                    onMouseLeave={() => setHovered(null)}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--plot-calories))" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="hsl(var(--plot-calories))" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Recessive axis labels */}
                    {[max, (max + min) / 2, min].map((value, index) => (
                        <text
                            key={index}
                            x={PADDING.left - 5}
                            y={y(value) + 3}
                            textAnchor="end"
                            className="fill-muted-foreground font-mono"
                            style={{ fontSize: 7 }}
                        >
                            {Math.round(value)}
                        </text>
                    ))}

                    {/* Target reference line, dashed and neutral so it reads as a rule */}
                    {target !== null && target !== undefined ? (
                        <>
                            <line
                                x1={PADDING.left}
                                x2={width - PADDING.right}
                                y1={y(target)}
                                y2={y(target)}
                                className="stroke-muted-foreground/50"
                                strokeWidth={1}
                                strokeDasharray="3 3"
                            />
                            {targetLabel ? (
                                <text
                                    x={width - PADDING.right}
                                    y={y(target) - 3}
                                    textAnchor="end"
                                    className="fill-muted-foreground font-mono"
                                    style={{ fontSize: 7 }}
                                >
                                    {targetLabel}
                                </text>
                            ) : null}
                        </>
                    ) : null}

                    {trendPath ? (
                        <>
                            <path
                                d={`${trendPath}L${x(points.length - 1)},${PADDING.top + plotHeight}L${x(0)},${PADDING.top + plotHeight}Z`}
                                fill={`url(#${gradientId})`}
                            />
                            <path
                                d={trendPath}
                                fill="none"
                                stroke="hsl(var(--plot-calories))"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </>
                    ) : null}

                    {/* Daily dots share the line's hue: they are the same measure,
                        raw versus smoothed, so mark shape carries the difference
                        and no legend is needed. The surface ring keeps them
                        legible where they sit on the line. */}
                    {points.map((point, index) =>
                        point.value === null ? null : (
                            <circle
                                key={point.label}
                                cx={x(index)}
                                cy={y(point.value)}
                                r={hovered === index ? 4.5 : 3}
                                fill="hsl(var(--plot-calories))"
                                stroke="hsl(var(--surface-raised))"
                                strokeWidth={2}
                            />
                        )
                    )}

                    {/* Hit targets wider than the marks */}
                    {points.map((point, index) => (
                        <rect
                            key={`hit-${point.label}`}
                            x={x(index) - plotWidth / Math.max(points.length, 1) / 2}
                            y={PADDING.top}
                            width={plotWidth / Math.max(points.length, 1)}
                            height={plotHeight}
                            fill="transparent"
                            onMouseEnter={() => setHovered(index)}
                        />
                    ))}
                </svg>

                {hoveredPoint ? (
                    <div
                        className="pointer-events-none absolute top-0 rounded-md bg-surface-inverted px-2 py-1 font-mono text-[0.625rem] text-surface-inverted-foreground tabular"
                        style={{ left: `${(x(hovered!) / width) * 100}%`, transform: "translateX(-50%)" }}
                    >
                        {hoveredPoint.label}
                        {hoveredPoint.value !== null ? ` · ${Math.round(hoveredPoint.value)}${unit}` : ""}
                    </div>
                ) : null}
            </div>

            {tableCaption ? (
                <figcaption className="sr-only">
                    <table>
                        <caption>{tableCaption}</caption>
                        <tbody>
                            {points.map((point) => (
                                <tr key={point.label}>
                                    <th scope="row">{point.label}</th>
                                    <td>{point.value === null ? "—" : `${Math.round(point.value)}${unit}`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </figcaption>
            ) : null}
        </figure>
    );
}
