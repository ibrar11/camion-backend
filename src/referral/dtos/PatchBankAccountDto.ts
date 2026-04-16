import { IsBoolean } from "class-validator";

export class PatchBankAccountDto {
	@IsBoolean()
	isDefault: boolean;
}
