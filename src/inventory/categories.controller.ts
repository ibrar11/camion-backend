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

import { CreateCategoryDto } from "./dtos/CreateCategoryDto";
import { UpdateCategoryDto } from "./dtos/UpdateCategoryDto";

import { UserRole } from "../users/enums/UserRole";

import { Category } from "./entities/category.entity";
import { CategoriesService } from "./categories.service";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller("v1/categories")
export class CategoriesController {
	constructor(@Inject(CategoriesService) private readonly productCategoryService: CategoriesService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateProductCategory(@Body() body: CreateCategoryDto): Promise<Category> {
		return this.productCategoryService.createProductCategory(body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid/thumbnail')
	@UseInterceptors(FileInterceptor("file"))
	@HttpCode(HttpStatus.CREATED)
	actionUploadThumbnail(@Param('uuid') uuid: string, @UploadedFile() file: Express.Multer.File): Promise<Category> {
		return this.productCategoryService.updateThumbnail(uuid, file);
	}

	@Roles()
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetProductCategories(
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<Category>> {
		return this.productCategoryService.findAll(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles()
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetProductCategory(@Param('uuid') uuid: string): Promise<Category> {
		return this.productCategoryService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateProductCategory(@Param('uuid') uuid: string, @Body() body: UpdateCategoryDto): Promise<Category> {
		return this.productCategoryService.updateProductCategory(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteProductCategory(@Param('uuid') uuid: string): Promise<void> {
		return this.productCategoryService.delete(uuid);
	}
}
