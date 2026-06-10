import {
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsString,
	Min,
	MinLength,
} from "class-validator";

import { ExportRequestFormat } from "../enums/ExportRequestFormat.enum";

export class CreateExportRequestDto {
	@IsNotEmpty()
	@MinLength(1)
	readonly name: string;

	@IsString()
	@IsEnum(ExportRequestFormat)
	readonly format: ExportRequestFormat;

	@IsNumber()
	@Min(1)
	readonly pagesCount: number;
}
