import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { CurrencyCode } from '../../inventory/enums/CurrencyCode.enum';
import { BundleItem } from './bundle-item.entity';

export enum BundleDiscountType {
  FLAT_TOTAL = 'flat_total',
  PERCENTAGE_OFF = 'percentage_off',
  FIXED_AMOUNT_OFF = 'fixed_amount_off',
}

@ObjectType()
@Entity({ name: 'bundles' })
export class Bundle {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ type: 'uuid', nullable: false, unique: true })
  uuid: string;

  @Field()
  title: string;

  @Column({ type: 'varchar', length: 128 })
  titleEn: string;

  @Column({ type: 'varchar', length: 128 })
  titleAr: string;

  @Field(() => String, { nullable: true, name: 'brief' })
  brief: string | null;

  @Column({ type: 'varchar', length: 256, nullable: true, default: null })
  briefEn: string | null;

  @Column({ type: 'varchar', length: 256, nullable: true, default: null })
  briefAr: string | null;

  @Field()
  @Column({ type: 'varchar', length: 64, unique: true })
  slug: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 256, nullable: true, default: null })
  imageUrl: string | null;

  @Field(() => String)
  @Column({ type: 'enum', enum: BundleDiscountType })
  discountType: BundleDiscountType;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'numeric', nullable: true, default: null })
  flatPriceValue: number | null;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'numeric', nullable: true, default: null })
  discountPercentage: number | null;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'numeric', nullable: true, default: null })
  discountAmountValue: number | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'enum', enum: CurrencyCode, nullable: true, default: null })
  amountCurrencyCode: CurrencyCode | null;

  @Field()
  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Field()
  @Column({ type: 'timestamptz', nullable: false })
  startsAt: Date;

  @Field()
  @Column({ type: 'timestamptz', nullable: false })
  finishesAt: Date;

  @Field(() => [BundleItem])
  @OneToMany(() => BundleItem, (bundleItem) => bundleItem.bundle, {
    cascade: true,
  })
  items: Array<BundleItem>;

  @Exclude()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Exclude()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
