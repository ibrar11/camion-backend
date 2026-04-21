import { Body, Controller, Post } from "@nestjs/common";
import { NewsletterService } from "./newsletter.service";
import { SubscribeNewsletterDto } from "./dtos/subscribe-newsletter.dto";

@Controller("v1/newsletter")
export class NewsletterController {
	constructor(private readonly newsletterService: NewsletterService) {}

	@Post("subscribe")
	async subscribe(@Body() body: SubscribeNewsletterDto) {
		await this.newsletterService.subscribe(body.emailAddress);

		return {
			success: true,
		};
	}
}
