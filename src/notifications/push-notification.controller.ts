import * as os from "node:os";

import {
    Controller,
    Get,
    UseGuards,
    Inject,
    Post,
    UseInterceptors,
    HttpCode,
    HttpStatus,
    Param,
    UploadedFile,
    Body,
    Delete,
    Put,
} from "@nestjs/common";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../users/enums/UserRole";

import { FileInterceptor } from "@nestjs/platform-express";

import { CreateCustomizePushNotificationDto } from "./dtos/create-customize-push-notification.dto";
import { UpdateCustomizePushNotificationDto } from "./dtos/update-customize-push-noification.dto";
import { SendPushNotificationDto } from "./dtos/send-push-notification.dto";

import { PushNotification } from "./entities/push-notification";
import { PushNotificationImage } from "./entities/push-notification-image";
import { PushNotificationService } from "./push-notification.service";
import { PushNotificationImageService } from "./push-notification-image.service";

@UseGuards(AuthGuard, RolesGuard)
@Controller("v1/push-notifications")
export class PushNotificationController {
    constructor(
        @Inject(PushNotificationService) private readonly pushNotificationService: PushNotificationService,
        @Inject(PushNotificationImageService) private readonly pushNotificationImageService: PushNotificationImageService,
    ) { }

    @Roles(UserRole.Manager, UserRole.SuperAdmin, UserRole.Admin)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() body: CreateCustomizePushNotificationDto): Promise<PushNotification> {
        return this.pushNotificationService.create(body);
    }

    @Roles(UserRole.Manager, UserRole.SuperAdmin, UserRole.Admin)
    @Post("push")
    @HttpCode(HttpStatus.CREATED)
    async push(@Body() body: SendPushNotificationDto): Promise<void> {
        return this.pushNotificationService.push(body);
    }

    @Roles(UserRole.Manager, UserRole.SuperAdmin, UserRole.Admin)
    @Post(':uuid/images')
    @UseInterceptors(FileInterceptor("file", { dest: os.tmpdir(), }))
    @HttpCode(HttpStatus.CREATED)
    actionCreateProductReviewImage(
        @Param('uuid') pushNotificationUUID: string,
        @UploadedFile() file: Express.Multer.File
    ): Promise<PushNotificationImage> {
        return this.pushNotificationImageService.createPushNotificationImage(pushNotificationUUID, file);

    }

    @Roles(UserRole.Manager, UserRole.SuperAdmin, UserRole.Admin)
    @Get()
    @HttpCode(HttpStatus.OK)
    async getMyNotifications(): Promise<Array<PushNotification>> {
        return this.pushNotificationService.getAll();
    }

    @Roles(UserRole.Manager, UserRole.SuperAdmin, UserRole.Admin)
    @Get(':uuid')
    @HttpCode(HttpStatus.OK)
    actionGetProductReview(@Param('uuid') pushNotificationUUID: string): Promise<PushNotification> {
        return this.pushNotificationService.findOne(pushNotificationUUID);
    }

    @Roles(UserRole.Manager, UserRole.SuperAdmin, UserRole.Admin)
    @Put(':uuid')
    @HttpCode(HttpStatus.OK)
    actionUpdatePushNotification(@Param('uuid') pushNotificationUUID: string, @Body() body: UpdateCustomizePushNotificationDto): Promise<PushNotification> {
        return this.pushNotificationService.updatePushNotification(pushNotificationUUID, body);
    }

    @Roles(UserRole.Manager, UserRole.SuperAdmin, UserRole.Admin)
    @Put('stop/:uuid')
    @HttpCode(HttpStatus.OK)
    actionStopPushNotificationSchedule(@Param('uuid') pushNotificationUUID: string): Promise<void> {
        return this.pushNotificationService.stopPushNotificationSchedule(pushNotificationUUID);
    }

    @Roles(UserRole.Manager, UserRole.SuperAdmin, UserRole.Admin)
    @Delete(':uuid')
    @HttpCode(HttpStatus.OK)
    action(@Param('uuid') reviewUUID: string): Promise<void> {
        return this.pushNotificationService.delete(reviewUUID);
    }
}
