import { apiConfig } from "@/api/config";
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

const base64ToBlob = (base64: string): Blob => {
    const byteString = atob(base64.split(",")[1]);
    const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([arrayBuffer], { type: mimeString });
};

// Compress an image to a Base64 string
export const compressImageToBase64 = async (
    base64String: string, megabytes: number
): Promise<string | null> => {
    try {
        const fileBlob: any = base64ToBlob(base64String);
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

export const uploadUrlImage = async (url: string): Promise<string | null> => {
    try {
        console.log(url)
        const response = await fetch(`${apiConfig.base_url}/upload/image`, {
            method: 'POST',
            headers: apiConfig.request_headers,
            body: JSON.stringify({ url: url }),
        });
        if (response.ok) {
            const imageSaveData = await response.json();
            return imageSaveData['url'] as string;
        } else {
            console.log("Upload => error to get image data");
            return null;
        }
    } catch (e) {
        console.log(`Error to upload image: ${e}`);
        return null;
    }
}