import { IsNotEmpty, IsString } from 'class-validator';

export class FacebookMobileAuthDto {
	@IsNotEmpty()
	@IsString()
	accessToken: string;
}
