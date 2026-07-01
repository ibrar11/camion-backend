import * as crypto from "node:crypto";

import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { generateSlug } from "../common/slug";
import { getSkipAndTake } from "../common/pagination";

import { CreateCampaignDto } from './dtos/CreateCampaignDto';
import { UpdateCampaignDto } from "./dtos/UpdateCampaignDto";

import { Campaign } from './entities/campaign.entity';
import { CampaignCategory } from './entities/campaign-category.entity';
import { Category } from '../inventory/entities/category.entity';
import { CampaignsScheduler } from './campaigns.scheduler';

@Injectable()
export class CampaignsService {
	private readonly logger = new Logger(CampaignsService.name);

	constructor(
		@InjectRepository(Campaign) private readonly campaignRepository: Repository<Campaign>,
		@InjectRepository(CampaignCategory) private readonly campaignCategoryRepository: Repository<CampaignCategory>,
		@InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
		@Inject(CampaignsScheduler) private readonly campaignsScheduler: CampaignsScheduler,
	) { }

	/**
	 * Creates a campaign
	 *
	 * @param body
	 * @returns
	 */
	async createCampaign(body: CreateCampaignDto): Promise<Campaign> {
		this.logger.log(`Attempting to create a campaign`);

		// Make sure the slug is available for the campaign
		if (body.slug !== null) {
			const campaignBySlug = await this.campaignRepository.findOneBy({
				slug: body.slug.trim().toLowerCase(),
			});

			// Make sure we don't create another campaign with the same slug
			if (campaignBySlug !== null) {
				throw new BadRequestException({
					errors: {
						slug: "A campaign using the same slug already exists. Please use a different slug.",
					},
				});
			}
		}

		// Make sure the finishesAt is not in the past
		if (new Date().getTime() >= new Date(body.finishesAt).getTime()) {
			throw new BadRequestException({
				errors: {
					finishesAt: "Please make sure that the campaign finishes in the future.",
				},
			});
		}

		// Create a campaign
		const campaign = new Campaign();
		campaign.uuid = crypto.randomUUID();
		campaign.nameEn = body.name.en.trim();
		campaign.nameAr = body.name.ar.trim();
		campaign.briefEn = body.brief.en.trim();
		campaign.briefAr = body.brief.ar.trim();
		campaign.slug = generateSlug(body.slug);
		campaign.pricingFactor = body.pricingFactor;
		campaign.discountPercentage = body.discountPercentage;
		campaign.startsAt = new Date(body.startsAt);
		campaign.finishesAt = new Date(body.finishesAt);
		campaign.isActive = true;
		campaign.isFeatured = body.isFeatured;
		await this.campaignRepository.save(campaign);

		// Assign categories to the banner
		if (Array.isArray(body.categories) && body.categories.length !== 0) {
			await Promise.all(body.categories.map(async categoryUUID => {
				// Make sure the category exists
				const category = await this.categoryRepository.findOneBy({ uuid: categoryUUID, });
				if (category === null) {
					return null;
				}

				// Make sure the join between campaign and category exists
				const existing = await this.campaignCategoryRepository.findOneBy({
					campaign: {
						id: campaign.id,
					},
					category: {
						id: category.id,
					},
				});

				if (existing !== null) {
					return null;
				}

				// Create the join between campaign and category
				const campaignCategory = new CampaignCategory();
				campaignCategory.campaign = campaign;
				campaignCategory.category = category;
				await this.campaignCategoryRepository.save(campaignCategory);
			}));
		}

		// Make sure we don't have multiple featured campaigns
		if (body.isFeatured) {
			await this.campaignRepository.update({
				id: Not(campaign.id),
			}, {
				isFeatured: false,
			});
		}

		this.campaignsScheduler.scheduleCartAdjustment(campaign);

		return campaign;
	}

