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
	UseGuards,
} from "@nestjs/common";

import { CreateReviewDto } from "./dtos/CreateReviewDto";
import { UpdateReviewDto } from "./dtos/UpdateReviewDto";

import { ProductReview } from "./entities/product-review.entity";
import { ProductReviewService } from "./product-review.service";

import { Customer } from "src/customers/entities/customer.entity";

import { CustomerRole } from "src/customers/enums/CustomerRole";

import { AuthGuard } from "src/auth/auth.guard";
import { RolesGuard } from "src/auth/roles.guard";

import { Roles } from "src/auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/products/:productUUID/reviews')
export class ProductReviewController {
	constructor(@Inject(ProductReviewService) private readonly reviewService: ProductReviewService) { }

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

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
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

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
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

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	action(@Param('uuid') reviewUUID: string): Promise<void> {
		return this.reviewService.delete(reviewUUID);
	}
}
