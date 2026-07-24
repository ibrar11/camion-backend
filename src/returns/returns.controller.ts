import * as os from "node:os";

import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

import { GetCustomer } from "../customers/customer.decorator";
import { Customer } from "../customers/entities/customer.entity";

import { CustomerRole } from "../customers/enums/CustomerRole";
import { UserRole } from "../users/enums/UserRole";

import { ReturnsService } from "./returns.service";
import { ReturnRequest } from "./entities/return-request.entity";
import { ReturnEvidence } from "./entities/return-evidence.entity";
import { ReturnStatus } from "./enums/ReturnStatus.enum";

import { CreateReturnRequestDto } from "./dtos/CreateReturnRequestDto";
import { UpdateReturnRequestStatusDto } from "./dtos/UpdateReturnRequestStatusDto";

import { CurrencyCode } from "../inventory/enums/CurrencyCode.enum";

@UseGuards(AuthGuard, RolesGuard)
@Controller("v1/return-requests")
export class ReturnsController {
    constructor(@Inject(ReturnsService) private readonly returnsService: ReturnsService) {}

    @Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @GetCustomer() customer: Customer,
        @Body() dto: CreateReturnRequestDto,
    ): Promise<ReturnRequest> {
        return this.returnsService.createReturnRequest(customer, dto);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Post(":uuid/evidence")
    @UseInterceptors(FileInterceptor("file", { dest: os.tmpdir(), }))
    @HttpCode(HttpStatus.CREATED)
    uploadEvidence(
        @Param("uuid") uuid: string,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<ReturnEvidence> {
        return this.returnsService.uploadEvidence(uuid, file);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Get()
    @HttpCode(HttpStatus.OK)
    findMine(
        @GetCustomer() customer: Customer,
        @Query("pageNumber") pageNumber: number,
        @Query("itemsPerPage") itemsPerPage: number,
        @Query("status") status: ReturnStatus,
        @Query("currency") currency: CurrencyCode,
    ): Promise<ReturnRequest[]> {
        return this.returnsService.findAllByCustomer(customer.uuid, pageNumber, itemsPerPage, currency, status);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Get(":uuid")
    @HttpCode(HttpStatus.OK)
    findOne(
        @Param("uuid") uuid: string,
        @Query("currency") currency: CurrencyCode,
    ): Promise<ReturnRequest> {
        return this.returnsService.findOne(uuid, currency);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get("admin/all")
    @HttpCode(HttpStatus.OK)
    findAll(
        @Query("pageNumber") pageNumber: number,
        @Query("itemsPerPage") itemsPerPage: number,
        @Query("status") status: ReturnStatus,
        @Query("currency") currency: CurrencyCode,
    ): Promise<ReturnRequest[]> {
        return this.returnsService.findAll(pageNumber, itemsPerPage, currency, status);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Patch(":uuid/status")
    @HttpCode(HttpStatus.OK)
    updateStatus(
        @Param("uuid") uuid: string,
        @Body() dto: UpdateReturnRequestStatusDto,
    ): Promise<ReturnRequest> {
        return this.returnsService.updateStatus(uuid, dto);
    }
}
