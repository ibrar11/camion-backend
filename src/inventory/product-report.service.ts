import * as crypto from "node:crypto";

import {
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { S3Service } from "../common/s3.service";
import { FileService } from "../common/file.service";
import { ImageThumbnailService } from "../common/image-thumbnail.service";

import { Customer } from "../customers/entities/customer.entity";

import { Product } from "./entities/product.entity";
import { ProductReport } from "./entities/product-report.entity";
import { ProductReportAttachment } from "./entities/product-report-attachment.entity";

import { CreateProductReportDto } from "./dtos/CreateProductReportDto";
import { UpdateProductReportStatusDto } from "./dtos/UpdateProductReportStatusDto";

import { ProductReportAttachmentType } from "./enums/ProductReportAttachmentType.enum";
import { ProductReportPriority } from "./enums/ProductReportPriority.enum";
import { ProductReportReason } from "./enums/ProductReportReason.enum";
import { ProductReportStatus } from "./enums/ProductReportStatus.enum";

@Injectable()
export class ProductReportService {
	private readonly logger = new Logger(ProductReportService.name);

	constructor(
		@Inject(S3Service) private readonly s3Service: S3Service,
		@Inject(FileService) private readonly fileService: FileService,
		@Inject(ImageThumbnailService) private readonly imageThumbnailService: ImageThumbnailService,

		@InjectRepository(Product) private readonly productRepository: Repository<Product>,
		@InjectRepository(ProductReport) private readonly productReportRepository: Repository<ProductReport>,
		@InjectRepository(ProductReportAttachment) private readonly productReportAttachmentRepository: Repository<ProductReportAttachment>,
	) { }

	async createProductReport(
		customer: Customer,
		dto: CreateProductReportDto,
		files: Express.Multer.File[] = [],
	): Promise<ProductReport> {
		this.logger.log(`Creating product report for product ${dto.productUuid}`);

		const product = await this.productRepository.findOne({
			where: { uuid: dto.productUuid, },
		});
		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
			});
		}

		const existingCustomerProductReport = await this.productReportRepository.findOne({
			where: {
				customer: {
					id: customer.id,
				},
				product: {
					id: product.id,
				},
			},
		});
		if (existingCustomerProductReport !== null) {
			throw new ConflictException({
				error: "You have already reported this product.",
			});
		}

		const duplicateFingerprint = this.generateDuplicateFingerprint(customer.uuid, dto.productUuid, dto.reason, dto.details, dto.orderNumber);
		const existingReport = await this.productReportRepository.findOne({
			where: { duplicateFingerprint, },
		});
		if (existingReport !== null) {
			throw new ConflictException({
				error: "This report was already submitted. Please avoid duplicate submissions.",
			});
		}

		const report = new ProductReport();
		report.uuid = crypto.randomUUID();
		report.customer = customer;
		report.product = product;
		report.reason = dto.reason;
		report.details = dto.details;
		report.orderNumber = dto.orderNumber ?? null;
		report.status = ProductReportStatus.Pending;
		report.priority = this.resolvePriority(dto.reason);
		report.adminNote = null;
		report.duplicateFingerprint = duplicateFingerprint;

		const savedReport = await this.productReportRepository.save(report);

		if (files.length > 0) {
			for (const file of files) {
				await this.createAttachment(savedReport, file);
			}
		}

		return this.findOne(savedReport.uuid);
	}

	async uploadAttachment(reportUUID: string, file: Express.Multer.File, customerUUID?: string): Promise<ProductReportAttachment> {
		const report = await this.productReportRepository.findOne({
			relations: {
				customer: true,
			},
			where: { uuid: reportUUID, },
		});
		if (report === null) {
			throw new NotFoundException({
				error: "Failed to find the report. Please check and try again.",
			});
		}

		if (customerUUID && report.customer?.uuid !== customerUUID) {
			throw new ForbiddenException({
				error: "You're not authorized to modify this product report.",
			});
		}

		return this.createAttachment(report, file);
	}

	async findAll(pageNumber = 1, itemsPerPage = 20, status?: ProductReportStatus, reason?: ProductReportReason): Promise<Array<ProductReport>> {
		const query = this.productReportRepository.createQueryBuilder("report")
			.leftJoinAndSelect("report.customer", "customer")
			.leftJoinAndSelect("report.product", "product")
			.leftJoinAndSelect("report.attachments", "attachments");

		if (status) {
			query.andWhere("report.status = :status", { status, });
		}

		if (reason) {
			query.andWhere("report.reason = :reason", { reason, });
		}

		query.orderBy("CASE WHEN report.priority = :highPriority THEN 1 ELSE 0 END", "DESC")
			.addOrderBy("report.createdAt", "DESC")
			.setParameter("highPriority", ProductReportPriority.High)
			.skip((Math.max(1, Number(pageNumber) || 1) - 1) * Math.max(1, Number(itemsPerPage) || 20))
			.take(Math.max(1, Number(itemsPerPage) || 20));

		return query.getMany();
	}

	async findAllByCustomer(
		customerUUID: string,
		pageNumber = 1,
		itemsPerPage = 20,
		status?: ProductReportStatus,
	): Promise<Array<ProductReport>> {
		const query = this.productReportRepository.createQueryBuilder("report")
			.leftJoinAndSelect("report.customer", "customer")
			.leftJoinAndSelect("report.product", "product")
			.leftJoinAndSelect("report.attachments", "attachments")
			.where("customer.uuid = :customerUUID", { customerUUID, });

		if (status) {
			query.andWhere("report.status = :status", { status, });
		}

		query.orderBy("CASE WHEN report.priority = :highPriority THEN 1 ELSE 0 END", "DESC")
			.addOrderBy("report.createdAt", "DESC")
			.setParameter("highPriority", ProductReportPriority.High)
			.skip((Math.max(1, Number(pageNumber) || 1) - 1) * Math.max(1, Number(itemsPerPage) || 20))
			.take(Math.max(1, Number(itemsPerPage) || 20));

		return query.getMany();
	}

	async findOne(uuid: string): Promise<ProductReport> {
		const report = await this.productReportRepository.findOne({
			where: { uuid, },
			relations: {
				attachments: true,
				customer: true,
				product: true,
			},
		});

		if (report === null) {
			throw new NotFoundException({
				error: "Failed to find the report. Please check and try again.",
			});
		}

		return report;
	}

	async findOneByCustomer(uuid: string, customerUUID: string): Promise<ProductReport> {
		const report = await this.productReportRepository.findOne({
			where: {
				uuid,
				customer: {
					uuid: customerUUID,
				},
			},
			relations: {
				attachments: true,
				customer: true,
				product: true,
			},
		});

		if (report === null) {
			throw new NotFoundException({
				error: "Failed to find the report. Please check and try again.",
			});
		}

		return report;
	}

	async updateStatus(uuid: string, dto: UpdateProductReportStatusDto): Promise<ProductReport> {
		const report = await this.productReportRepository.findOne({
			where: { uuid, },
			relations: {
				attachments: true,
				customer: true,
				product: true,
			},
		});

		if (report === null) {
			throw new NotFoundException({
				error: "Failed to find the report. Please check and try again.",
			});
		}

		report.status = dto.status;
		report.adminNote = dto.adminNote ?? report.adminNote ?? null;
		return this.productReportRepository.save(report);
	}

	private async createAttachment(report: ProductReport, file: Express.Multer.File): Promise<ProductReportAttachment> {
		let mediaUrl: string | null = null;
		let thumbnailUrl: string | null = null;
		let mediaType = ProductReportAttachmentType.Document;
		let generatedImagePath: string | null = null;
		let generatedThumbnailPath: string | null = null;

		try {
			if (file.mimetype?.startsWith("image/")) {
				mediaType = ProductReportAttachmentType.Image;
				generatedImagePath = await this.imageThumbnailService.generateImage(file.path);
				generatedThumbnailPath = await this.imageThumbnailService.generateThumbnail(file.path);

				const uploadedImage = await this.s3Service.uploadPath("product-reports", generatedImagePath, "image/webp");
				const uploadedThumbnail = await this.s3Service.uploadPath("product-reports", generatedThumbnailPath, "image/webp");
				mediaUrl = uploadedImage.url;
				thumbnailUrl = uploadedThumbnail.url;
			} else {
				const uploadedFile = await this.s3Service.uploadFile("product-reports", file);
				mediaUrl = uploadedFile.url;
			}

			const attachment = new ProductReportAttachment();
			attachment.uuid = crypto.randomUUID();
			attachment.report = report;
			attachment.mediaUrl = mediaUrl;
			attachment.thumbnailUrl = thumbnailUrl;
			attachment.mediaType = mediaType;
			attachment.fileName = file.originalname ?? null;
			attachment.mimeType = file.mimetype ?? null;

			return await this.productReportAttachmentRepository.save(attachment);
		} catch (error) {
			this.logger.error(error);
			throw new InternalServerErrorException({
				error: "Failed to upload the product report attachment. Please try again.",
			});
		} finally {
			if (generatedImagePath) {
				await this.fileService.deletePath(generatedImagePath).catch(() => undefined);
			}

			if (generatedThumbnailPath) {
				await this.fileService.deletePath(generatedThumbnailPath).catch(() => undefined);
			}

			await this.fileService.deleteFile(file).catch(() => undefined);
		}
	}

	private resolvePriority(reason: ProductReportReason): ProductReportPriority {
		if (reason === ProductReportReason.SafetyConcerns) {
			return ProductReportPriority.High;
		}

		return ProductReportPriority.Normal;
	}

	private generateDuplicateFingerprint(
		customerUUID: string,
		productUUID: string,
		reason: ProductReportReason,
		details: string,
		orderNumber?: string,
	): string {
		const normalized = [
			customerUUID.trim().toLowerCase(),
			productUUID.trim().toLowerCase(),
			reason.trim().toLowerCase(),
			details.trim().toLowerCase().replace(/\s+/g, " "),
			(orderNumber ?? "").trim().toLowerCase(),
		].join("|");

		return crypto.createHash("sha256").update(normalized).digest("hex");
	}
}
