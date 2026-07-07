import * as fs from "fs/promises";
import * as crypto from "node:crypto";

import {
	S3Client,
	PutObjectCommand,
	CopyObjectCommand,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import {
	Injectable,
	Logger,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

@Injectable()
export class S3Service {
	private readonly logger = new Logger(S3Service.name);

	s3: S3Client;

	constructor(private readonly configService: ConfigService) {
		this.s3 = new S3Client({
			region: this.configService.get<string>("AWS_S3_REGION"),
			// endpoint: 'http://127.0.0.1:9000',
			// credentials: {
			// 	accessKeyId: this.configService.get("AWS_S3_ACCESS_KEY_ID") as string,
			// 	secretAccessKey: this.configService.get("AWS_S3_SECRET_ACCESS_KEY") as string,
			// },
		});
	}

	/**
	 * Uploads a file to s3
	 *
	 * @param prefix
	 * @param file
	 * @returns
	 */
	async uploadFile(prefix: string, file: Express.Multer.File): Promise<{ key: string, url: string, }> {
		this.logger.log(`Uploading file: ${file.path} to S3`);

		// Make sure a file exists at the path
		try {
			fs.access(file.path, fs.constants.F_OK);
		} catch {
			throw new Error(`Failed to find the file at the path. Please make sure the file exists.`);
		}

		// Read the file
		const readStream = await fs.readFile(file.path);

		// Generate a unique name for the file being uploaded with the extension of the file
		const key = `${crypto.randomUUID()}.${file.originalname.substring(file.originalname.lastIndexOf('.') + 1)}`;

		// Create the upload command
		const command = new PutObjectCommand({
			Bucket: this.configService.get("AWS_S3_BUCKET"),
			Key: `${prefix}/${key}`,
			Body: readStream,
			ContentType: file.mimetype,
		});

		// Wait till the file is uploaded
		await this.s3.send(command);

		return {
			key: `${prefix}/${key}`,
			url: `s3://${prefix}/${key}`,
		};
	}

	/**
	 * Uploads a file to s3
	 *
	 * @param prefix
	 * @param filePath
	 * @param mimetype
	 * @returns
	 */
	async uploadPath(prefix: string, filePath: string, mimetype: string): Promise<{ key: string, url: string, }> {
		this.logger.log(`Uploading path: ${filePath} to s3`);

		try {
			fs.access(filePath, fs.constants.F_OK);
		} catch {
			throw new Error(`Failed to find the file at the path. Please make sure the file exists.`);
		}

		// Read the file
		const readStream = await fs.readFile(filePath);

		// Generate a unique name for the file being uploaded with the extension of the file
		const key = `${crypto.randomUUID()}.${filePath.substring(filePath.lastIndexOf('.') + 1)}`;

		// Create the upload command
		const command = new PutObjectCommand({
			Bucket: this.configService.get("AWS_S3_BUCKET"),
			Key: `${prefix}/${key}`,
			Body: readStream,
			ContentType: mimetype,
		});

		// Wait till the file is uploaded
		await this.s3.send(command);

		return {
			key: `${prefix}/${key}`,
			url: `s3://${prefix}/${key}`,
		};
	}

	/**
	 * Moves a file from source key to destination key
	 *
	 * @param sourceKey
	 * @returns
	 */
	async moveFile(prefix: string, sourceKey: string): Promise<{ key: string, url: string, }> {
		// Generate a unique name for the file being uploaded with the extension of the file
		const destKey = `${crypto.randomUUID()}.${sourceKey.substring(sourceKey.lastIndexOf('.') + 1)}`;

		// Move the source file to destination file
		await this.s3.send(new CopyObjectCommand({
			Bucket: this.configService.get<string>("AWS_S3_BUCKET"),
			CopySource: `${this.configService.get<string>("AWS_S3_BUCKET")}/${sourceKey}`,
			Key: `${prefix}/${destKey}`,
		}));

		// Delete the source file after moving it to destination
		await this.s3.send(new DeleteObjectCommand({
			Bucket: this.configService.get<string>("AWS_S3_BUCKET"),
			Key: sourceKey,
		}));

		return {
			key: `${prefix}/${destKey}`,
			url: `s3://${prefix}/${destKey}`,
		};
	}

	/**
	 * Deletes a file
	 *
	 * @param key
	 */
	async deleteFile(key: string): Promise<void> {
		this.logger.log(`Deleting file: ${key}`);
		await this.s3.send(new DeleteObjectCommand({
			Bucket: this.configService.get<string>('AWS_S3_BUCKET'),
			Key: key,
		}));
	}
}
