import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { Bundle } from './bundle.entity';
import { Product } from '../../inventory/entities/product.entity';
import { ProductVariant } from '../../inventory/entities/product-variant.entity';

@ObjectType()
@Entity({ name: 'bundle_items' })
export class BundleItem {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Bundle)
  @ManyToOne(() => Bundle, (bundle) => bundle.items, { onDelete: 'CASCADE' })
  @Index()
  bundle: Bundle;

  @Field(() => Product, { nullable: true })
  @ManyToOne(() => Product, { nullable: true, onDelete: 'CASCADE' })
  @Index()
  product: Product | null;

  @Field(() => ProductVariant, { nullable: true })
  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'CASCADE' })
  @Index()
  variant: ProductVariant | null;

  @Field(() => Int)
  @Column({ type: 'int', default: 1 })
  quantity: number;
}
