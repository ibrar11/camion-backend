import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToMany,
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
import { ProductVariant } from "src/inventory/entities/product-variant.entity";

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
    customer: Customer;

    @Field(() => Product)
    @ManyToOne(() => Product, { onDelete: 'CASCADE', })
    product: Product;

    @Field(() => ProductVariant)
    @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', })
    variant: ProductVariant;

    @Exclude()
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: false })
    createdAt: Date;

    @Exclude()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: false })
    updatedAt: Date;
}
