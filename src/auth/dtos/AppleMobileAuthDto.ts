import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AppleMobileAuthDto {
	@IsOptional()
	@IsString()
	identityToken?: string;

	@IsOptional()
	@IsString()
	authorizationCode?: string;

	@IsOptional()
	@IsString()
	fullName?: string;

	@IsOptional()
	@IsString()
	@IsUUID('4')
	guestUUID?: string;

	@IsOptional()
	@IsString()
	firebaseDeviceToken?: string;
}
