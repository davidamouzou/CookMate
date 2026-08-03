import * as React from "react";
import { cn } from "@/lib/utils";
import { toneText, type Tone } from "@/components/ui/tone";

type FeatureTileProps = {
    icon: React.ReactNode;
    title: string;
    description: string;
    tone?: Tone;
    className?: string;
};

/**
 * Icon-over-text cell used in the marketing grids ("Custom goals", "Smart
 * adaptation", ...). Meant to be laid out in a 2- or 3-column grid.
 */
export function FeatureTile({
    icon,
    title,
    description,
    tone = "green",
    className,
}: FeatureTileProps) {
    return (
        <div className={cn("flex flex-col items-center px-2 py-4 text-center", className)}>
            <span className={cn("mb-2.5 [&>svg]:h-6 [&>svg]:w-6", toneText[tone])} aria-hidden>
                {icon}
            </span>
            <h3 className="font-mono text-sm font-bold leading-tight">{title}</h3>
            <p className="mt-1.5 max-w-[22ch] font-mono text-xs leading-snug text-muted-foreground">
                {description}
            </p>
        </div>
    );
}
