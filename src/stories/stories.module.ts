import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { S3Service } from '../common/s3.service';

import { Story } from './entities/story.entity';
import { StoryFrame } from './entities/story-frame.entity';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { StoriesResolver } from './stories.resolver';

import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { ClientsModule } from '../clients/clients.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Story,
			StoryFrame,
			User,
			Customer,
		]),
		ClientsModule,
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
