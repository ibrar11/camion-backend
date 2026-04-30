import crypto from "node:crypto";

import {
	S3Client,
	PutObjectCommand,
	CopyObjectCommand,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class S3Service {
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
		// Generate a unique name for the file being uploaded with the extension of the file
		const key = `${crypto.randomUUID()}.${file.originalname.substring(file.originalname.lastIndexOf('.') + 1)}`;

		// Create the upload command
		const command = new PutObjectCommand({
			Bucket: this.configService.get("AWS_S3_BUCKET"),
			Key: `${prefix}/${key}`,
			Body: file.buffer,
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
}
