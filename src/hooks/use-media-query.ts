"use client";

import { useEffect, useState } from "react";

/**
 * Tracks a media query on the client.
 *
 * Used where the *amount* of data shown depends on the tier — a fortnight of
 * calories in the pocket, a month on a desktop — which is a data decision the
 * CSS cannot make. Layout still belongs in CSS.
 *
 * Returns false during server rendering and the first paint, so the smaller
 * dataset is always the default.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const list = window.matchMedia(query);
        setMatches(list.matches);

        const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
        list.addEventListener("change", onChange);
        return () => list.removeEventListener("change", onChange);
    }, [query]);

    return matches;
}
