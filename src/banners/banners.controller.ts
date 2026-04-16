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

import { UpdateBannerDto } from './dtos/UpdateBannerDto';

import { UserRole } from 'src/users/enums/UserRole';

import { Banner } from './entities/banner.entity';
import { BannersService } from './banners.service';

import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

import { Roles } from 'src/auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/banners')
export class BannersController {
	constructor(@Inject(BannersService) private readonly bannersService: BannersService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post()
	@UseInterceptors(FileInterceptor("file"))
	@HttpCode(HttpStatus.CREATED)
	actionCreateBanner(@UploadedFile() file: Express.Multer.File): Promise<Banner> {
		return this.bannersService.createBanner(file);
	}

	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetBanners(
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<Banner>> {
		return this.bannersService.findAll(filters, sort, pageNumber, itemsPerPage);
	}

	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetBanner(@Param('uuid') uuid: string): Promise<Banner> {
		return this.bannersService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateBanner(@Param('uuid') uuid: string, @Body() body: UpdateBannerDto): Promise<Banner> {
		return this.bannersService.updateBanner(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteBanner(@Param('uuid') uuid: string): Promise<void> {
		return this.bannersService.delete(uuid);
	}
}
