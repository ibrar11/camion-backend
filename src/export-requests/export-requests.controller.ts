import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Patch,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';

import { CreateExportRequestDto } from './dtos/CreateExportRequestDto';
import { UpdateExportRequestDto } from './dtos/UpdateExportRequestDto';
import { PatchExportRequestDto } from './dtos/PatchExportRequestDto';

import { UserRole } from '../users/enums/UserRole';

import { ExportRequest } from './entities/export-request.entity';
import { ExportRequestsService } from './export-requests.service';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/export-requests')
export class ExportRequestsController {
	constructor(@Inject(ExportRequestsService) private readonly exportRequestsService: ExportRequestsService) { }

	@Roles(UserRole.SuperAdmin)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateExportRequest(@Body() body: CreateExportRequestDto): Promise<ExportRequest> {
		return this.exportRequestsService.createExportRequest(body);
	}

	@Roles(UserRole.SuperAdmin)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetExportRequests(
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<ExportRequest>> {
		return this.exportRequestsService.findAll(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetExportRequest(@Param('uuid') uuid: string): Promise<ExportRequest> {
		return this.exportRequestsService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateExportRequest(@Param('uuid') uuid: string, @Body() body: UpdateExportRequestDto): Promise<ExportRequest> {
		return this.exportRequestsService.updateExportRequest(uuid, body);
	}

	@Roles(UserRole.SuperAdmin)
	@Patch(':uuid/status')
	@HttpCode(HttpStatus.OK)
	actionPatchExportRequestStatus(@Param('uuid') uuid: string, @Body() body: PatchExportRequestDto): Promise<ExportRequest> {
		return this.exportRequestsService.updateExportRequestStatus(uuid, body);
	}

	@Roles(UserRole.SuperAdmin)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteExportRequest(@Param('uuid') uuid: string): Promise<void> {
		return this.exportRequestsService.delete(uuid);
	}
}
