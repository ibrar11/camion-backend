import * as os from "node:os";

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
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from "@nestjs/platform-express";

import { CreateStoryDto } from './dtos/CreateStoryDto';
import { UpdateStoryDto } from './dtos/UpdateStoryDto';
import { UpdateFrameDto } from './dtos/UpdateFrameDto';

import { UserRole } from '../users/enums/UserRole';

import { User } from "../users/entities/user.entity";

import { Story } from './entities/story.entity';
import { StoryFrame } from './entities/story-frame.entity';
import { StoriesService } from './stories.service';

import { RolesGuard } from '../auth/roles.guard';
import { AuthGuard } from '../auth/auth.guard';

import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/stories')
export class StoriesController {
	constructor(@Inject(StoriesService) private readonly storiesService: StoriesService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateStory(@Body() body: CreateStoryDto): Promise<Story> {
		return this.storiesService.createStory(body);
	}

	@Roles()
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetStories(
		@Req()
		req: Request & {
			user: User,
		},
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<Story>> {
		if (req.user) {
			return this.storiesService.findAllUncached(filters, sort, pageNumber, itemsPerPage);
		}
		return this.storiesService.findAll(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles()
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetStory(@Param('uuid') uuid: string): Promise<Story> {
		return this.storiesService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateStory(@Param('uuid') uuid: string, @Body() body: UpdateStoryDto): Promise<Story> {
		return this.storiesService.updateStory(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteStory(@Param('uuid') uuid: string): Promise<void> {
		return this.storiesService.delete(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post(':uuid/frames')
	@UseInterceptors(FileInterceptor("file", { dest: os.tmpdir(), }))
	@HttpCode(HttpStatus.CREATED)
	actionCreateStoryFrame(@Param('uuid') uuid: string, @UploadedFile() file: Express.Multer.File): Promise<StoryFrame> {
		return this.storiesService.createStoryFrame(uuid, file);
	}

	@Roles()
	@Get(':uuid/frames')
	@HttpCode(HttpStatus.OK)
	actionRetrieveStoryFrames(
		@Param('uuid') uuid,
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<StoryFrame>> {
		return this.storiesService.findAllFrames(uuid, filters, sort, pageNumber, itemsPerPage);
	}

	@Roles()
	@Get(':uuid/frames/:frameUUID')
	@HttpCode(HttpStatus.OK)
	actionGetOneFramse(@Param('frameUUID') frameUUID: string): Promise<StoryFrame> {
		return this.storiesService.findOneFrame(frameUUID);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid/frames/:frameUUID')
	@HttpCode(HttpStatus.OK)
	actionUpdateOneFrame(@Param('frameUUID') frameUUID: string, @Body() body: UpdateFrameDto): Promise<StoryFrame> {
		return this.storiesService.updateOneFrame(frameUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Delete(':uuid/frames/:frameUUID')
	@HttpCode(HttpStatus.OK)
	actionDeleteFrame(@Param('frameUUID') frameUUID: string): Promise<void> {
		return this.storiesService.deleteFrame(frameUUID);
	}
}
