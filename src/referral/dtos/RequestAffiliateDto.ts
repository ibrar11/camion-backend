import { IsString } from "class-validator";

export class RequestAffiliateDto {
	@IsString()
	fullName: string;

	@IsString()
	gender: string;

	@IsString()
	nationality: string;

	@IsString()
	bio: string;
}
