import { IsOptional, IsString, IsUUID } from 'class-validator';

export class VerifyCustomerDto {
	token: string;
	secret: string;

	@IsOptional()
	@IsString()
	@IsUUID('4')
	guestUUID?: string;
}
