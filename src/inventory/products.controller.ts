import os from "node:os";

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
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { CreateProductDto } from './dtos/CreateProductDto';
import { UpdateProductDto } from './dtos/UpdateProductDto';
import { UpdateProductSlugDto } from './dtos/UpdateProductSlugDto';
import { UpdateProductStatusDto } from './dtos/UpdateProductStatusDto';
import { UpdateProductFeaturedImageDto } from './dtos/UpdateProductFeaturedImageDto';
import { ResyncProductCategoriesDto } from './dtos/ResyncProductCategoriesDto';

import { UserRole } from '../users/enums/UserRole';
import { CustomerRole } from '../customers/enums/CustomerRole';
import { ClientRole } from '../clients/enums/client-role.enum';
import { ProductSort } from './enums/ProductSort.enum';
import { ProductStatus } from './enums/ProductStatus.enum';

import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

import { ProductAttachment } from "./entities/product-attachment.entity";

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/products')
export class ProductsController {
	constructor(@Inject(ProductsService) private readonly productsService: ProductsService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateProduct(@Body() body: CreateProductDto): Promise<Product> {
		return this.productsService.createProduct(body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post("resync-categories")
	@HttpCode(HttpStatus.OK)
	actionResyncProductCategories(@Body() body: ResyncProductCategoriesDto): Promise<{
		jobId: string;
		status: "queued";
		scope: "all" | "selected";
		productsCount: number;
	}> {
		return this.productsService.enqueueProductCategoriesResync(body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get("resync-categories/job/:jobId")
	@HttpCode(HttpStatus.OK)
	actionGetResyncProductCategoriesJob(@Param("jobId") jobId: string): Promise<{
		jobId: string;
		status: "queued" | "active" | "completed" | "failed" | "not_found";
		progress?: string | number | boolean | object;
		result?: any;
		failedReason?: string | null;
	}> {
		return this.productsService.getProductCategoriesResyncJob(jobId);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User, CustomerRole.Guest, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetProducts(
		@Query("filters") filters: string,
		@Query("sort") sort: ProductSort,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<Product>> {
		return this.productsService.findAllUncached(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get("variants/missing-skumeta")
	@HttpCode(HttpStatus.OK)
	actionGetProductsWithVariantsMissingSkuMeta(
		@Query("status") status?: ProductStatus,
	): Promise<{
		totalMissingSkuVariants: number;
		totalProducts: number;
		data: Array<{
			uuid: string;
			name: string;
			procurementId: string | null;
			totalVariants: number;
			missingSkuVariants: number;
		}>;
	}> {
		return this.productsService.findProductsWithVariantsMissingSkuMeta(status);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User, CustomerRole.Guest, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer, ClientRole.ImageUploader)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetProduct(@Param('uuid') uuid: string): Promise<Product> {
		return this.productsService.findOneByUUID(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateProduct(@Param('uuid') uuid: string, @Body() body: UpdateProductDto): Promise<Product> {
		return this.productsService.updateProduct(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid/slug')
	@HttpCode(HttpStatus.OK)
	actionUpdateProductSlug(@Param('uuid') uuid: string, @Body() body: UpdateProductSlugDto): Promise<Product> {
		return this.productsService.updateProductSlug(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid/status')
	@HttpCode(HttpStatus.OK)
	actionUpdateProductStatus(@Param('uuid') uuid: string, @Body() body: UpdateProductStatusDto): Promise<Product> {
		return this.productsService.updateProductStatus(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid/featured-image')
	@HttpCode(HttpStatus.OK)
	actionUpdateProductFeaturedImage(@Param('uuid') uuid: string, @Body() body: UpdateProductFeaturedImageDto): Promise<Product> {
		return this.productsService.updateProductFeaturedImage(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid/sizechart')
	@UseInterceptors(FileInterceptor("file", { dest: os.tmpdir(), }))
	@HttpCode(HttpStatus.OK)
	actionUpdateSizechartImage(
		@Param('uuid') uuid: string,
		@UploadedFile() file: Express.Multer.File,
	): Promise<Product> {
		return this.productsService.updateProductSizechart(uuid, file);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Delete(':uuid/sizechart')
	@HttpCode(HttpStatus.OK)
	actionDeleteSizechartImage(
		@Param('uuid') uuid: string
	): Promise<void> {
		return this.productsService.deleteProductSizechart(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post(':uuid/attachments')
	@UseInterceptors(FileInterceptor("file", { dest: os.tmpdir(), }))
	@HttpCode(HttpStatus.OK)
	actionCreateAttachment(
		@Param('uuid') uuid: string,
		@UploadedFile() file: Express.Multer.File,
	): Promise<ProductAttachment> {
		return this.productsService.createProductAttachment(uuid, file);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get(':uuid/attachments')
	@HttpCode(HttpStatus.OK)
	actionGetProductAttachments(@Param('uuid') uuid: string): Promise<Array<ProductAttachment>> {
		return this.productsService.getProductAttachments(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Delete(':uuid/attachments/:attachment_uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteAttachment(@Param('attachment_uuid') uuid: string): Promise<void> {
		return this.productsService.deleteProductAttachment(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteProduct(@Param('uuid') uuid: string): Promise<void> {
		return this.productsService.delete(uuid);
	}
}
