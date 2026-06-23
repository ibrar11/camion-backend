import {
	IsEnum,
	IsString,
} from "class-validator";

import { ExportRequestStatus } from "../enums/ExportRequestStatus.enum";

export class PatchExportRequestDto {
	@IsString()
	@IsEnum(ExportRequestStatus)
	readonly status: ExportRequestStatus;
}
