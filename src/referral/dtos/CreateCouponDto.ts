import {
	IsNumber,
	IsString,
	Matches,
	Max,
	MaxLength,
	MinLength,
} from "class-validator";

export class CreateCouponDto {
	@IsString()
	@MinLength(1)
	@MaxLength(32)
	code: string;

	@IsNumber()
	@Max(10)
	discountPercentage: number;

	@IsString()
	@MinLength(1)
	@Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
	expiresAt: string;
}
