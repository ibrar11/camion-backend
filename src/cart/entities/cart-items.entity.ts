import { Field, Int, ObjectType } from '@nestjs/graphql';

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Exclude } from 'class-transformer';

import { Product } from '../../inventory/entities/product.entity';

import { ProductVariant } from '../../inventory/entities/product-variant.entity';

import { Customer } from '../../customers/entities/customer.entity';

import { CurrencyCode } from '../../inventory/enums/CurrencyCode.enum';
import { BundleAllocation } from '../../bundles/entities/bundle-allocation.type';

@ObjectType()
export class CartMoney {
  @Field(() => Int)
  @Column({ type: 'integer', nullable: true })
  amount: number;

  @Field(() => Int)
  @Column({ type: 'integer', nullable: false, default: 0 })
  minorAmount: number;

  @Field()
  @Column({
    type: 'enum',
    enum: CurrencyCode,
    default: CurrencyCode.USD,
  })
  currencyCode: CurrencyCode;
}

@ObjectType()
@Entity({ name: 'cart_items' })
export class CartItem {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ type: 'uuid', nullable: false, unique: true })
  uuid: string;

  @Exclude()
  @ManyToOne(() => Customer, (customer) => customer.cartItems, {
    onDelete: 'CASCADE',
  })
  @Index()
  customer: Customer;

  @Field(() => Product)
  @ManyToOne(() => Product, (product) => product.cartItems, {
    onDelete: 'CASCADE',
  })
  @Index()
  product: Product;

  @Field(() => ProductVariant)
  @ManyToOne(() => ProductVariant, (variant) => variant.cartItems, {
    onDelete: 'CASCADE',
  })
  @Index()
  variant: ProductVariant;

  @Field(() => Int)
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Field(() => CartMoney)
  @Column(() => CartMoney)
  subTotal: CartMoney;

  @Field(() => CartMoney)
  @Column(() => CartMoney)
  discountPrice: CartMoney;

  @Field(() => CartMoney)
  @Column(() => CartMoney)
  total: CartMoney;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true, default: null })
  bundleUuid: string | null;

  @Column({ type: 'uuid', nullable: true, default: null })
  bundleSourceUuid: string | null;

  @Column({ type: 'uuid', nullable: true, default: null })
  bundleSelectionUuid: string | null;

  @Column({ type: 'int', default: 0 })
  bundleMinimumSelectionCount: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  bundleQuantity: number;

  @Field(() => [BundleAllocation], { nullable: true })
  @Column({ type: 'jsonb', nullable: true, default: null })
  bundleAllocations: Array<BundleAllocation> | null;

  // <!--
  // These fields are not part of the schema. Please don't add them to the database.

  @Field(() => Int)
  availableStock: number;

  @Field()
  isAvailable: boolean;

  // -->

  @Exclude()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Exclude()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
