/**
 * Accent tones of the tracking design system. One tone per tracked domain:
 * green for goals and progress, orange for calls to action and the active day,
 * blue for hydration, purple for AI, coral for warnings, yellow for weight.
 */
export const TONES = ["green", "orange", "blue", "purple", "coral", "yellow", "neutral"] as const;

export type Tone = (typeof TONES)[number];

/**
 * Accent colour for text and icons.
 *
 * This is the `-ink` step, not the bright `--track-*` hue: a warm accent at
 * full brightness sits around 2:1 on the cream canvas, so it reads as disabled
 * text rather than as emphasis. The ink step clears 4.5:1 on the page surface
 * and on its own `-soft` fill, in both themes.
 */
export const toneText: Record<Tone, string> = {
    green: "text-track-green-ink",
    orange: "text-track-orange-ink",
    blue: "text-track-blue-ink",
    purple: "text-track-purple-ink",
    coral: "text-track-coral-ink",
    yellow: "text-track-yellow-ink",
    neutral: "text-muted-foreground",
};

/** Tinted fill paired with a readable ink colour, for tiles and pills. */
export const toneSoft: Record<Tone, string> = {
    green: "bg-track-green-soft text-track-green-ink",
    orange: "bg-track-orange-soft text-track-orange-ink",
    blue: "bg-track-blue-soft text-track-blue-ink",
    purple: "bg-track-purple-soft text-track-purple-ink",
    coral: "bg-track-coral-soft text-track-coral-ink",
    yellow: "bg-track-yellow-soft text-track-yellow-ink",
    neutral: "bg-muted text-muted-foreground",
};

/** Colours the marker underline independently of the text colour. */
export const toneUnderline: Record<Tone, string> = {
    green: "after:bg-track-green",
    orange: "after:bg-track-orange",
    blue: "after:bg-track-blue",
    purple: "after:bg-track-purple",
    coral: "after:bg-track-coral",
    yellow: "after:bg-track-yellow",
    neutral: "after:bg-foreground",
};

export const toneBorder: Record<Tone, string> = {
    green: "border-track-green/40",
    orange: "border-track-orange/40",
    blue: "border-track-blue/40",
    purple: "border-track-purple/40",
    coral: "border-track-coral/40",
    yellow: "border-track-yellow/40",
    neutral: "border-border",
};
