import * as crypto from "node:crypto";

import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { getSkipAndTake } from "../common/pagination";

import { CreateExportRequestDto } from './dtos/CreateExportRequestDto';
import { UpdateExportRequestDto } from "./dtos/UpdateExportRequestDto";
import { PatchExportRequestDto } from "./dtos/PatchExportRequestDto";
import { PatchExportRequestDownloadUrlDto } from "./dtos/PatchExportRequestDownloadUrlDto";

import { ExportRequestStatus } from './enums/ExportRequestStatus.enum';

import { ExportRequest } from './entities/export-request.entity';

@Injectable()
export class ExportRequestsService {
	private readonly logger = new Logger(ExportRequestsService.name);

	constructor(@InjectRepository(ExportRequest) private readonly exportRequestRepository: Repository<ExportRequest>) { }

	/**
	 * Creates an export request
	 *
	 * @param body
	 * @returns
	 */
	async createExportRequest(body: CreateExportRequestDto): Promise<ExportRequest> {
		this.logger.log(`Creating export request: ${body.name}`);

		// Make sure their isn't a pending request for the same type right now.
		const exportRequestByTypeAndStatus = await this.exportRequestRepository.findOneBy({
			format: body.format,
			status: ExportRequestStatus.Pending,
		});

		if (exportRequestByTypeAndStatus !== null) {
			throw new BadRequestException({
				errors: {
					type: "An export request is already in the queue for the selected type.",
				},
			});
		}

		// Create the export request
		const exportRequest = new ExportRequest();
		exportRequest.uuid = crypto.randomUUID();
		exportRequest.name = body.name;
		exportRequest.format = body.format;
		exportRequest.pagesCount = body.pagesCount;
		exportRequest.status = ExportRequestStatus.Pending;
		return this.exportRequestRepository.save(exportRequest);
	}

	/**
	 * Finds a list of export requests
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<ExportRequest>> {
		this.logger.log(`Retrieving export requests`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.exportRequestRepository.find({
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds an export request
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<ExportRequest> {
		this.logger.log(`Retrieving export request: ${uuid}`);

		const exportRequest = await this.exportRequestRepository.findOneBy({ uuid: uuid, });
		if (exportRequest === null) {
			throw new NotFoundException({
				error: "Failed to find the export request. Please check and try again.",
			});
		}
		return exportRequest;
	}

	/**
	 * Finds the last pending export request
	 *
	 * @returns
	 */
	findOnePending(): Promise<ExportRequest | null> {
		this.logger.log(`Retrieving the last pending export request`);

		return this.exportRequestRepository.findOne({
			where: {
				status: ExportRequestStatus.Pending,
			},
			order: {
				id: "DESC"
			},
		});
	}

	/**
	 * Updates the export request
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateExportRequest(uuid: string, body: UpdateExportRequestDto): Promise<ExportRequest> {
		this.logger.log(`Updating export request: ${uuid}`);

		// Find the export request
		const exportRequest = await this.exportRequestRepository.findOneBy({ uuid: uuid, });
		if (exportRequest === null) {
			throw new NotFoundException({
				error: "Failed to find the export request. Please check and try again.",
			});
		}

		// Update the export request
		exportRequest.name = body.name;
		return this.exportRequestRepository.save(exportRequest);
	}

	/**
	 * Updates the status of the export request
	 *
	 * @param uuid
	 */
	async updateExportRequestStatus(uuid: string, body: PatchExportRequestDto): Promise<ExportRequest> {
		this.logger.log(`Updating the status of export request: ${uuid}`);

		// Find the export request
		const exportRequest = await this.exportRequestRepository.findOneBy({ uuid: uuid, });
		if (exportRequest === null) {
			throw new NotFoundException({
				error: "Failed to find the export request. Please check and try again.",
			});
		}

		// Update the export request
		exportRequest.status = body.status;
		return this.exportRequestRepository.save(exportRequest);
	}

	/**
	 * Updates the download url of the export request
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateExportRequestDownloadUrl(uuid: string, body: PatchExportRequestDownloadUrlDto): Promise<ExportRequest> {
		this.logger.log(`Updating the download url of the export request: ${uuid}`);

		// Find the export request
		const exportRequest = await this.exportRequestRepository.findOneBy({ uuid: uuid, });
		if (exportRequest === null) {
			throw new NotFoundException({
				error: "Failed to find the export request. Please check and try again.",
			});
		}

		// Update the download url and status of the export request
		exportRequest.downloadUrl = body.downloadUrl;
		exportRequest.status = ExportRequestStatus.Completed;
		return this.exportRequestRepository.save(exportRequest);
	}

	/**
	 * Deletes an export request
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		this.logger.log(`Deleting export request: ${uuid}`);

		await this.exportRequestRepository.delete({
			uuid: uuid,
		});
	}
}
