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
import { PatchCustomerAddressDto } from "./dtos/PatchCustomerAddressDto";

import { Customer } from "./entities/customer.entity";

import { CustomerAddress } from "./entities/customer-address.entity";
import { CustomerAddressesService } from "./customer-addresses.service";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "src/auth/roles.guard";
import { Roles } from "src/auth/roles.decorator";
import { CustomerRole } from "./enums/CustomerRole";

@UseGuards(AuthGuard)
@Controller("v1/customer-addresses")
export class CustomerAddressesController {
	constructor(@Inject(CustomerAddressesService) private readonly customerAddressService: CustomerAddressesService) { }

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
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
		return this.customerAddressService.createCustomerAddress(req.customer.uuid, body);
	}

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetCustomerAddresses(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<CustomerAddress>> {
		return this.customerAddressService.findAllByCustomer(req.customer.uuid, pageNumber, itemsPerPage);
	}

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetCustomerAddress(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('uuid') customerAddressUUID: string,
	): Promise<CustomerAddress> {
		return this.customerAddressService.findOne(req.customer.uuid, customerAddressUUID);
	}

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
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
		return this.customerAddressService.patchCustomerAddressAsDefault(req.customer.uuid, customerAddressUUID, body);
	}

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
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
		return this.customerAddressService.updateCustomerAddress(req.customer.uuid, customerAddressUUID, body);
	}

	@Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteCustomerAddress(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('uuid') customerAddressUUID: string,
	): Promise<void> {
		return this.customerAddressService.delete(req.customer.uuid, customerAddressUUID);
	}
}
