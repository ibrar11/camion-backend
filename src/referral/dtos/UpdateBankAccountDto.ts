import { IsString, MinLength } from "class-validator";

export class UpdateBankAccountDto {
	@IsString()
	@MinLength(32)
	bankName: string;

	@IsString()
	@MinLength(32)
	accountHolderName: string;

	@IsString()
	@MinLength(32)
	accountNumber: string;

	@IsString()
	@MinLength(32)
	iban: string;

	@IsString()
	@MinLength(32)
	swiftCode: string;
}
