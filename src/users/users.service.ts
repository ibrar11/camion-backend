import * as crypto from "node:crypto";

import * as bcrypt from "bcrypt";

import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dtos/CreateUserDto';
import { UpdateUserDto } from './dtos/UpdateUserDto';
import { UpdateEmailAddressDto } from './dtos/UpdateEmailAddressDto';
import { UpdatePasswordDto } from './dtos/UpdatePasswordDto';

import { User } from './entities/user.entity';
import { UserRole } from './enums/UserRole';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
	) {
	}

	/**
	 * Creates a user
	 *
	 * @param body
	 * @returns
	 */
	async createUser(body: CreateUserDto): Promise<User> {
		// Check if the user exists by email address
		const userByEmailAddress = await this.userRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		// Make sure we don't create another user using the same email address
		if (userByEmailAddress !== null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "Email address already exists. Please use a different email address.",
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
		return this.userRepository.find();
	}

	/**
	 * Finds a user
	 *
	 * @param id
	 * @returns
	 */
	async findOne(uuid: string): Promise<User> {
		const user = await this.userRepository.findOneBy({ uuid: uuid, });
		if (user === null) {
			throw new NotFoundException({
				status: "fail",
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
		// Find the user
		const user = await this.userRepository.findOneBy({ uuid: uuid, });
		if (user === null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "Failed to find the user by the provided id. Please check and try again.",
				},
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
		// Check if the user exists by email address
		const userByEmailAddress = await this.userRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		// Make sure we don't create another user using the same email address
		if (userByEmailAddress !== null && userByEmailAddress.uuid !== uuid) {
			console.log(userByEmailAddress.id, uuid);
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "Email address already exists. Please use a different email address.",
				},
			});
		}

		// Find the user
		const user = await this.userRepository.findOneBy({ uuid: uuid, });
		if (user === null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "Failed to find the user by the provided id. Please check and try again.",
				},
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
		// Find the user
		const user = await this.userRepository.findOneBy({ uuid: uuid, });
		if (user === null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "Failed to find the user by the provided id. Please check and try again.",
				},
			});
		}

		user.password = await bcrypt.hash(body.password.trim(), 10);
		return this.userRepository.save(user);
	}

	/**
	 * Deletes a user
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		await this.userRepository.delete(uuid);
	}
}
