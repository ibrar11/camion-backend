import { IsOptional, IsString } from 'class-validator';

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
	firebaseDeviceToken?: string;
}
