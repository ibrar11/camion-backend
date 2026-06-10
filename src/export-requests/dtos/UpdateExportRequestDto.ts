import {
	IsNotEmpty,
	MinLength,
} from "class-validator";

export class UpdateExportRequestDto {
	@IsNotEmpty()
	@MinLength(1)
	readonly name: string;
}
