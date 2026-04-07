import { NextRequest, NextResponse } from "next/server";

const GETIMG_API_URL = "https://api.getimg.ai/v1/flux-schnell/text-to-image";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { description } = body as { description?: string };

        if (!description) {
            return NextResponse.json(
                { error: "Image description is required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.IMAGE_GEN_MODEL_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Image generation API key is not configured" },
                { status: 500 }
            );
        }

        const prompt = `Professional food photography of ${description}. Appetizing, well-lit, high resolution, on a beautiful plate, restaurant quality presentation.`;

        const response = await fetch(GETIMG_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt,
                width: 1024,
                height: 1024,
                steps: 4,
                output_format: "jpeg",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("getimg.ai API error:", errorText);
            return NextResponse.json(
                { error: "Failed to generate image" },
                { status: response.status }
            );
        }

        const data = await response.json();

        if (data.image) {
            // Return the base64 image data - the client will handle uploading to Firebase Storage
            return NextResponse.json({
                base64: data.image,
                contentType: "image/jpeg",
            });
        }

        return NextResponse.json(
            { error: "No image data in response" },
            { status: 500 }
        );
    } catch (error) {
        console.error("Error generating image:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate image" },
            { status: 500 }
        );
    }
}
