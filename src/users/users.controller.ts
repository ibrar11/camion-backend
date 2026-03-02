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
	UseGuards,
} from '@nestjs/common';

import { CreateUserDto } from './dtos/CreateUserDto';
import { UpdateUserDto } from './dtos/UpdateUserDto';
import { UpdateEmailAddressDto } from './dtos/UpdateEmailAddressDto';
import { UpdatePasswordDto } from './dtos/UpdatePasswordDto';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('users')
export class UsersController {
	constructor(@Inject(UsersService) private readonly usersService: UsersService) { }

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.CREATED)
	@Post()
	actionCreateUser(@Body() body: CreateUserDto): Promise<User> {
		return this.usersService.createUser(body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Get()
	actionFindAll(): Promise<Array<User>> {
		return this.usersService.findAll();
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Get(':uuid')
	async actionFindOne(@Param('uuid') uuid: string): Promise<{ status: "fail" | "success", data: User, }> {
		return {
			status: "success",
			data: await this.usersService.findOne(uuid),
		};
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put(':uuid')
	actionUpdateOne(@Param('uuid') uuid: string, @Body() body: UpdateUserDto): Promise<User> {
		return this.usersService.updateUser(uuid, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put(':uuid/email-address')
	actionUpdateEmailAddress(@Param('uuid') uuid: string, @Body() body: UpdateEmailAddressDto): Promise<User> {
		return this.usersService.updateEmailAddress(uuid, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put(':uuid/password')
	actionUpdatePassword(@Param('uuid') uuid: string, @Body() body: UpdatePasswordDto): Promise<User> {
		return this.usersService.updatePassword(uuid, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Delete(':uuid')
	actionDeleteOne(@Param('uuid') uuid: string): Promise<void> {
		return this.usersService.delete(uuid);
	}
}
