import {
	Customer,
} from "src/customers/entities/customer.entity";

export type CustomerAuthResponse = {
	token: string;
	customer: Customer;
};
