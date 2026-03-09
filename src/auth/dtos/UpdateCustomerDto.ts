import {
	IsNotEmpty,
} from "class-validator";

export class UpdateCustomerDto {
	@IsNotEmpty()
	fullName: string;
}
