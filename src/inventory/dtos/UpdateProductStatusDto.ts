import {
	IsEnum,
	IsString,
} from "class-validator";

import { ProductStatus } from "../enums/ProductStatus";

export class UpdateProductStatusDto {
	@IsString()
	@IsEnum(ProductStatus)
	status: string;
}
