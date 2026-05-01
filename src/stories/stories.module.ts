import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { S3Service } from '../common/s3.service';
import { FileService } from '../common/file.service';
import { ImageThumbnailService } from '../common/image-thumbnail.service';
import { VideoThumbnailService } from '../common/video-thumbnail.service';

import { Story } from './entities/story.entity';
import { StoryFrame } from './entities/story-frame.entity';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { FramesResolver, StoriesResolver } from './stories.resolver';

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
		FileService,
		UsersService,
		CustomersService,
		StoriesService,
		StoriesResolver,
		FramesResolver,
		ImageThumbnailService,
		VideoThumbnailService,
	],
	controllers: [StoriesController],
})
export class StoriesModule { }
