import { Field, ObjectType } from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { CustomerRole } from "../enums/CustomerRole";

import { CartItem } from "src/cart/entities/cart-items.entity";
import { LoginRequest } from "src/auth/entities/login-request.entity";
import { CustomerAddress } from "./customer-address.entity";
import { ProductReview } from "src/inventory/entities/product-review.entity";

@ObjectType()
@Entity({ name: "customers" })
export class Customer {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Field()
	@Column({ type: "varchar", length: 64, })
	fullName: string;

	@Column({ type: "varchar", length: 256, nullable: true, unique: true, })
	emailAddress: string | null;

	@Column({ type: "varchar", length: 16, nullable: true, unique: true, })
	phoneNumber: string | null;

	@Exclude()
	@Column({ type: "varchar", nullable: false, length: 64, })
	password: string;

	@Exclude()
	@Column({ type: "varchar", length: 64, default: "", })
	secret: string;

	@Column({
		type: "enum",
		enum: CustomerRole,
		default: CustomerRole.Customer,
	})
	role: CustomerRole;

	@Column({ nullable: true, unique: true, })
	deviceId: string;

	@Exclude()
	@Column({ type: "boolean", default: false, })
	isEmailAddressVerified: boolean;

	@Exclude()
	@Column({ type: "boolean", default: false, })
	isPhoneNumberVerified: boolean;

	@Exclude()
	@Column({ type: "boolean", default: true, })
	isActive: boolean;

	@OneToMany(() => CartItem, (cartItem) => cartItem.customer, { cascade: true, })
	cartItems: Array<CartItem>;

	@OneToMany(() => CustomerAddress, (customerAddress) => customerAddress.customer, { cascade: true, })
	addresses: Array<CustomerAddress>;

	@OneToMany(() => ProductReview, (productReview) => productReview.customer, { cascade: true, })
	reviews: Array<ProductReview>;

	@Exclude()
	@OneToMany(() => LoginRequest, (loginRequest) => loginRequest.customer, { cascade: true, })
	loginRequests: Array<LoginRequest>;

	@Exclude()
	@UpdateDateColumn({
		name: "updated_at",
		type: "timestamptz",
	})
	updatedAt: Date;

	@Exclude()
	@CreateDateColumn({
		name: "created_at",
		type: "timestamptz",
	})
	createdAt: Date;

	@Exclude()
    @Column({ type: 'timestamptz', nullable: true })
    markedForDeletionAt: Date | null;

	@Exclude()
    @Column({ type: 'timestamptz', nullable: true })
    deletedAt: Date | null;
}
