import {
    Body,
    Controller,
    Headers,
    HttpCode,
    HttpStatus,
    Post,
} from "@nestjs/common";

import { SkipcashWebhookDto } from "./dtos/SkipcashWebhookDto";

import { PaymentsWebhookService } from "./payments-webhook.service";

import { skipcashWebhookResponse } from "./types";

@Controller("v1/payments/webhooks")
export class PaymentsWebhookController {
    constructor(private readonly webhookService: PaymentsWebhookService) { }

    @Post("skipcash")
    @HttpCode(HttpStatus.OK)
    async handleSkipcash(
        @Body() payload: SkipcashWebhookDto,
        @Headers("authorization") signature: string,
    ): Promise<skipcashWebhookResponse> {
        return this.webhookService.handleSkipcashWebhook(
            payload,
            signature,
        );
    }
}