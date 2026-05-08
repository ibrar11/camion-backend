import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

import sharp from "sharp";

import { Injectable } from "@nestjs/common";

@Injectable()
export class ImageThumbnailService {

	/**
	 * Generates thumbnails of a image
	 *
	 * @param imagePath
	 * @returns
	 */
	generateThumbnail(imagePath: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const outputPath = path.join(os.tmpdir(), `${crypto.randomUUID()}.jpg`);

			sharp(imagePath)
				.resize({
					width: 320,
					height: 320,
					fit: "cover",
					position: "center",
				})
				.toFormat("jpeg", { quality: 90 })
				.toFile(outputPath)
				.then(() => resolve(outputPath))
				.catch(err => reject(err));
		});
	}
}
