import {
    Field,
    Int,
    ObjectType
} from "@nestjs/graphql";

import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Product } from "../../inventory/entities/product.entity";

import {
    Money,
    ProductVariant
} from "../../inventory/entities/product-variant.entity";

import { Customer } from "../../customers/entities/customer.entity";

@ObjectType()
@Entity({ name: "cart_items" })
export class CartItem {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column({ type: "uuid", nullable: false, unique: true, })
    uuid: string;

    @Exclude()
    @ManyToOne(() => Customer, (customer) => customer.cartItems, { onDelete: "CASCADE" })
    @Index()
    customer: Customer;

    @Field(() => Product)
    @ManyToOne(() => Product, (product) => product.cartItems, { onDelete: "CASCADE", })
    @Index()
    product: Product;

    @Field(() => ProductVariant)
    @ManyToOne(() => ProductVariant, (variant) => variant.cartItems, { onDelete: "CASCADE" })
    @Index()
    variant: ProductVariant;

    @Field(() => Int)
    @Column({ type: "int", default: 1 })
    quantity: number;

    @Field(() => Money)
    @Column(() => Money)
    subTotal: Money;

    // <!--
    // These fields are not part of the schema. Please don't add them to the database.

    @Field(() => Int)
    availableStock: number;

    @Field()
    isAvailable: boolean;

    // -->

    @Exclude()
    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt: Date;

    @Exclude()
    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt: Date;
}
