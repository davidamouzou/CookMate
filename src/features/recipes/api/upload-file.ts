import {
    RECIPE_IMAGES_BUCKET,
    isSupabaseConfigured,
    missingSupabaseMessage,
    supabase,
} from "@/lib/supabase";
import imageCompression from "browser-image-compression";


export function extractErrorMessageSafe(input: string): string | null {
    try {
        // Remplacer les quotes simples par des doubles pour rendre le JSON valide
        const jsonStr = input.replace(/'/g, '"');

        // Trouver la partie JSON dans la chaîne
        const jsonStart = jsonStr.indexOf('{');
        const jsonPart = jsonStr.slice(jsonStart);

        const parsed = JSON.parse(jsonPart);

        return parsed?.error?.message ?? null;
    } catch {
        return null;
    }
}


const options = {
    maxSizeMB: 2.9,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
};

const base64ToFile = (base64: string): File => {
    const byteString = atob(base64.split(",")[1]);
    const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i);
    }
    return new File([arrayBuffer], "image", { type: mimeString });
};

// Compress an image to a Base64 string
export const compressImageToBase64 = async (
    base64String: string, megabytes: number
): Promise<string | null> => {
    try {
        const fileBlob = base64ToFile(base64String);
        let compressedFile = await imageCompression(fileBlob, options);

        while (compressedFile.size > megabytes * 1024 * 1024) {
            options.maxSizeMB /= 2;
            compressedFile = await imageCompression(fileBlob, options);
            if (options.maxSizeMB < 0.1) {
                console.error(`Error to compress image ${megabytes} Mo.`)
            }
        }

        return await imageCompression.getDataUrlFromFile(compressedFile);
    } catch (error) {
        console.error(`Failed to compress image below ${megabytes} Mo: ` + error);
        return null;
    }
}

// Convert base64 string to Blob
const base64ToBlob = (base64: string, contentType: string = "image/jpeg"): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
};

const buildImagePath = (extension: string = "jpg"): string =>
    `recipes/${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

// Upload a blob to Supabase Storage and return its public URL.
const putObject = async (blob: Blob, contentType: string): Promise<string | null> => {
    const path = buildImagePath();

    const { error } = await supabase.storage
        .from(RECIPE_IMAGES_BUCKET)
        .upload(path, blob, { contentType, upsert: false });

    if (error) {
        console.error("Error uploading image to Supabase Storage:", error.message);
        return null;
    }

    const { data } = supabase.storage.from(RECIPE_IMAGES_BUCKET).getPublicUrl(path);
    return data.publicUrl;
};

// Upload image to Supabase Storage and return the public URL
export const uploadImageToStorage = async (
    base64Data: string,
    contentType: string = "image/jpeg"
): Promise<string | null> => {
    try {
        if (!isSupabaseConfigured) {
            console.error(missingSupabaseMessage);
            return null;
        }

        return await putObject(base64ToBlob(base64Data, contentType), contentType);
    } catch (error) {
        console.error("Error uploading image to Supabase Storage:", error);
        return null;
    }
};

// Upload image from URL to Supabase Storage
export const uploadUrlImage = async (url: string): Promise<string | null> => {
    try {
        if (!isSupabaseConfigured) {
            console.error(missingSupabaseMessage);
            return null;
        }

        // Fetch the image from the URL
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Failed to fetch image from URL:", url);
            return null;
        }

        const blob = await response.blob();
        return await putObject(blob, blob.type || "image/jpeg");
    } catch (error) {
        console.error("Error uploading image from URL:", error);
        return null;
    }
};
