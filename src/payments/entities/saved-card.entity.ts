import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Field, ObjectType } from "@nestjs/graphql";

import { Exclude } from 'class-transformer';

import { Customer } from '../../customers/entities/customer.entity';
@ObjectType()
@Entity({ name: 'saved_cards' })
export class SavedCard {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column({ type: 'uuid', unique: true })
    uuid: string;

    @Field(() => Customer)
    @ManyToOne(() => Customer, (customer) => customer.savedCards, { onDelete: 'CASCADE' })
    @Index()
    customer: Customer;

    @Field()
    @Column({ type: 'varchar', length: 64 })
    tokenId: string;

    @Field()
    cardBrand: string; // visa, mastercard, amex, etc.

    @Field()
    last4: string;

    @Field()
    expiryMonth: string;

    @Field()
    expiryYear: string;

    @Field()
    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Field()
    @Column({ type: 'boolean', default: false })
    isDefault: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}