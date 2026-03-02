import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
	imports: [
		TypeOrmModule.forFeature([User]),
	],
	providers: [AuthService, UsersService],
	controllers: [AuthController]
})
export class AuthModule { }
