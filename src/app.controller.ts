import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { UserRole } from './users/enums/UserRole';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) { }

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(UserRole.SuperAdmin)
	@Get('env')
	getEnv(): Record<string, string> {
		return process.env as Record<string, string>;
	}
}
