import * as os from "node:os";

import type { Request } from "express";

import {
	Body,
	Req,
	Controller,
	BadRequestException,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Patch,
	Post,
	Query,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";

import { FileFieldsInterceptor } from "@nestjs/platform-express";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

import { GetCustomer } from "../customers/customer.decorator";
import { Customer } from "../customers/entities/customer.entity";

import { CustomerRole } from "../customers/enums/CustomerRole";
import { UserRole } from "../users/enums/UserRole";

import { CreateProductReportDto } from "./dtos/CreateProductReportDto";
import { UpdateProductReportStatusDto } from "./dtos/UpdateProductReportStatusDto";
import { ProductReport } from "./entities/product-report.entity";
import { ProductReportAttachment } from "./entities/product-report-attachment.entity";
import { ProductReportService } from "./product-report.service";

import { ProductReportReason } from "./enums/ProductReportReason.enum";
import { ProductReportStatus } from "./enums/ProductReportStatus.enum";

@UseGuards(AuthGuard, RolesGuard)
@Controller("v1/product-reports")
export class ProductReportController {
	constructor(@Inject(ProductReportService) private readonly productReportService: ProductReportService) { }

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Post()
	@UseInterceptors(FileFieldsInterceptor([
		{ name: "attachments", maxCount: 10, },
	], {
		dest: os.tmpdir(),
	}))
	@HttpCode(HttpStatus.CREATED)
	create(
		@GetCustomer() customer: Customer,
		@Body() dto: CreateProductReportDto,
		@UploadedFiles() files: {
			attachments?: Express.Multer.File[],
		},
	): Promise<ProductReport> {
		return this.productReportService.createProductReport(customer, dto, files?.attachments ?? []);
	}

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer, UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post(":uuid/attachments")
	@UseInterceptors(FileFieldsInterceptor([
		{ name: "attachments", maxCount: 10, },
	], {
		dest: os.tmpdir(),
	}))
	@HttpCode(HttpStatus.CREATED)
	uploadAttachment(
		@Param("uuid") uuid: string,
		@Req() req: Request & { customer?: Customer; },
		@UploadedFiles() files: {
			attachments?: Express.Multer.File[],
		},
	): Promise<Array<ProductReportAttachment>> {
		if (!files?.attachments || files.attachments.length === 0) {
			throw new BadRequestException({
				error: "Please upload at least one attachment.",
			});
		}

		return Promise.all(files.attachments.map((file) => this.productReportService.uploadAttachment(uuid, file, req.customer?.uuid)));
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get("admin/all")
	@HttpCode(HttpStatus.OK)
	findAll(
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
		@Query("status") status: ProductReportStatus,
		@Query("reason") reason: ProductReportReason,
	): Promise<Array<ProductReport>> {
		return this.productReportService.findAll(pageNumber, itemsPerPage, status, reason);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get("admin/:uuid")
	@HttpCode(HttpStatus.OK)
	findOne(@Param("uuid") uuid: string): Promise<ProductReport> {
		return this.productReportService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Patch(":uuid/status")
	@HttpCode(HttpStatus.OK)
	updateStatus(
		@Param("uuid") uuid: string,
		@Body() dto: UpdateProductReportStatusDto,
	): Promise<ProductReport> {
		return this.productReportService.updateStatus(uuid, dto);
	}
}
