import * as React from "react";
import { cn } from "@/lib/utils";

export type LogMetric = {
    value: string;
    /** e.g. "kcals", "carbs", "fat", "protein". */
    unit: string;
};

type LogRowProps = {
    /** What was logged, e.g. "2 small sesame pastries". */
    title: string;
    /** Breakdown rendered as a single muted line under the title. */
    metrics: LogMetric[];
    /** Optional leading marker (emoji, colour chip, icon). */
    leading?: React.ReactNode;
    className?: string;
};

/**
 * One entry of the daily log: a bold title over a muted metric line, matching
 * the "300 kcals 30g carbs 18g fat 6g protein" pattern from the screenshots.
 */
export function LogRow({ title, metrics, leading, className }: LogRowProps) {
    return (
        <div className={cn("flex gap-2 py-1", className)}>
            {leading ? (
                <span className="mt-0.5 shrink-0 leading-none" aria-hidden>
                    {leading}
                </span>
            ) : null}
            <div className="min-w-0 flex-1">
                <p className="font-mono text-[0.8125rem] font-bold leading-tight">{title}</p>
                <p className="mt-0.5 font-mono text-[0.6875rem] leading-tight text-muted-foreground tabular">
                    {metrics.map((metric, index) => (
                        <React.Fragment key={`${metric.unit}-${index}`}>
                            {index > 0 ? " " : null}
                            <span className="text-foreground/70">{metric.value}</span> {metric.unit}
                        </React.Fragment>
                    ))}
                </p>
            </div>
        </div>
    );
}
