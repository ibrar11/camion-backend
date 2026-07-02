import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class FacebookMobileAuthDto {
	@IsNotEmpty()
	@IsString()
	accessToken: string;

	@IsOptional()
	@IsString()
	@IsUUID('4')
	guestUUID?: string;

	@IsOptional()
	@IsString()
	firebaseDeviceToken?: string;
}
