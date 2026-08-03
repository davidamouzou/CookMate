import * as React from "react";
import { cn } from "@/lib/utils";

type SectionCardProps = React.HTMLAttributes<HTMLDivElement> & {
    /** Left-aligned section title. */
    title?: React.ReactNode;
    /** Right-aligned caption, e.g. "moving average" or a date. */
    aside?: React.ReactNode;
    /** Removes inner padding when the content is edge-to-edge (charts, lists). */
    flush?: boolean;
};

/** The rounded raised container that groups a tracking section. */
export function SectionCard({
    title,
    aside,
    flush = false,
    className,
    children,
    ...props
}: SectionCardProps) {
    return (
        <section
            className={cn(
                "rounded-2xl border border-border/60 bg-surface-raised shadow-tile",
                flush ? "p-0" : "p-4",
                className
            )}
            {...props}
        >
            {title || aside ? (
                <header
                    className={cn(
                        "flex items-baseline justify-between gap-3",
                        flush && "px-4 pt-4",
                        children ? "mb-3" : undefined
                    )}
                >
                    {title ? (
                        <h2 className="font-mono text-sm font-bold leading-none">{title}</h2>
                    ) : <span />}
                    {aside ? (
                        <span className="font-mono text-[0.6875rem] leading-none text-muted-foreground">
                            {aside}
                        </span>
                    ) : null}
                </header>
            ) : null}
            {children}
        </section>
    );
}
