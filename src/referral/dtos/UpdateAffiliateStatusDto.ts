import { IsEnum } from "class-validator";

import { AffiliateStatus } from "../enums/AffiliateStatus.enum";

export class UpdateAffiliateStatusDto {
	@IsEnum(AffiliateStatus)
	status: AffiliateStatus;
}
