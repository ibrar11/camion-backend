import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
} from '@nestjs/common';

import { DataService } from './data.service';

import { UserRole } from '../users/enums/UserRole';

import { Roles } from '../auth/roles.decorator';

@Controller('v1/data')
export class DataController {
	constructor(@Inject(DataService) private readonly dataService: DataService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get('counts')
	@HttpCode(HttpStatus.OK)
	getCounts(): Promise<{
		banners: number,
		categories: number,
		orders: number,
		products: number,
		stories: number,
	}> {
		return this.dataService.getCounts();
	}
}
