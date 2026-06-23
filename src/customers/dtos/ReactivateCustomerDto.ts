import { IsEmail, IsNotEmpty } from 'class-validator';

export class ReactivateCustomerDto {
	@IsEmail()
	@IsNotEmpty()
	emailAddress: string;
}
