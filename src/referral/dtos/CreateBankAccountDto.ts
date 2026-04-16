import { IsString } from "class-validator";

export class CreateBankAccountDto {
	@IsString()
	bankName: string;

	@IsString()
	accountHolderName: string;

	@IsString()
	accountNumber: string;

	@IsString()
	iban: string;

	@IsString()
	swiftCode: string;
}
