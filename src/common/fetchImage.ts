import * as fs from "node:fs";
import * as nodePath from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

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
            response.headers.get("content-type")?.split(";")[0].trim() || "image/jpeg";

        const originalname =
            imageUrl.split("/").pop()?.split("?")[0] ||
            `image-${Date.now()}.jpg`;

        // Write to a temp file so downstream services (sharp) can read via file.path
        const tmpFilename = `${crypto.randomUUID()}-${originalname}`;
        const tmpPath = nodePath.join(os.tmpdir(), tmpFilename);
        fs.writeFileSync(tmpPath, buffer);

        const file: Express.Multer.File = {
            fieldname: "file",
            originalname,
            encoding: "7bit",
            mimetype: mimeType,
            size: buffer.length,
            buffer,
            stream: undefined as any,
            destination: os.tmpdir(),
            filename: tmpFilename,
            path: tmpPath,
        };

        return file;
    } catch (error: any) {
        console.error(`Error fetching image: ${imageUrl}`, error.message);
        throw error;
    }
}