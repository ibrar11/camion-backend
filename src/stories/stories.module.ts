import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { S3Service } from 'src/common/s3.service';

import { Story } from './entities/story.entity';
import { StoryFrame } from './entities/story-frame.entity';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { StoriesResolver } from './stories.resolver';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Story,
			StoryFrame,
			User,
			Customer,
		]),
	],
	providers: [
		S3Service,
		UsersService,
		CustomersService,
		StoriesService,
		StoriesResolver,
	],
	controllers: [StoriesController],
})
export class StoriesModule { }
