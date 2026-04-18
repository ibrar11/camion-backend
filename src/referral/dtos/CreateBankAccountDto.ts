import { IsString, MaxLength } from "class-validator";

export class CreateBankAccountDto {
	@IsString()
	@MaxLength(32)
	bankName: string;

	@IsString()
	@MaxLength(32)
	accountHolderName: string;

	@IsString()
	@MaxLength(32)
	accountNumber: string;

	@IsString()
	@MaxLength(32)
	iban: string;

	@IsString()
	@MaxLength(32)
	swiftCode: string;
}
