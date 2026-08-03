import * as React from "react";
import { cn } from "@/lib/utils";
import { toneSoft, type Tone } from "@/components/ui/tone";

type PillProps = React.HTMLAttributes<HTMLSpanElement> & {
    tone?: Tone;
    icon?: React.ReactNode;
};

/**
 * Small rounded badge used for deltas and summaries, e.g. "↓1.4kg" or
 * "+389kcal".
 */
export function Pill({ tone = "neutral", icon, className, children, ...props }: PillProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1",
                "font-mono text-meta font-medium leading-none tabular",
                toneSoft[tone],
                className
            )}
            {...props}
        >
            {icon ? <span className="shrink-0" aria-hidden>{icon}</span> : null}
            {children}
        </span>
    );
}
