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
} from "@nestjs/common";

import { AuthGuard } from "src/auth/auth.guard";
import { RolesGuard } from "src/auth/roles.guard";
import { Roles } from "src/auth/roles.decorator";
import { UserRole } from "src/users/enums/UserRole";

import { LanguagesService } from "./languages.service";
import { CreateLanguageDto } from "./dtos/CreateLanguageDto";
import { UpdateLanguageDto } from "./dtos/UpdateLanguageDto";
import { Language } from "./entities/language.entity";

@UseGuards(AuthGuard, RolesGuard)
@Controller("v1/languages")
export class LanguagesController {
	constructor(@Inject(LanguagesService) private readonly languagesService: LanguagesService) {}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreate(@Body() body: CreateLanguageDto): Promise<Language> {
		return this.languagesService.create(body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionFindAll(): Promise<Language[]> {
		return this.languagesService.getAllLanguages();
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(":uuid")
	@HttpCode(HttpStatus.OK)
	actionUpdate(@Param("uuid") uuid: string, @Body() body: UpdateLanguageDto): Promise<Language> {
		return this.languagesService.update(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Delete(":uuid")
	@HttpCode(HttpStatus.OK)
	actionDelete(@Param("uuid") uuid: string): Promise<void> {
		return this.languagesService.delete(uuid);
	}
}