	/**
	 * Finds a list of campaigns
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	findAllUncached(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Campaign>> {
		this.logger.log(`Retrieving a list of campaigns`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.campaignRepository.find({
			relationLoadStrategy: "query",
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds a list of campaigns
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 */
	findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Campaign>> {
		this.logger.log(`Retrieving a list of cached campaigns`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.campaignRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Returns the number of campaigns
	 *
	 * @returns
	 */
	countAll(): Promise<number> {
		return this.campaignRepository.count({
			cache: true,
		});
	}

	/**
	 * Finds a campaign
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<Campaign> {
		this.logger.log(`Retrieving campaign: ${uuid}`);

		// Find the campaign
		const campaign = await this.campaignRepository.findOne({
			where: { uuid: uuid, },
			relations: {
				campaignCategories: {
					category: true,
				},
			},
		});
		if (campaign === null) {
			throw new NotFoundException({
				error: "Failed to find the campaign. Please check and try again.",
			});
		}
		return campaign;
	}

	/**
	 * Finds a campaign by slug
	 *
	 * @param slug
	 * @returns
	 */
	async findOneBySlug(slug: string): Promise<Campaign> {
		this.logger.log(`Retrieving campaign by slug`);

		// Find the campaign
		const campaign = await this.campaignRepository.findOne({
			where: { slug: slug, },
			relations: {
				campaignCategories: {
					category: true,
				},
			},
		});
		if (campaign === null) {
			throw new NotFoundException({
				error: "Failed to find the campaign. Please check and try again.",
			});
		}
		return campaign;
	}

	/**
	 * Finds the featured campaign
	 *
	 * @returns
	 */
	async findOneFeatured(): Promise<Campaign> {
		this.logger.log(`Retrieving featured campaign`);

		// Find the featured category
		const campaign = await this.campaignRepository.findOne({
			// cache: true,
			relationLoadStrategy: "query",
			where: {
				isActive: true,
				isFeatured: true,
			},
			relations: {
				campaignCategories: {
					category: true,
				},
			},
		});

		// Make sure a campaign exists
		if (campaign === null) {
			throw new NotFoundException({
				error: "Failed to find the campaign. Please check and try again.",
			});
		}

		// Make sure the campaign isn't expired
		if (new Date().getTime() >= campaign.finishesAt.getTime()) {
			throw new BadRequestException({
				error: "The featured campaign has already finished.",
			});
		}

		return campaign;
	}

	async updateCampaign(uuid: string, body: UpdateCampaignDto): Promise<Campaign> {
		this.logger.log(`Updating banner: ${uuid}`);

		// Check if the campaign already exists using the same slug
		if (body.slug !== null) {
			const campaignBySlug = await this.campaignRepository.findOneBy({
				slug: body.slug.trim().toLowerCase(),
			});

			// Make sure we don't create another campaign with the same slug
			if (campaignBySlug !== null && campaignBySlug.uuid !== uuid) {
				throw new BadRequestException({
					errors: {
						slug: "A campaign using the same slug already exists. Please use a different slug.",
					},
				});
			}
		}

		// Find the campaign
		const campaign = await this.campaignRepository.findOneBy({ uuid: uuid, });
		if (campaign === null) {
			throw new NotFoundException({
				error: "Failed to find the campaign. Please check and try again.",
			});
		}

		// Make sure the finishesAt is not in the past
		if (new Date().getTime() >= new Date(body.finishesAt).getTime()) {
			throw new BadRequestException({
				errors: {
					finishesAt: "Please make sure that the campaign finishes in the future.",
				},
			});
		}

		// Update the campaign
		campaign.nameEn = body.name.en.trim();
		campaign.nameAr = body.name.ar.trim();
		campaign.briefEn = body.brief.en.trim();
		campaign.briefAr = body.brief.ar.trim();
		campaign.slug = generateSlug(body.slug);
		campaign.pricingFactor = body.pricingFactor;
		campaign.discountPercentage = body.discountPercentage;
		campaign.startsAt = new Date(body.startsAt);
		campaign.finishesAt = new Date(body.finishesAt);
		campaign.isActive = true;
		campaign.isFeatured = body.isFeatured;
		await this.campaignRepository.save(campaign);

		// Assign categories to the banner
		if (Array.isArray(body.categories) && body.categories.length !== 0) {
			await Promise.all(body.categories.map(async categoryUUID => {
				// Make sure the category exists
				const category = await this.categoryRepository.findOneBy({ uuid: categoryUUID, });
				if (category === null) {
					return null;
				}

				// Make sure the join between campaign and category exists
				const existing = await this.campaignCategoryRepository.findOneBy({
					campaign: {
						id: campaign.id,
					},
					category: {
						id: category.id,
					},
				});

				if (existing !== null) {
					return null;
				}

				// Create the join between campaign and category
				const campaignCategory = new CampaignCategory();
				campaignCategory.campaign = campaign;
				campaignCategory.category = category;
				await this.campaignCategoryRepository.save(campaignCategory);
			}));
		} else {
			await this.campaignCategoryRepository.delete({
				campaign: {
					id: campaign.id,
				},
			});
		}

		// Make sure we don't have multiple featured campaigns
		if (body.isFeatured) {
			await this.campaignRepository.update({
				id: Not(campaign.id),
			}, {
				isFeatured: false,
			});
		}

		this.campaignsScheduler.scheduleCartAdjustment(campaign);

		return campaign;
	}

	/**
	 * Deletes a campaign
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		await this.campaignRepository.delete({
			uuid: uuid,
		});
	}
}
