import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

import { ffmpegPath, ffprobePath } from "ffmpeg-ffprobe-static";

import ffmpeg from "@ts-ffmpeg/fluent-ffmpeg";
ffmpeg.setFfmpegPath(ffmpegPath as string);
ffmpeg.setFfprobePath(ffprobePath as string);

import { Injectable } from "@nestjs/common";

@Injectable()
export class VideoThumbnailService {

	/**
	 * Generates thumbnails of a video
	 *
	 * @param videoPath
	 * @returns
	 */
	generateThumbnail(videoPath: string): Promise<string> {
		const folder = os.tmpdir();
		const filename = `${crypto.randomUUID()}.jpg`;

		return new Promise((resolve, reject) => {
			ffmpeg(videoPath)
				.screenshots({
					timestamps: [2],
					folder: folder,
					filename: filename,
					size: '320x?',
				})
				.on("end", () => resolve(path.join(folder, filename)))
				.on("error", (err) => reject(err));
		});
	}
}
