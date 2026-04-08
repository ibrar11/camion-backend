import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Patch,
	Post,
	Put,
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";

import { CreateCustomerAddressDto } from "./dtos/CreateCustomerAddressDto";
import { UpdateCustomerAddressDto } from "./dtos/UpdateCustomerAddressDto";

import { Customer } from "./entities/customer.entity";

import { CustomerAddress } from "./entities/customer-address.entity";
import { CustomerAddressesService } from "./customer-addresses.service";
import { PatchCustomerAddressDto } from "./dtos/PatchCustomerAddressDto";

import { AuthGuard } from "../auth/auth.guard";

@UseGuards(AuthGuard)
@Controller("v1/customer-addresses")
export class CustomerAddressesController {
	constructor(@Inject(CustomerAddressesService) private readonly customerAddressService: CustomerAddressesService) { }

	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateCustomerAddress(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Body()
		body: CreateCustomerAddressDto,
	): Promise<CustomerAddress> {
		return this.customerAddressService.createCustomerAddress(req.customer, body);
	}

	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetCustomerAddresses(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<CustomerAddress>> {
		return this.customerAddressService.findAll(req.customer, sort, pageNumber, itemsPerPage);
	}

	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetCustomerAddress(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('uuid') customerAddressUUID: string,
	): Promise<CustomerAddress> {
		return this.customerAddressService.findOne(req.customer, customerAddressUUID);
	}

	@Patch(':uuid')
	@HttpCode(HttpStatus.OK)
	actionPatchCustomerAddressAsDefault(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('uuid') customerAddressUUID: string,
		@Body() body: PatchCustomerAddressDto,
	): Promise<CustomerAddress> {
		return this.customerAddressService.patchCustomerAddressAsDefault(req.customer, customerAddressUUID, body);
	}

	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateCustomerAddress(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('uuid') customerAddressUUID: string,
		@Body() body: UpdateCustomerAddressDto,
	): Promise<CustomerAddress> {
		return this.customerAddressService.updateCustomerAddress(req.customer, customerAddressUUID, body);
	}

	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteCustomerAddress(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('uuid') customerAddressUUID: string,
	): Promise<void> {
		return this.customerAddressService.delete(req.customer, customerAddressUUID);
	}
}
