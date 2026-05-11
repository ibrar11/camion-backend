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

import { CreateProductOptionDto } from "./dtos/CreateProductOptionDto";
import { UpdateProductOptionDto } from "./dtos/UpdateProductOptionDto";

import { ProductOption } from "./entities/product-option.entity";
import { ProductOptionService } from "./product-option.service";

import { UserRole } from "../users/enums/UserRole";

import { RolesGuard } from "../auth/roles.guard";
import { AuthGuard } from "../auth/auth.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/products/:productUUID/options')
export class ProductOptionController {
	constructor(@Inject(ProductOptionService) private readonly optionsService: ProductOptionService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateProductOption(@Param('productUUID') productUUID: string, @Body() body: CreateProductOptionDto): Promise<ProductOption> {
		return this.optionsService.createProductOption(productUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetProductOptions(
		@Param('productUUID') productUUID: string,
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<ProductOption>> {
		return this.optionsService.findAll(productUUID, filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetProductOption(@Param('uuid') optionUUID: string): Promise<ProductOption> {
		return this.optionsService.findOne(optionUUID);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateProductOption(@Param('uuid') optionUUID: string, @Body() body: UpdateProductOptionDto): Promise<ProductOption> {
		return this.optionsService.updateProductOption(optionUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteProductOption(@Param('uuid') optionUUID: string): Promise<void> {
		return this.optionsService.delete(optionUUID);
	}
}
