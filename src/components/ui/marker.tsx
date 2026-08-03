import * as React from "react";
import { cn } from "@/lib/utils";
import { toneText, toneUnderline, type Tone } from "@/components/ui/tone";

type MarkerProps = React.HTMLAttributes<HTMLSpanElement> & {
    tone?: Tone;
    /**
     * Whether the word itself takes the tone colour. The underline is always
     * toned, so `false` gives the "black text, coloured stroke" variant.
     */
    colorText?: boolean;
};

/** Wraps a word in a hand-drawn marker underline. */
export function Marker({
    tone = "green",
    colorText = true,
    className,
    children,
    ...props
}: MarkerProps) {
    return (
        <span
            className={cn(
                "marker-underline",
                toneUnderline[tone],
                colorText && toneText[tone],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
