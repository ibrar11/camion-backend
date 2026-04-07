import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
} from '@nestjs/common';

import { HealthService } from './health.service';

import type { Health } from './types';

@Controller('health')
export class HealthController {
	constructor(@Inject(HealthService) private readonly healthService: HealthService) { }

	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetHealth(): Health {
		return this.healthService.getHealth();
	}
}
