import {
	IsNumber,
	Min,
} from "class-validator";

export class UpdateFrameDto {
	@IsNumber()
	@Min(1)
	duration: number;

	@IsNumber()
	@Min(0)
	order: number;
}
