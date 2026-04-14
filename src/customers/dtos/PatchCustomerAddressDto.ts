import { IsBoolean } from "class-validator";

export class PatchCustomerAddressDto {
	@IsBoolean()
	isDefault: boolean;
}
