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

import { Customer } from '../../customers/entities/customer.entity';

@Entity({ name: 'saved_cards' })
export class SavedCard {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', unique: true })
    uuid: string;

    @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
    @Index()
    customer: Customer;

    @Column({ type: 'varchar', length: 64, unique: true })
    tokenId: string; // SkipCash token ID

    @Column({ type: 'varchar', length: 16 })
    cardBrand: string; // visa, mastercard, amex, etc.

    @Column({ type: 'varchar', length: 4 })
    last4: string;

    @Column({ type: 'varchar', length: 5 })
    expiryMonth: string;

    @Column({ type: 'varchar', length: 5 })
    expiryYear: string;

    @Column({ type: 'varchar', length: 32, nullable: true })
    cardholderName: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'boolean', default: false })
    isDefault: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}