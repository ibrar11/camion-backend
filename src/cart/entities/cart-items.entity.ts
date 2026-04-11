import { 
    Field,
    ObjectType 
} from "@nestjs/graphql";

import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Product } from "src/inventory/entities/product.entity";

import { ProductVariant } from "src/inventory/entities/product-variant.entity";

import { Customer } from "src/customers/entities/customer.entity";

@ObjectType()
@Entity({ name: "cart_items" })
export class CartItem {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column({ type: "uuid", nullable: false, unique: true, })
    uuid: string;

    @Field(() => Customer)
    @ManyToOne(() => Customer, (customer) => customer.cartItems, { onDelete: "CASCADE" })
    customer: Customer;

    @Field(() => Product)
    @ManyToOne(() => Product, (product) => product.cartItems, { onDelete: "CASCADE", })
    product: Product;

    @Field(() => ProductVariant)
    @ManyToOne(() => ProductVariant, (variant) => variant.cartItems, { onDelete: "CASCADE" })
    variant: ProductVariant;

    @Field()
    @Column({ type: "int", default: 1 })
    quantity: number;

    @Field()
    @Column({ type: "decimal", precision: 10, scale: 2 })
    subTotal: number;

    @Exclude()
    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt: Date;

    @Exclude()
    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt: Date;
}
