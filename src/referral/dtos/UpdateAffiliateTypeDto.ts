import { IsEnum } from "class-validator";

import { AffiliateType } from "../enums/AffiliateType.enum";

export class UpdateAffiliateTypeDto {
	@IsEnum(AffiliateType)
	type: AffiliateType;
}
