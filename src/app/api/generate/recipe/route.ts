import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const RECIPE_SCHEMA = `{
  "recipe_name": "string",
  "description": "string (short description of the dish)",
  "ingredients": ["string array of ingredients with quantities"],
  "instructions": ["string array of step-by-step instructions"],
  "continent": "string (e.g., Europe, Asia, Africa, North America, South America, Oceania)",
  "cuisine": "string (e.g., French, Italian, Japanese, Mexican)",
  "duration_to_cook": "number (in minutes)",
  "servings": "number",
  "difficulty": "string (easy, medium, hard)",
  "meal_type": "string (breakfast, lunch, dinner, snack, dessert)",
  "nutrition_facts": {
    "calories": "string (e.g., '450 kcal')",
    "protein": "string (e.g., '25g')",
    "carbohydrates": "string (e.g., '30g')",
    "fat": "string (e.g., '15g')",
    "dietary_fiber": "string (e.g., '5g')",
    "sugar": "string (e.g., '8g')"
  }
}`;

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, language = "en", files } = body as {
            text?: string;
            language?: string;
            files?: Array<{ base64: string }>;
        };

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

        const systemPrompt = `You are a professional chef and recipe creator. Generate a detailed recipe based on the user's request.
The recipe MUST be in ${language === "fr" ? "French" : language === "es" ? "Spanish" : language === "de" ? "German" : "English"}.
Return ONLY valid JSON matching this exact schema (no markdown, no code blocks, just pure JSON):
${RECIPE_SCHEMA}`;

        let result;

        if (files && files.length > 0 && files[0].base64) {
            const imagePart = {
                inlineData: {
                    data: files[0].base64,
                    mimeType: "image/jpeg",
                },
            };

            const userPrompt = text || "Generate a recipe based on the ingredients visible in this image.";

            result = await model.generateContent([
                systemPrompt,
                userPrompt,
                imagePart,
            ]);
        } else {
            if (!text) {
                return NextResponse.json(
                    { error: "Either text prompt or image is required" },
                    { status: 400 }
                );
            }

            result = await model.generateContent([
                systemPrompt,
                `Create a recipe for: ${text}`,
            ]);
        }

        const response = result.response;
        const responseText = response.text();

        // Clean the response - remove markdown code blocks if present
        const cleanedResponse = responseText
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        try {
            const recipe = JSON.parse(cleanedResponse);
            return NextResponse.json(recipe);
        } catch {
            console.error("Failed to parse Gemini response as JSON:", cleanedResponse);
            return NextResponse.json(
                { error: "Failed to parse recipe from AI response" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error generating recipe:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate recipe" },
            { status: 500 }
        );
    }
}
