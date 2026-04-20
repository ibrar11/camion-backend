import { IsString, MaxLength, MinLength } from "class-validator";

export class RequestAffiliateDto {
	@IsString()
	@MinLength(1)
	@MaxLength(128)
	fullName: string;

	@IsString()
	@MinLength(1)
	@MaxLength(32)
	gender: string;

	@IsString()
	@MinLength(1)
	@MaxLength(32)
	nationality: string;

	@IsString()
	@MinLength(1)
	@MaxLength(256)
	bio: string;
}
