import { Field, ObjectType } from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { CustomerRole } from "../enums/CustomerRole";

import { CartItem } from "../../cart/entities/cart-items.entity";
import { CustomerAddress } from "./customer-address.entity";
import { LoginRequest } from "../../auth/entities/login-request.entity";
import { ProductReview } from "../../inventory/entities/product-review.entity";
import { Affiliate } from "../../referral/entities/affiliate.entity";

import { Order } from "../../order/entities/order.entity";

import { WishlistItem } from "../../wishlist/entities/wishlist.entity";

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

	@Field(() => String, { nullable: true, })
	@Column({ type: "varchar", length: 256, nullable: false, unique: true, })
	emailAddress: string;

	@Field(() => String, { nullable: true, })
	@Column({ type: "varchar", length: 16, nullable: true, unique: true, })
	phoneNumber: string | null;

	@Exclude()
	@Column({ type: "varchar", length: 64, nullable: true, unique: true, })
	googleId: string | null;

	@Exclude()
	@Column({ type: "varchar", length: 64, nullable: true, unique: true, })
	facebookId: string | null;

	@Exclude()
	@Column({ type: "varchar", length: 64, nullable: true, unique: true, })
	appleId: string | null;

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

	@Exclude()
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

	@OneToMany(() => Order, (order) => order.customer)
	orders: Array<Order>;

	@OneToMany(() => WishlistItem, (wishlistItem) => wishlistItem.customer, { cascade: true, })
	wishlistItems: Array<WishlistItem>;

	@OneToMany(() => CustomerAddress, (customerAddress) => customerAddress.customer, { cascade: true, })
	addresses: Array<CustomerAddress>;

	@OneToMany(() => ProductReview, (productReview) => productReview.customer, { cascade: true, })
	reviews: Array<ProductReview>;

	@Exclude()
	@OneToMany(() => LoginRequest, (loginRequest) => loginRequest.customer, { cascade: true, })
	loginRequests: Array<LoginRequest>;

	@OneToOne(() => Affiliate, (affiliate) => affiliate.customer)
	affiliate: Affiliate;

	@Column({ type: 'json', nullable: true })
	firebaseDeviceToken: string[];

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
