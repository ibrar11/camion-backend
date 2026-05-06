import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class GoogleMobileAuthDto {
	@IsNotEmpty()
	@IsString()
	idToken: string;

	@IsOptional()
	@IsString()
	@IsUUID('4')
	guestUUID?: string;
}
