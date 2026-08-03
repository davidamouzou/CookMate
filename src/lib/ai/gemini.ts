/**
 * A thin Gemini client over the REST endpoint.
 *
 * The `@google/generative-ai` SDK is still used by the older /api/generate
 * routes, but its `Tool` type only knows `googleSearchRetrieval` (the Gemini
 * 1.5 spelling). Search grounding on the current models is `google_search`,
 * and the grounding metadata it returns is what recipe discovery is built on —
 * hence the direct call. It is also one `fetch`, which is all the Workers
 * runtime needs.
 */

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

/** The model the app generates with. */
export const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";

/**
 * The model that runs the grounded web search. Split from the default because
 * search grounding is not offered on every tier, so it has to be swappable
 * without touching the rest of the app.
 */
export const SEARCH_MODEL = process.env.GEMINI_SEARCH_MODEL || DEFAULT_MODEL;

const SAFETY_SETTINGS = [
    "HARM_CATEGORY_HARASSMENT",
    "HARM_CATEGORY_HATE_SPEECH",
    "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "HARM_CATEGORY_DANGEROUS_CONTENT",
].map((category) => ({ category, threshold: "BLOCK_MEDIUM_AND_ABOVE" }));

export type GeminiSource = {
    /** Usually the site name or domain, as the grounding service reports it. */
    title: string;
    url: string;
};

export type GeminiResult = {
    text: string;
    /** Pages the answer was grounded in. Empty when search was not used. */
    sources: GeminiSource[];
    /** The queries the model actually ran — useful when a search finds nothing. */
    queries: string[];
};

export type GeminiImage = {
    /** Bare base64, no `data:` prefix. */
    base64: string;
    mimeType: string;
};

export type GeminiRequest = {
    prompt: string;
    system?: string;
    image?: GeminiImage;
    model?: string;
    /** Ground the answer in live Google Search results. */
    search?: boolean;
    /** Ask for `application/json` back. Cannot be combined with `search`. */
    json?: boolean;
    temperature?: number;
    signal?: AbortSignal;
};

export class GeminiError extends Error {
    constructor(message: string, readonly status = 502) {
        super(message);
        this.name = "GeminiError";
    }
}

export function isGeminiConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
}

type Part = { text: string } | { inlineData: { data: string; mimeType: string } };

type GeminiResponse = {
    candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
        groundingMetadata?: {
            webSearchQueries?: string[];
            groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
        };
    }>;
    promptFeedback?: { blockReason?: string };
    error?: { message?: string };
};

export async function callGemini({
    prompt,
    system,
    image,
    model = DEFAULT_MODEL,
    search = false,
    json = false,
    temperature,
    signal,
}: GeminiRequest): Promise<GeminiResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new GeminiError("Gemini API key is not configured", 500);
    }

    const parts: Part[] = [{ text: prompt }];
    if (image) {
        parts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });
    }

    const response = await fetch(`${API_ROOT}/${model}:generateContent`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
        },
        signal,
        body: JSON.stringify({
            contents: [{ role: "user", parts }],
            ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
            // Grounding and a forced JSON mime type are mutually exclusive on
            // the API, which is why discovery runs as two calls: one grounded
            // search, then one plain call that structures what it found.
            ...(search ? { tools: [{ google_search: {} }] } : {}),
            safetySettings: SAFETY_SETTINGS,
            generationConfig: {
                ...(temperature === undefined ? {} : { temperature }),
                ...(json && !search ? { responseMimeType: "application/json" } : {}),
            },
        }),
    });

    const body = (await response.json().catch(() => null)) as GeminiResponse | null;

    if (!response.ok) {
        throw new GeminiError(
            body?.error?.message || `Gemini request failed (${response.status})`,
            response.status === 429 ? 429 : 502
        );
    }

    if (body?.promptFeedback?.blockReason) {
        throw new GeminiError(`Request blocked by Gemini: ${body.promptFeedback.blockReason}`);
    }

    const candidate = body?.candidates?.[0];
    const text = (candidate?.content?.parts ?? [])
        .map((part) => part.text ?? "")
        .join("")
        .trim();

    if (!text) {
        throw new GeminiError(
            candidate?.finishReason
                ? `Gemini returned no text (${candidate.finishReason})`
                : "Gemini returned no text"
        );
    }

    return {
        text,
        sources: collectSources(candidate?.groundingMetadata?.groundingChunks),
        queries: candidate?.groundingMetadata?.webSearchQueries ?? [],
    };
}

function collectSources(
    chunks: Array<{ web?: { uri?: string; title?: string } }> | undefined
): GeminiSource[] {
    const seen = new Set<string>();
    const sources: GeminiSource[] = [];

    for (const chunk of chunks ?? []) {
        const url = chunk.web?.uri;
        if (!url || seen.has(url)) continue;
        seen.add(url);
        sources.push({ url, title: chunk.web?.title || hostOf(url) || url });
    }

    return sources;
}

function hostOf(url: string): string | null {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return null;
    }
}

/**
 * Pulls the JSON object or array out of a model reply.
 *
 * Even in JSON mode the reply is occasionally wrapped in a markdown fence or
 * trailed by a sentence, so the outermost braces are what we trust.
 */
export function extractJson(raw: string): string {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = (fenced?.[1] ?? raw).trim();

    const objectStart = candidate.indexOf("{");
    const arrayStart = candidate.indexOf("[");
    const start =
        objectStart === -1
            ? arrayStart
            : arrayStart === -1
                ? objectStart
                : Math.min(objectStart, arrayStart);

    if (start === -1) return candidate;

    const end = candidate[start] === "[" ? candidate.lastIndexOf("]") : candidate.lastIndexOf("}");
    return end > start ? candidate.slice(start, end + 1) : candidate;
}

const SUPPORTED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
]);

/**
 * Turns what the browser sends into an inline image part.
 *
 * The client may pass a full data URL (`FileReader.readAsDataURL`) or the bare
 * base64 payload, so both are accepted. An unsupported type returns null
 * rather than being sent on for the API to reject.
 */
export function parseImagePayload(
    input: string | null | undefined,
    fallbackMimeType = "image/jpeg"
): GeminiImage | null {
    const value = input?.trim();
    if (!value) return null;

    // `[\s\S]` rather than the `s` flag: the build targets ES2017.
    const dataUrl = value.match(/^data:([^;,]+)(?:;[^,]*)?,([\s\S]*)$/);
    const mimeType = (dataUrl?.[1] ?? fallbackMimeType).toLowerCase();
    const base64 = (dataUrl?.[2] ?? value).trim();

    if (!base64 || !SUPPORTED_IMAGE_TYPES.has(mimeType)) return null;

    return { base64, mimeType };
}

/** `callGemini` with `json: true`, parsed. Throws `GeminiError` on bad JSON. */
export async function callGeminiJson<T>(request: GeminiRequest): Promise<T> {
    const { text } = await callGemini({ ...request, json: true });

    try {
        return JSON.parse(extractJson(text)) as T;
    } catch {
        throw new GeminiError("Gemini returned a reply that is not valid JSON");
    }
}
