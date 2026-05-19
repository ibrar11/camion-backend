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

import { CreateUserDto } from './dtos/CreateUserDto';
import { UpdateUserDto } from './dtos/UpdateUserDto';
import { UpdateEmailAddressDto } from './dtos/UpdateEmailAddressDto';
import { UpdatePasswordDto } from './dtos/UpdatePasswordDto';
import { UpdateUserStatusDto } from './dtos/UpdateUserStatusDto';
import { UpdateUserRoleDto } from './dtos/UpdateUserRoleDto';

import { UserRole } from './enums/UserRole';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/users')
export class UsersController {
	constructor(@Inject(UsersService) private readonly usersService: UsersService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateUser(@Body() body: CreateUserDto): Promise<User> {
		return this.usersService.createUser(body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User)
	@HttpCode(HttpStatus.OK)
	@Get()
	actionFindAll(
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<User>> {
		return this.usersService.findAll(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	async actionFindOne(@Param('uuid') uuid: string): Promise<User> {
		return this.usersService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateOne(@Param('uuid') uuid: string, @Body() body: UpdateUserDto): Promise<User> {
		return this.usersService.updateUser(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(':uuid/email-address')
	@HttpCode(HttpStatus.OK)
	actionUpdateEmailAddress(@Param('uuid') uuid: string, @Body() body: UpdateEmailAddressDto): Promise<User> {
		return this.usersService.updateEmailAddress(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(':uuid/password')
	@HttpCode(HttpStatus.OK)
	actionUpdatePassword(@Param('uuid') uuid: string, @Body() body: UpdatePasswordDto): Promise<User> {
		return this.usersService.updatePassword(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(':uuid/role')
	@HttpCode(HttpStatus.OK)
	actionUpdateRole(@Param('uuid') uuid: string, @Body() body: UpdateUserRoleDto): Promise<User> {
		return this.usersService.updateUserRole(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(':uuid/status')
	@HttpCode(HttpStatus.OK)
	actionUpdateStatus(@Param('uuid') uuid: string, @Body() body: UpdateUserStatusDto): Promise<User> {
		return this.usersService.updateUserStatus(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteOne(@Param('uuid') uuid: string): Promise<void> {
		return this.usersService.delete(uuid);
	}
}
