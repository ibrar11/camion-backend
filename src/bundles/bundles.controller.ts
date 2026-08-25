import * as os from 'node:os';

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

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/enums/UserRole';

import { Bundle } from './entities/bundle.entity';
import { BundlesService } from './bundles.service';
import { CreateBundleDto } from './dtos/CreateBundleDto';
import { UpdateBundleDto } from './dtos/UpdateBundleDto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/bundles')
export class BundlesController {
  constructor(
    @Inject(BundlesService) private readonly bundlesService: BundlesService,
  ) {}

  @Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  actionCreateBundle(@Body() body: CreateBundleDto): Promise<Bundle> {
    return this.bundlesService.createBundle(body);
  }

  @Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User)
  @Get()
  @HttpCode(HttpStatus.OK)
  actionGetBundles(
    @Query('filters') filters: string,
    @Query('sort') sort: string,
    @Query('pageNumber') pageNumber: number,
    @Query('itemsPerPage') itemsPerPage: number,
  ): Promise<Array<Bundle>> {
    return this.bundlesService.findAll(filters, sort, pageNumber, itemsPerPage);
  }

  @Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User)
  @Get('product/:productUUID')
  @HttpCode(HttpStatus.OK)
  actionGetBundlesForProduct(
    @Param('productUUID') productUUID: string,
    @Query('currency') currency: string,
    @Query('countryCode') countryCode?: string,
  ): Promise<Array<Bundle>> {
    return this.bundlesService.findBundlesForProduct(
      productUUID,
      currency,
      countryCode,
    );
  }

  @Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User)
  @Get(':uuid')
  @HttpCode(HttpStatus.OK)
  actionGetBundle(@Param('uuid') uuid: string): Promise<Bundle> {
    return this.bundlesService.findOne(uuid);
  }

  @Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
  @Put(':uuid')
  @HttpCode(HttpStatus.OK)
  actionUpdateBundle(
    @Param('uuid') uuid: string,
    @Body() body: UpdateBundleDto,
  ): Promise<Bundle> {
    return this.bundlesService.updateBundle(uuid, body);
  }

  @Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
  @Delete(':uuid')
  @HttpCode(HttpStatus.OK)
  actionDeleteBundle(@Param('uuid') uuid: string): Promise<void> {
    return this.bundlesService.delete(uuid);
  }

  @Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
  @Put(':uuid/image')
  @UseInterceptors(FileInterceptor('file', { dest: os.tmpdir() }))
  @HttpCode(HttpStatus.OK)
  actionUploadImage(
    @Param('uuid') uuid: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Bundle> {
    return this.bundlesService.updateImage(uuid, file);
  }
}
