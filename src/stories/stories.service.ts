import * as crypto from "node:crypto";

import {
	BadRequestException,
	Inject,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { S3Service } from "../common/s3.service";
import { ImageThumbnailService } from "../common/image-thumbnail.service";
import { VideoThumbnailService } from "../common/video-thumbnail.service";
import { FileService } from "../common/file.service";

import { getSkipAndTake } from "../common/pagination";

import { CreateStoryDto } from './dtos/CreateStoryDto';
import { UpdateStoryDto } from "./dtos/UpdateStoryDto";
import { UpdateFrameDto } from "./dtos/UpdateFrameDto";

import { StoryMediaType } from "./enums/StoryMediaType.enum";

import { Story } from './entities/story.entity';
import { StoryFrame } from './entities/story-frame.entity';

@Injectable()
export class StoriesService {
	private readonly logger = new Logger(StoriesService.name);

	constructor(
		@Inject(S3Service) private readonly s3Service: S3Service,
		@Inject(VideoThumbnailService) private readonly videoThumbnailService: VideoThumbnailService,
		@Inject(ImageThumbnailService) private readonly imageThumbnailService: ImageThumbnailService,
		@Inject(FileService) private readonly fileService: FileService,
		@InjectRepository(Story) private readonly storyRepository: Repository<Story>,
		@InjectRepository(StoryFrame) private readonly frameRepository: Repository<StoryFrame>,
	) { }

	/**
	 * Creates a new story
	 *
	 * @param body
	 * @returns
	 */
	createStory(body: CreateStoryDto): Promise<Story> {
		this.logger.log(`Attempting to create story: ${body.caption}`);

		const story = new Story();
		story.uuid = crypto.randomUUID();
		story.captionEn = body.caption.en.trim();
		story.captionAr = body.caption.ar.trim();
		story.isHighlighted = body.isHighlighted;
		return this.storyRepository.save(story);
	}

	/**
	 * Retrives a list of stories
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Story>> {
		this.logger.log(`Retrieving stories`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.storyRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			relations: {
				frames: true,
			},
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Returns the estimated count of stories
	 *
	 * @returns
	 */
	async countAll(): Promise<number> {
		const result = await this.storyRepository.manager.query(`SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname = 'stories'`);
		if (Array.isArray(result) && result.length !== 0) {
			return Math.max(0, Number(result[0].estimate));
		}
		return 0;
	}

	/**
	 * Retrives a list of stories
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	findAllUncached(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Story>> {
		this.logger.log(`Retrieving stories`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.storyRepository.find({
			relationLoadStrategy: "query",
			relations: {
				frames: true,
			},
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds a story
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<Story> {
		this.logger.log(`Retrieving story: ${uuid}`);

		// Find the story
		const story = await this.storyRepository.findOne({
			where: { uuid: uuid, },
			relations: {
				frames: true,
			},
		});

		if (story === null) {
			throw new NotFoundException({
				error: "Failed to find the story. Please check and try again.",
			});
		}
		return story;
	}

	/**
	 * Updates a story
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateStory(uuid: string, body: UpdateStoryDto): Promise<Story> {
		this.logger.log(`Updating story: ${uuid}`);

		// Find the story
		const story = await this.storyRepository.findOneBy({ uuid: uuid, });
		if (story === null) {
			throw new NotFoundException({
				error: "Failed to find the story. Please check and try again.",
			});
		}

		// Update the story
		story.captionEn = body.caption.en.trim();
		story.captionAr = body.caption.ar.trim();
		story.isHighlighted = body.isHighlighted;
		return this.storyRepository.save(story);
	}

	/**
	 * Deletes a story
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		this.logger.log(`Deleting story: ${uuid}`);

		await this.storyRepository.delete({
			uuid: uuid,
		});
	}

	/**
	 * Creates a story frame
	 *
	 * @param storyUUID
	 * @param file
	 */
	async createStoryFrame(storyUUID: string, file: Express.Multer.File): Promise<StoryFrame> {
		this.logger.log(`Attempting to create a frame for story: ${storyUUID}`);

		// Make sure the uploaded file is either a video or an image
		if (!(file.mimetype.startsWith("video") || file.mimetype.startsWith("image"))) {
			throw new BadRequestException({
				error: "Please upload a video or an image as your story frame.",
			});
		}

		// Generate a thumbnail for the video or image
		let thumbnailPath = "", mediaType = StoryMediaType.Image;
		if (file.mimetype.startsWith("video")) {
			thumbnailPath = await this.videoThumbnailService.generateThumbnail(file.path);
			mediaType = StoryMediaType.Video;
		} else if (file.mimetype.startsWith("image")) {
			thumbnailPath = await this.imageThumbnailService.generateThumbnail(file.path);
			mediaType = StoryMediaType.Image;
		}

		// Upload the image/video to s3
		let mediaParams: { key: string, url: string } | null;
		try {
			mediaParams = await this.s3Service.uploadFile("stories", file);
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the media. Please try again.",
			});
		}

		// Upload the thumbnail of the image/video to s3
		let thumbnailParams: { key: string, url: string } | null;
		try {
			thumbnailParams = await this.s3Service.uploadPath("stories", thumbnailPath, "image/jpeg");
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the thumbnail. Please try again.",
			});
		}

		// Delete the generated thumbnail and temp files
		await this.fileService.deletePath(thumbnailPath);
		await this.fileService.deleteFile(file);

		// Find the storya
		const story = await this.storyRepository.findOneBy({ uuid: storyUUID, });
		if (story === null) {
			throw new NotFoundException({
				error: "Failed to find the story. Please check and try again.",
			});
		}

		// Create a frame for the uploaded file
		const frame = new StoryFrame();
		frame.uuid = crypto.randomUUID();
		frame.story = story;
		frame.mediaType = mediaType;
		frame.mediaUrl = mediaParams.url;
		frame.thumbnailUrl = thumbnailParams.url;
		frame.duration = 5;
		frame.stickers = [];
		return this.frameRepository.save(frame);
	}

	/**
	 * Finds all frames of a story
	 *
	 * @param storyUUID
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAllFrames(storyUUID: string, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<StoryFrame>> {
		this.logger.log(`Retrieving frames for the story: ${storyUUID}`);

		// Find the story
		const story = await this.storyRepository.findOneBy({ uuid: storyUUID, });
		if (story === null) {
			throw new BadRequestException({
				error: "Failed to find the story. Please check and try again.",
			});
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.frameRepository.find({
			where: {
				story: {
					id: story.id,
				},
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Retrieves a frame
	 *
	 * @param uuid
	 * @returns
	 */
	async findOneFrame(uuid: string): Promise<StoryFrame> {
		this.logger.log(`Retrieving frame: ${uuid}`);

		// Find the frame
		const frame = await this.frameRepository.findOneBy({ uuid: uuid, });
		if (frame === null) {
			throw new NotFoundException({
				error: "Failed to find the frame. Please check and try again.",
			});
		}
		return frame;
	}

	/**
	 * Updates a frame
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateOneFrame(uuid: string, body: UpdateFrameDto): Promise<StoryFrame> {
		this.logger.log(`Updating frame: ${uuid}`);

		// Find the frame
		const frame = await this.frameRepository.findOneBy({ uuid: uuid, });
		if (frame === null) {
			throw new NotFoundException({
				error: "Failed to find the frame. Please check and try again.",
			});
		}

		// Update the frame
		frame.duration = body.duration;
		frame.order = body.order;
		return this.frameRepository.save(frame);
	}

	/**
	 * Deletes a frame
	 *
	 * @param uuid
	 */
	async deleteFrame(uuid: string): Promise<void> {
		this.logger.log(`Deleting frame: ${uuid}`);

		await this.storyRepository.delete({
			uuid: uuid,
		});
	}
}
