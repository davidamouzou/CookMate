import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const MEAL_SCHEMA = `{
  "title": "string (short label for the meal, in the user's language)",
  "kcal": "number (total calories, integer)",
  "carbsG": "number (grams of carbohydrates)",
  "proteinG": "number (grams of protein)",
  "fatG": "number (grams of fat)"
}`;

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const LANGUAGE_NAMES: Record<string, string> = { fr: "French", en: "English" };

/** Strips markdown fences the model sometimes wraps around JSON. */
function extractJson(raw: string): string {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = (fenced?.[1] ?? raw).trim();
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    return start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
}

function toNumber(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export async function POST(request: NextRequest) {
    try {
        const { text, language = "en" } = (await request.json()) as {
            text?: string;
            language?: string;
        };

        if (!text?.trim()) {
            return NextResponse.json({ error: "A meal description is required" }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "Gemini API key is not configured" },
                { status: 500 }
            );
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite-preview",
            safetySettings,
        });

        const prompt = `You are a nutrition assistant. Estimate the nutrition of the meal described by the user.
Assume typical portion sizes when the user does not give quantities.
Write the title in ${LANGUAGE_NAMES[language] ?? "English"}.
Return ONLY valid JSON matching this exact schema (no markdown, no code blocks):
${MEAL_SCHEMA}

Meal: ${text}`;

        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(extractJson(result.response.text()));

        return NextResponse.json({
            title: typeof parsed.title === "string" && parsed.title.trim()
                ? parsed.title.trim()
                : text.trim(),
            kcal: Math.round(toNumber(parsed.kcal)),
            carbsG: toNumber(parsed.carbsG),
            proteinG: toNumber(parsed.proteinG),
            fatG: toNumber(parsed.fatG),
        });
    } catch (error) {
        console.error("Meal parsing failed:", error);
        return NextResponse.json({ error: "Could not estimate this meal" }, { status: 502 });
    }
}
