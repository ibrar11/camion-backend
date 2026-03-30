import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { ClientStatus } from '../enums/client-status';

@Entity({ name: 'clients' })
export class Client {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', unique: true })
    uuid: string;

    @Column({ type: 'varchar', length: 128, nullable: false })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    homepage?: string;

    @Exclude()
    @Column({ type: 'varchar', length: 255 })
    secret: string;

    @Column({
    type: 'enum',
    enum: ClientStatus,
    default: ClientStatus.ACTIVE,
    })
    status!: ClientStatus;

    @Exclude()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    @Exclude()
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
