import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

@Entity('refresh_tokens')
export class ClientRefreshToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column()
    clientUuid: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    token: string;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @Column({ default: false })
    revoked: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
