"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reports the rendered width of an element in CSS pixels.
 *
 * Charts use it to size their `viewBox` to the space they actually occupy, so
 * one SVG unit stays one pixel. A fixed viewBox stretched to fit scales its own
 * contents: labels, strokes and radii all grow with the container, and the
 * chart ends up looking zoomed rather than more detailed.
 *
 * `initial` is what server rendering and the first paint use, before the
 * observer reports.
 */
export function useMeasuredWidth<T extends HTMLElement>(initial = 320) {
    const ref = useRef<T>(null);
    const [width, setWidth] = useState(initial);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const measure = () => {
            // Sub-pixel widths make the geometry jitter on resize; whole pixels
            // are what the layout is drawn on anyway.
            const next = Math.round(node.getBoundingClientRect().width);
            if (next > 0) setWidth(next);
        };

        measure();

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure);
            return () => window.removeEventListener("resize", measure);
        }

        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return { ref, width };
}
