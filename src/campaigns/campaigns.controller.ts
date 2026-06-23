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

import { CreateCampaignDto } from './dtos/CreateCampaignDto';
import { UpdateCampaignDto } from './dtos/UpdateCampaignDto';

import { UserRole } from '../users/enums/UserRole';

import { Campaign } from './entities/campaign.entity';
import { CampaignsService } from './campaigns.service';

import { RolesGuard } from '../auth/roles.guard';
import { AuthGuard } from '../auth/auth.guard';

import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/campaigns')
export class CampaignsController {
	constructor(@Inject(CampaignsService) private readonly campaignsService: CampaignsService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateCampaign(@Body() body: CreateCampaignDto): Promise<Campaign> {
		return this.campaignsService.createCampaign(body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetCampaigns(
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<Campaign>> {
		return this.campaignsService.findAllUncached(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetCampaign(@Param('uuid') uuid: string): Promise<Campaign> {
		return this.campaignsService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateCampaign(@Param('uuid') uuid: string, @Body() body: UpdateCampaignDto): Promise<Campaign> {
		return this.campaignsService.updateCampaign(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteCampaign(@Param('uuid') uuid: string): Promise<void> {
		return this.campaignsService.delete(uuid);
	}
}
