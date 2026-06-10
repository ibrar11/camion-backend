import {
	IsNotEmpty,
	MinLength,
} from "class-validator";

export class PatchExportRequestDownloadUrlDto {
	@IsNotEmpty()
	@MinLength(1)
	readonly downloadUrl: string;
}
