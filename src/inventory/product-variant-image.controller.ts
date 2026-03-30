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

import { UpdateProductVariantImageDto } from "./dtos/UpdateProductVariantImageDto";

import { ProductVariantImage } from "./entities/product-variant-image.entity";
import { ProductVariantImageService } from "./product-variant-image.service";

import { UserRole } from "src/users/enums/UserRole";

import { AuthGuard } from "src/auth/auth.guard";
import { RolesGuard } from "src/auth/roles.guard";

import { Roles } from "src/auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/products/:productUUID/variants/:variantUUID/images')
export class ProductVariantImageController {
	constructor(@Inject(ProductVariantImageService) private readonly productVariantImageService: ProductVariantImageService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateProductVariantImage(@Param('variantUUID') variantUUID: string) {
		return this.productVariantImageService.createProductVariantImage(variantUUID);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetProductVariantImages(
		@Param('variantUUID') variantUUID: string,
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<ProductVariantImage>> {
		return this.productVariantImageService.findAll(variantUUID, filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetProductVariantImage(@Param('uuid') imageUUID: string): Promise<ProductVariantImage> {
		return this.productVariantImageService.findOne(imageUUID);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateProductVariantImage(@Param('uuid') imageUUID: string, @Body() body: UpdateProductVariantImageDto): Promise<ProductVariantImage> {
		return this.productVariantImageService.updateProductVariantImage(imageUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteProductVariantImage(@Param('uuid') imageUUID: string): Promise<void> {
		return this.productVariantImageService.delete(imageUUID);
	}
}
