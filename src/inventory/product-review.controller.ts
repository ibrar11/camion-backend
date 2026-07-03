import * as os from "node:os";

import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Post,
	Put,
	Query,
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";

import { CreateReviewDto } from "./dtos/CreateReviewDto";
import { UpdateReviewDto } from "./dtos/UpdateReviewDto";
import { CreateGenuineReviewDto } from "./dtos/CreateGenuineReviewDto";

import { ProductReview } from "./entities/product-review.entity";
import { ProductReviewService } from "./product-review.service";

import { Customer } from "../customers/entities/customer.entity";

import { ProductReviewImage } from "./entities/product-review-image.entity";
import { ProductReviewImageService } from "./product-review-image.service";

import { CustomerRole } from "../customers/enums/CustomerRole";
import { UserRole } from "../users/enums/UserRole";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/products/:productUUID/reviews')
export class ProductReviewController {
	constructor(
		@Inject(ProductReviewService) private readonly reviewService: ProductReviewService,
		@Inject(ProductReviewImageService) private readonly productReviewImageService: ProductReviewImageService,
	) { }

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateProductReview(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('productUUID') productUUID: string,
		@Body() body: CreateReviewDto,
	): Promise<ProductReview> {
		return this.reviewService.createProductReview(req.customer, productUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post('/genuine')
	@HttpCode(HttpStatus.CREATED)
	actionCreateGenuineProductReview(
		@Param('productUUID') productUUID: string,
		@Body() body: CreateGenuineReviewDto,
	): Promise<ProductReview> {
		return this.reviewService.createGenuineProductReview(productUUID, body);
	}

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Post(':uuid/images')
	@UseInterceptors(FileInterceptor("file", { dest: os.tmpdir(), }))
	@HttpCode(HttpStatus.CREATED)
	actionCreateProductReviewImage(
		@Param('uuid') reviewUUID: string,
		@UploadedFile() file: Express.Multer.File
	): Promise<ProductReviewImage> {
		return this.productReviewImageService.createProductReviewImage(reviewUUID, file);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetProductReviews(
		@Param('productUUID') productUUID: string,
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<ProductReview>> {
		return this.reviewService.findAll(productUUID, filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetProductReview(@Param('uuid') reviewUUID: string): Promise<ProductReview> {
		return this.reviewService.findOne(reviewUUID);
	}

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateProductVariant(@Param('uuid') reviewUUID: string, @Body() body: UpdateReviewDto): Promise<ProductReview> {
		return this.reviewService.updateProductReview(reviewUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	action(@Param('uuid') reviewUUID: string): Promise<void> {
		return this.reviewService.delete(reviewUUID);
	}
}
