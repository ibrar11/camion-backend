
export async function fetchImageAsFile(imageUrl: string): Promise<Express.Multer.File> {
    try {
        if (!imageUrl) {
            throw new Error("Image URL is required");
        }

        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${imageUrl}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const mimeType =
            response.headers.get("content-type") || "image/jpeg";

        const filename =
            imageUrl.split("/").pop()?.split("?")[0] ||
            `image-${Date.now()}.jpg`;

        const file: Express.Multer.File = {
            fieldname: "file",
            originalname: filename,
            encoding: "7bit",
            mimetype: mimeType,
            size: buffer.length,
            buffer,
            stream: undefined as any,
            destination: "",
            filename,
            path: "",
        };

        return file;
    } catch (error: any) {
        console.error(`Error fetching image: ${imageUrl}`, error.message);
        throw error;
    }
}