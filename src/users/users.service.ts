import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>) {
	}

	createUser(): Promise<User> {
		const u = new User();
		u.fullName = "New User";
		u.emailAddress = "new-user@outlook.com";
		u.phoneNumber = "+92 304 1234567";
		u.password = "thisispassword";
		return this.userRepository.save(u);
	}

	findAll(): Promise<User[]> {
		return this.userRepository.find();
	}

	findOne(id: number): Promise<User | null> {
		return this.userRepository.findOneBy({ id: id, });
	}

	async delete(id: number): Promise<void> {
		await this.userRepository.delete(id);
	}
}
