import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FacebookMobileAuthDto {
	@IsNotEmpty()
	@IsString()
	accessToken: string;

	@IsOptional()
	@IsString()
	firebaseDeviceToken?: string;
}
