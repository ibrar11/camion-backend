import {
    Body,
    Controller,
    Headers,
    Post,
} from "@nestjs/common";

import { SkipcashWebhookDto } from "./dtos/SkipcashWebhookDto";

import { PaymentsWebhookService } from "./payments-webhook.service";

import { skipcashWebhookResponse } from "./types";

@Controller("v1/payments/webhooks")
export class PaymentsWebhookController {
    constructor(private readonly webhookService: PaymentsWebhookService) { }

    @Post("skipcash")
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