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
	UseGuards,
} from "@nestjs/common";

import { CreateWarehouseDto } from "./dtos/CreateWarehouseDto";
import { UpdateWarehouseDto } from "./dtos/UpdateWarehouseDto";

import { UserRole } from "../users/enums/UserRole";

import { Warehouse } from "./entities/warehouse.entity";
import { WarehouseService } from "./warehouse.service";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller("v1/warehouses")
export class WarehouseController {
	constructor(@Inject(WarehouseService) private readonly warehousesService: WarehouseService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateWarehouse(@Body() body: CreateWarehouseDto): Promise<Warehouse> {
		return this.warehousesService.createWarehouse(body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetWarehouses(
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<Warehouse>> {
		return this.warehousesService.findAll(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetWarehouse(@Param("uuid") uuid: string): Promise<Warehouse> {
		return this.warehousesService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateWarehouse(@Param("uuid") uuid: string, @Body() body: UpdateWarehouseDto): Promise<Warehouse> {
		return this.warehousesService.updateWarehouse(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteProduct(@Param('uuid') uuid: string): Promise<void> {
		return this.warehousesService.delete(uuid);
	}
}
