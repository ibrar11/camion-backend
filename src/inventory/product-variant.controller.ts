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

import { CreateProductVariantDto } from "./dtos/CreateProductVariantDto";
import { UpdateProductVariantDto } from "./dtos/UpdateProductVariantDto";

import { ProductVariant } from "./entities/product-variant.entity";
import { ProductVariantService } from "./product-variant.service";

import { UserRole } from "../users/enums/UserRole";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/products/:productUUID/variants')
export class ProductVariantController {
	constructor(@Inject(ProductVariantService) private readonly variantService: ProductVariantService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateProductVariant(@Param('productUUID') productUUID: string, @Body() body: CreateProductVariantDto): Promise<ProductVariant> {
		return this.variantService.createProductVariant(productUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetProductVariants(
		@Param('productUUID') productUUID: string,
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<ProductVariant>> {
		return this.variantService.findAll(productUUID, filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetProductVariant(@Param('uuid') variantUUID: string): Promise<ProductVariant> {
		return this.variantService.findOne(variantUUID);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateProductVariant(@Param('uuid') variantUUID: string, @Body() body: UpdateProductVariantDto): Promise<ProductVariant> {
		return this.variantService.updateProductVariant(variantUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteProductVariant(@Param('uuid') variantUUID: string): Promise<void> {
		return this.variantService.delete(variantUUID);
	}
}
