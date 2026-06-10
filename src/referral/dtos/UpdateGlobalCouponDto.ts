import {
	IsEnum,
	IsNumber,
	IsString,
	Matches,
	Max,
	MaxLength,
	Min,
	MinLength,
} from "class-validator";

import { GlobalCouponDiscountType } from "../enums/GlobalCouponDiscountType";

export class UpdateGlobalCouponDto {
	@IsString()
	@MinLength(2)
	@MaxLength(16)
	@Matches(/^[A-Za-z0-9_-]{2,16}$/, { message: "Please enter a code with 2-16 characters, uppercase letters, digits, dashes, or underscores." })
	readonly code: string;

	@IsString()
	@IsEnum(GlobalCouponDiscountType)
	readonly discountType: GlobalCouponDiscountType;

	@IsNumber()
	@Min(1)
	@Max(99)
	readonly discountPercentage: number;

	@IsNumber()
	@Min(1)
	@Max(10000)
	readonly discountValue: number;

	@IsNumber()
	@Min(1)
	@Max(10000)
	readonly usageLimit: number;

	@IsString()
	@MinLength(1)
	@Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
	readonly expiresAt: string;
}
