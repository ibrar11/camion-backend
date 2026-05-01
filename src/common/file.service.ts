import * as fs from "node:fs";

import {
	Injectable,
	Logger,
} from "@nestjs/common";

@Injectable()
export class FileService {
	private readonly logger = new Logger(FileService.name);

	/**
	 * Deletes a file on the disk
	 *
	 * @param file
	 */
	async deleteFile(file: Express.Multer.File) {
		this.logger.log(`Deleting file at path: ${file.path}`);
		fs.unlinkSync(file.path);
	}

	/**
	 * Deletes a path on the disk
	 *
	 * @param path
	 */
	async deletePath(path: string) {
		this.logger.log(`Deleting file at path: ${path}`);
		fs.unlinkSync(path);
	}
}
