import {
	IsNumber,
	IsString,
	Matches,
	Max,
	MaxLength,
	Min,
	MinLength,
} from "class-validator";

export class CreateGlobalCouponDto {
	@IsString()
	@MinLength(2)
	@MaxLength(16)
	@Matches(/^[A-Za-z0-9_-]{2,16}$/, { message: "Please enter a code with 2-16 characters, uppercase letters, digits, dashes, or underscores." })
	code: string;

	@IsNumber()
	@Min(1)
	@Max(99)
	discountPercentage: number;

	@IsString()
	@MinLength(1)
	@Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
	expiresAt: string;
}
