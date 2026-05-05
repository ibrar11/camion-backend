import {
	IsEnum,
	IsString,
} from "class-validator";

import { ProductStatus } from "../enums/ProductStatus.enum";

export class UpdateProductStatusDto {
	@IsString()
	@IsEnum(ProductStatus)
	status: ProductStatus;
}
