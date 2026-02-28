import { Controller, Get, Inject, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
	constructor(@Inject(UsersService) private readonly usersService: UsersService) { }

	@Post()
	actionCreate(): Promise<User> {
		return this.usersService.createUser();
	}

	@Get()
	actionIndex(): Promise<Array<User>> {
		return this.usersService.findAll();
	}
}
