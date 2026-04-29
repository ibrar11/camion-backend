import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) { }

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	@Get('env')
	getEnv(): Record<string, string> {
		return process.env as Record<string, string>;
	}
}
