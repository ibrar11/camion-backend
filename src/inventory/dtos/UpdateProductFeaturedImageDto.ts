import { IsUUID } from "class-validator";

export class UpdateProductFeaturedImageDto {
	@IsUUID()
	imageUUID: string;
}
