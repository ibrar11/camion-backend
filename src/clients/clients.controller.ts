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
	Patch,
	UseGuards,
} from '@nestjs/common';

import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { UpdateClientStatusDto } from './dto/update-client-status.dto';

import { Client } from './entities/client.entity';

import { UserRole } from '../users/enums/UserRole';

import { ClientsService } from './clients.service';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

import { Roles } from '../auth/roles.decorator';

@Controller('v1/clients')
@UseGuards(AuthGuard, RolesGuard)
export class ClientsController {
	constructor(
		@Inject(ClientsService)
		private readonly clientsService: ClientsService,
	) { }

	@Post()
	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@HttpCode(HttpStatus.CREATED)
	async actionCreateClient(
		@Body() body: CreateClientDto,
	): Promise<Partial<Client>> {
		return this.clientsService.createClient(body);
	}

	@Get()
	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@HttpCode(HttpStatus.OK)
	async actionGetAllClients(): Promise<Client[]> {
		return this.clientsService.findAll();
	}

	@Get(':uuid')
	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@HttpCode(HttpStatus.OK)
	async actionGetClientByUuid(
		@Param('uuid') uuid: string,
	): Promise<Client> {
		return this.clientsService.findOne(uuid);
	}

	@Put(':uuid')
	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@HttpCode(HttpStatus.OK)
	async actionUpdateClient(
		@Param('uuid') uuid: string,
		@Body() body: UpdateClientDto,
	): Promise<Client> {
		return this.clientsService.update(uuid, body);
	}

	@Patch(':uuid/status')
	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@HttpCode(HttpStatus.OK)
	async actionUpdateClientStatus(
		@Param('uuid') uuid: string,
		@Body() body: UpdateClientStatusDto,
	): Promise<Client> {
		return this.clientsService.updateStatus(uuid, body.status);
	}

	@Delete(':uuid')
	@Roles(UserRole.SuperAdmin)
	@HttpCode(HttpStatus.OK)
	async actionDeleteClient(
		@Param('uuid') uuid: string,
	): Promise<void> {
		await this.clientsService.delete(uuid);
	}
}
