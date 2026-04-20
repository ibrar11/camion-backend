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
} from '@nestjs/common';

import { CreateProductDto } from './dtos/CreateProductDto';
import { UpdateProductDto } from './dtos/UpdateProductDto';
import { UpdateProductSlugDto } from './dtos/UpdateProductSlugDto';
import { UpdateProductStatusDto } from './dtos/UpdateProductStatusDto';

import { UserRole } from '../users/enums/UserRole';
import { CustomerRole } from '../customers/enums/CustomerRole';
import { ProductSort } from './enums/ProductSort.enum';

import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/products')
export class ProductsController {
	constructor(@Inject(ProductsService) private readonly productsService: ProductsService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateProduct(@Body() body: CreateProductDto): Promise<Product> {
		return this.productsService.createProduct(body);
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
		return this.productsService.findAll(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User, CustomerRole.Guest, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
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

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
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

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteProduct(@Param('uuid') uuid: string): Promise<void> {
		return this.productsService.delete(uuid);
	}
}
