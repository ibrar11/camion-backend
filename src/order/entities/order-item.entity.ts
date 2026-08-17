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

import { Order } from './order.entity';

import { Product } from '../../inventory/entities/product.entity';

import {
  Money,
  ProductVariant,
} from '../../inventory/entities/product-variant.entity';

import { Warehouse } from '../../inventory/entities/warehouse.entity';
@ObjectType()
@Entity('order_items')
export class OrderItem {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ type: 'uuid', nullable: false, unique: true })
  uuid: string;

  @Field(() => Order)
  @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: 'CASCADE' })
  @Index()
  order: Order;

  @Field(() => Product)
  @ManyToOne(() => Product, (product) => product.orderItems)
  @Index()
  product: Product;

  @Field(() => ProductVariant)
  @ManyToOne(() => ProductVariant, (variant) => variant.orderItems)
  @Index()
  variant: ProductVariant;

  @Exclude()
  @ManyToOne(() => Warehouse, (warehouse) => warehouse.orderItems)
  @Index()
  warehouse: Warehouse;

  @Field(() => Money)
  @Column(() => Money)
  price: Money;

  @Field(() => Money)
  @Column(() => Money)
  discountedPrice: Money;

  @Field(() => Int)
  @Column()
  quantity: number;

  @Field(() => Money)
  @Column(() => Money)
  total: Money;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true, default: null })
  bundleUuid: string | null;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  bundleQuantity: number;

  @Column({ type: 'jsonb', nullable: true, default: null })
  bundleAllocations: Array<{
    bundleUuid: string;
    bundleTitle: string;
    quantity: number;
    discountMinor: number;
  }> | null;

  @Column({ type: 'boolean', default: false })
  invalidOrderItem: boolean;

  @Exclude()
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;

  @Exclude()
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;
}
