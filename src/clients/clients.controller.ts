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
  UseGuards,
} from '@nestjs/common';

import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/enums/UserRole';

@Controller('v1/clients')
@UseGuards(AuthGuard, RolesGuard)
export class ClientsController {
  constructor(
    @Inject(ClientsService)
    private readonly clientsService: ClientsService,
  ) {}

  @Post()
  @Roles(UserRole.SuperAdmin)
  @HttpCode(HttpStatus.CREATED)
  async createClient(@Body() body: CreateClientDto) {
    return this.clientsService.createClient(body);
  }

  @Get()
  @Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
  @HttpCode(HttpStatus.OK)
  async getAllClients() {
    return this.clientsService.findAll();
  }

  @Get(':uuid')
  @Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
  @HttpCode(HttpStatus.OK)
  async getClientByUuid(@Param('uuid') uuid: string) {
    return this.clientsService.findOne(uuid);
  }

  @Put(':uuid')
  @Roles(UserRole.SuperAdmin, UserRole.Admin)
  @HttpCode(HttpStatus.OK)
  async updateClient(
    @Param('uuid') uuid: string,
    @Body() body: CreateClientDto,
  ) {
    return this.clientsService.update(uuid, body);
  }

  @Delete(':uuid')
  @Roles(UserRole.SuperAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClient(@Param('uuid') uuid: string) {
    return this.clientsService.delete(uuid);
  }
}