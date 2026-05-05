import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn
} from "typeorm";

import { Exclude } from "class-transformer";

import { Customer } from "../../customers/entities/customer.entity";

import { Product } from "../../inventory/entities/product.entity";

import {
    Field,
    ObjectType
} from "@nestjs/graphql";

import { ProductVariant } from "../../inventory/entities/product-variant.entity";

@ObjectType()
@Entity({ name: 'wishlist_items' })
@Unique(['customer', 'product'])
export class WishlistItem {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column({ type: 'uuid', unique: true })
    uuid: string;

    @Exclude()
    @ManyToOne(() => Customer, (customer) => customer.wishlistItems, { onDelete: 'CASCADE', })
    @Index()
    customer: Customer;

    @Field(() => Product)
    @ManyToOne(() => Product, { onDelete: 'CASCADE', })
    @Index()
    product: Product;

    @Field(() => ProductVariant)
    @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', })
    @Index()
    variant: ProductVariant;

    @Exclude()
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: false })
    createdAt: Date;

    @Exclude()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: false })
    updatedAt: Date;
}
