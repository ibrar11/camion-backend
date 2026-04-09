import {
	Customer,
} from "../../customers/entities/customer.entity";

export type CustomerAuthResponse = {
	token: string;
	customer: Customer;
};
