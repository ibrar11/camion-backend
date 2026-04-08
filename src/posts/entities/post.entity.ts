import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Exclude } from 'class-transformer';
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'posts' })
export class Post {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', unique: true, nullable: false })
    uuid: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    slug: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    title: string;

    @Column({ type: 'text', nullable: true })
    brief: string;

    @Column({ type: 'text', nullable: false })
    content: string;

    @Column({ type: 'boolean', default: true, nullable: false })
    enabled: boolean;

    @Column({ type: 'json', nullable: true })
    images: string[];

    @ManyToOne(() => User, { nullable: false })
    author: User;

    @Exclude()
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: false })
    createdAt: Date;

    @Exclude()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: false })
    updatedAt: Date;
}