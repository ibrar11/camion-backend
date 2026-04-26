import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Field, ObjectType } from '@nestjs/graphql';

import { Exclude } from 'class-transformer';

import { User } from '../../users/entities/user.entity';

@ObjectType()
@Entity({ name: 'posts' })
export class Post {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column({ type: 'uuid', unique: true, nullable: false })
    uuid: string;

    @Field()
    @Column({ type: 'varchar', length: 255, nullable: false })
    slug: string;

    @Field()
    @Column({ type: 'varchar', length: 255, nullable: false })
    title: string;

    @Field(() => String, { nullable: true })
    @Column({ type: 'text', nullable: true })
    brief: string;

    @Field()
    @Column({ type: 'text', nullable: false })
    content: string;

    @Field()
    @Column({ type: 'boolean', default: true, nullable: false })
    enabled: boolean;

    @Field(() => [String], { nullable: true })
    @Column({ type: 'json', nullable: true })
    images: string[];

    @ManyToOne(() => User, { nullable: false })
    @Index()
    createdBy: User;

    @Exclude()
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: false })
    createdAt: Date;

    @Exclude()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: false })
    updatedAt: Date;
}
