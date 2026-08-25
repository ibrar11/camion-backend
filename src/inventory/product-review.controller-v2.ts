import os from "node:os";

import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Post,
	Req,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";

import { FileFieldsInterceptor } from "@nestjs/platform-express";

import { CreateReviewDto } from "./dtos/CreateReviewDto";

import { Customer } from "../customers/entities/customer.entity";

import { ProductReview } from "./entities/product-review.entity";
import { ProductReviewService } from "./product-review.service";

import { CustomerRole } from "../customers/enums/CustomerRole";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v2/products/:productUUID/reviews')
export class ProductReviewControllerV2 {
	constructor(
		@Inject(ProductReviewService) private readonly reviewService: ProductReviewService,
	) { }

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Post()
	@UseInterceptors(FileFieldsInterceptor([
		{ name: "images", maxCount: 5 },
	], {
		dest: os.tmpdir(),
	}))
	@HttpCode(HttpStatus.CREATED)
	actionCreateProductReview(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('productUUID') productUUID: string,
		@Body() body: CreateReviewDto,
		@UploadedFiles() files: {
			images: Express.Multer.File[],
		}
	): Promise<ProductReview> {
		return this.reviewService.createProductReviewV2(req.customer, productUUID, body, files?.images);
	}
}
