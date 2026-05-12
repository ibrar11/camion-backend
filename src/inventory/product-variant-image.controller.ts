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
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";

import { UpdateProductVariantImageDto } from "./dtos/UpdateProductVariantImageDto";

import { ProductVariantImage } from "./entities/product-variant-image.entity";
import { ProductVariantImageService } from "./product-variant-image.service";

import { UserRole } from "../users/enums/UserRole";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";
import { ClientRole } from "../clients/enums/client-role.enum";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/products/:productUUID/variants/:variantUUID/images')
export class ProductVariantImageController {
	constructor(@Inject(ProductVariantImageService) private readonly productVariantImageService: ProductVariantImageService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post()
	@UseInterceptors(FileInterceptor("file", { dest: os.tmpdir(), }))
	@HttpCode(HttpStatus.CREATED)
	actionCreateProductVariantImage(@Param('variantUUID') variantUUID: string, @UploadedFile() file: Express.Multer.File): Promise<ProductVariantImage> {
		return this.productVariantImageService.createProductVariantImage(variantUUID, file);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
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

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetProductVariantImage(@Param('uuid') imageUUID: string): Promise<ProductVariantImage> {
		return this.productVariantImageService.findOne(imageUUID);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateProductVariantImage(@Param('uuid') imageUUID: string, @Body() body: UpdateProductVariantImageDto): Promise<ProductVariantImage> {
		return this.productVariantImageService.updateProductVariantImage(imageUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, ClientRole.ImageUploader)
	@Post(':uuid')
	@UseInterceptors(FileInterceptor("file", { dest: os.tmpdir(), }))
	@HttpCode(HttpStatus.OK)
	actionPatchProductVariantImage(@Param('uuid') imageUUID: string, @UploadedFile() file: Express.Multer.File): Promise<ProductVariantImage> {
		return this.productVariantImageService.replaceProductVariantImage(imageUUID, file);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteProductVariantImage(@Param('uuid') imageUUID: string): Promise<void> {
		return this.productVariantImageService.delete(imageUUID);
	}
}
