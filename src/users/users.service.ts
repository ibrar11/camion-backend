import * as crypto from "node:crypto";

import * as bcrypt from "bcrypt";

import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dtos/CreateUserDto';
import { UpdateUserDto } from './dtos/UpdateUserDto';
import { UpdateEmailAddressDto } from './dtos/UpdateEmailAddressDto';
import { UpdatePasswordDto } from './dtos/UpdatePasswordDto';
import { UpdateUserStatusDto } from "./dtos/UpdateUserStatusDto";
import { UpdateUserRoleDto } from "./dtos/UpdateUserRoleDto";

import { User } from './entities/user.entity';
import { UserRole } from './enums/UserRole';

@Injectable()
export class UsersService {
	private readonly logger = new Logger(UsersService.name);

	constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) { }

	/**
	 * Creates a user
	 *
	 * @param body
	 * @returns
	 */
	async createUser(body: CreateUserDto): Promise<User> {
		this.logger.log(`Attempting to create user: ${body.emailAddress}`);

		// Check if the user exists by email address
		const userByEmailAddress = await this.userRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		// Make sure we don't create another user using the same email address
		if (userByEmailAddress !== null) {
			throw new BadRequestException({
				errors: {
					emailAddress: "Email address already exists. Please use a different email address.",
				},
			});
		}

		// Create the role of the user
		let role = UserRole.User;
		switch (body.role) {
			case "super-admin":
				role = UserRole.SuperAdmin;
				break;
			case "admin":
				role = UserRole.Admin;
				break;
			case "manager":
				role = UserRole.Manager;
				break;
			case "user":
				role = UserRole.User;
				break;
			default: // do nothing
				break;
		}

		const user = new User();
		user.uuid = crypto.randomUUID();
		user.fullName = body.fullName.trim();
		user.emailAddress = body.emailAddress.trim().toLowerCase();
		user.password = await bcrypt.hash(body.password.trim(), 10);
		user.role = role;
		return this.userRepository.save(user);
	}

	/**
	 * Finds a list of users
	 *
	 * @returns
	 */
	findAll(): Promise<User[]> {
		this.logger.log(`Retrieving users`);
		return this.userRepository.find();
	}

	/**
	 * Finds a user
	 *
	 * @param id
	 * @returns
	 */
	async findOne(uuid: string): Promise<User> {
		this.logger.log(`Retrieving user: ${uuid}`);
		const user = await this.userRepository.findOneBy({ uuid: uuid, });
		if (user === null) {
			throw new NotFoundException({
				error: "Failed to find the user. Please check and try again.",
			});
		}
		return user;
	}

	/**
	 * Updates a user
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateUser(uuid: string, body: UpdateUserDto): Promise<User> {
		this.logger.log(`Updating user: ${uuid}`);

		// Find the user
		const user = await this.userRepository.findOneBy({ uuid: uuid, });
		if (user === null) {
			throw new BadRequestException({
				error: "Failed to find the user by the provided uuid. Please check and try again.",
			});
		}

		user.fullName = body.fullName.trim();
		return this.userRepository.save(user);
	}

	/**
	 * Updates the user's email address
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateEmailAddress(uuid: string, body: UpdateEmailAddressDto): Promise<User> {
		this.logger.log(`Updating email address of the user: ${uuid}`);

		// Check if another user exists by the same email address
		const userByEmailAddress = await this.userRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		// Make sure we don't create another user using the same email address
		if (userByEmailAddress !== null && userByEmailAddress.uuid !== uuid) {
			throw new BadRequestException({
				errors: {
					emailAddress: "Email address already exists. Please use a different email address.",
				},
			});
		}

		// Find the user
		const user = await this.userRepository.findOneBy({ uuid: uuid, });
		if (user === null) {
			throw new BadRequestException({
				error: "Failed to find the user by the provided id. Please check and try again.",
			});
		}

		user.emailAddress = body.emailAddress.trim().toLowerCase();
		return this.userRepository.save(user);
	}

	/**
	 * Updates the user's password
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updatePassword(uuid: string, body: UpdatePasswordDto): Promise<User> {
		this.logger.log(`Updating password of the user: ${uuid}`);

		// Find the user
		const user = await this.userRepository.findOneBy({ uuid: uuid, });
		if (user === null) {
			throw new BadRequestException({
				error: "Failed to find the user by the provided id. Please check and try again.",
			});
		}

		user.password = await bcrypt.hash(body.password.trim(), 10);
		return this.userRepository.save(user);
	}

	/**
	 * Updates the role of the user
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateUserRole(uuid: string, body: UpdateUserRoleDto): Promise<User> {
		this.logger.log(`Updating role of the user: ${uuid}`);

		// Find the user
		const user = await this.userRepository.findOneBy({ uuid: uuid, });
		if (user === null) {
			throw new BadRequestException({
				error: "Failed to find the user by the provided id. Please check and try again.",
			});
		}

		user.role = body.role;
		return this.userRepository.save(user);
	}

	/**
	 * Updates the status of the user
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateUserStatus(uuid: string, body: UpdateUserStatusDto): Promise<User> {
		this.logger.log(`Updating status of the user: ${uuid}`);

		// Find the user
		const user = await this.userRepository.findOneBy({ uuid: uuid, });
		if (user === null) {
			throw new BadRequestException({
				error: "Failed to find the user by the provided id. Please check and try again.",
			});
		}

		user.isActive = body.isActive;
		return this.userRepository.save(user);
	}

	/**
	 * Deletes a user
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		this.logger.log(`Deleting user: ${uuid}`);

		await this.userRepository.delete({
			uuid: uuid,
		});
	}
}
