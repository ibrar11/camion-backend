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

import { CreateKeyValuePairDto } from "./dtos/CreateKeyValuePairDto";
import { UpdateKeyValuePairDto } from "./dtos/UpdateKeyValuePairDto";

import { UserRole } from "../users/enums/UserRole";

import { KeyValuePair } from "./entities/key-value-pair.entity";
import { KeyValuePairsService } from "./key-value-pairs.service";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/key-value-pairs')
export class KeyValuePairController {
	constructor(@Inject(KeyValuePairsService) private readonly keyValuePairsService: KeyValuePairsService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateKeyValuePair(@Body() body: CreateKeyValuePairDto): Promise<KeyValuePair> {
		return this.keyValuePairsService.createKeyValuePair(body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetKeyValuePairs(
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<KeyValuePair>> {
		return this.keyValuePairsService.findAll(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetKeyValuePair(@Param('uuid') uuid: string): Promise<KeyValuePair> {
		return this.keyValuePairsService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateKeyValuePair(@Param('uuid') uuid: string, @Body() body: UpdateKeyValuePairDto): Promise<KeyValuePair> {
		return this.keyValuePairsService.updateOne(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteKeyValuePair(@Param('uuid') uuid: string): Promise<void> {
		return this.keyValuePairsService.delete(uuid);
	}
}
