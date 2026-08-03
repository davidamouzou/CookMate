/**
 * Accent tones of the tracking design system. One tone per tracked domain:
 * green for goals and progress, orange for calls to action and the active day,
 * blue for hydration, purple for AI, coral for warnings, yellow for weight.
 */
export const TONES = ["green", "orange", "blue", "purple", "coral", "yellow", "neutral"] as const;

export type Tone = (typeof TONES)[number];

/** Solid accent colour, for icons, strokes and emphasis. */
export const toneText: Record<Tone, string> = {
    green: "text-track-green",
    orange: "text-track-orange",
    blue: "text-track-blue",
    purple: "text-track-purple",
    coral: "text-track-coral",
    yellow: "text-track-yellow",
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
    green: "border-track-green/30",
    orange: "border-track-orange/30",
    blue: "border-track-blue/30",
    purple: "border-track-purple/30",
    coral: "border-track-coral/30",
    yellow: "border-track-yellow/30",
    neutral: "border-border",
};
