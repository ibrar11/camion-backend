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
	UseGuards,
} from "@nestjs/common";

import { CreateProductOptionValueDto } from "./dtos/CreateProductOptionValueDto";
import { UpdateProductOptionValueDto } from "./dtos/UpdateProductOptionValueDto";

import { ProductOptionValue } from "./entities/product-option-value.entity";
import { ProductOptionValueService } from "./product-option-value.service";

import { UserRole } from "../users/enums/UserRole";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/products/:productUUID/options/:productOptionUUID/values')
export class ProductOptionValueController {
	constructor(@Inject(ProductOptionValueService) private readonly productOptionValueService: ProductOptionValueService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateProductOptionValue(@Param('productOptionUUID') productOptionUUID: string, @Body() body: CreateProductOptionValueDto): Promise<ProductOptionValue> {
		return this.productOptionValueService.createProductOptionValue(productOptionUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetProductOptionValues(
		@Param('productOptionUUID') productOptionUUID: string,
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<ProductOptionValue>> {
		return this.productOptionValueService.findAll(productOptionUUID, filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetProductOptionValue(@Param('uuid') valueUUID: string): Promise<ProductOptionValue> {
		return this.productOptionValueService.findOne(valueUUID);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateProductOptionValue(@Param('uuid') valueUUID: string, @Body() body: UpdateProductOptionValueDto): Promise<ProductOptionValue> {
		return this.productOptionValueService.updateProductOptionValue(valueUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteProductOptionValue(@Param('uuid') valueUUID: string): Promise<void> {
		return this.productOptionValueService.delete(valueUUID);
	}
}
