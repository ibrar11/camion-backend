import * as crypto from "node:crypto";

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { S3Service } from "../common/s3.service";
import { FileService } from "../common/file.service";

import { PushNotification } from "./entities/push-notification";
import { PushNotificationImage } from "./entities/push-notification-image";

@Injectable()
export class PushNotificationImageService {
  private readonly logger = new Logger(PushNotificationImageService.name);

  constructor(
    @Inject(S3Service) private readonly s3Service: S3Service,
    @Inject(FileService) private readonly fileService: FileService,
    @InjectRepository(PushNotification) private readonly PushNotificationRepository: Repository<PushNotification>,
    @InjectRepository(PushNotificationImage) private readonly pushNotificationImageRepository: Repository<PushNotificationImage>,
  ) { }

  /**
   * Creates images of a customize push notification
   *
   * @param pushNotificationUUID
   * @param file
   * @returns
   */
  async createPushNotificationImage(pushNotificationUUID: string, file: Express.Multer.File): Promise<PushNotificationImage> {
    this.logger.log(`Attempting to create a product image`);

    const customizePushNotification = await this.PushNotificationRepository.findOneBy({ uuid: pushNotificationUUID, });
    if (customizePushNotification === null) {
      throw new BadRequestException({
        error: "Failed to find the customize push notification. Please check and try again.",
      });
    }

    // Upload the file to s3
    let params: { key: string; url: string; } | null = null;
    try {
      params = await this.s3Service.uploadFile("customizePushNotifications", file);
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerErrorException({
        error: "Failed to upload the customize push notification image. Please try again.",
      });
    }

    // Delete the temporary files
    await this.fileService.deleteFile(file);

    // Create a review image
    const image = new PushNotificationImage();
    image.uuid = crypto.randomUUID();
    image.pushNotification = customizePushNotification;
    image.imageUrl = params.url;
    image.thumbnailUrl = params.url;
    return this.pushNotificationImageRepository.save(image);
  }
}
