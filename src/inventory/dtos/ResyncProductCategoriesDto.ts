import {
	ArrayUnique,
	IsIn,
	IsArray,
	IsOptional,
	IsUUID,
} from "class-validator";

export class ResyncProductCategoriesDto {
	@IsOptional()
	@IsIn(["all", "selected"])
	scope?: "all" | "selected";

	@IsOptional()
	@IsArray()
	@ArrayUnique({ message: "productUuids values must be unique" })
	@IsUUID("4", { each: true })
	productUuids?: string[];
}
