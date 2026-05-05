import { Field, ObjectType } from "@nestjs/graphql";

import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { Exclude } from "class-transformer";

import { Product } from "../../inventory/entities/product.entity";
import { TranslationItem } from "./translation-item.entity";

@ObjectType()
@Entity({ name: 'translations', })
export class Translation {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column({ type: "uuid", nullable: false, unique: true, })
    uuid: string;

    @Column()
    entityType: string;

    @Column('uuid')
    entityUuid: string;

    @Column({ default: false })
    completed: boolean;

    @OneToOne(() => Product, (product) => product.translation, { onDelete: "CASCADE", })
    product: Product;

    @OneToMany(() => TranslationItem, (tanslationItem) => tanslationItem.translation, { cascade: true, })
    translationItems: Array<TranslationItem>;

    @Exclude()
    @UpdateDateColumn({
        name: "updated_at",
        type: "timestamptz",
    })
    updatedAt: Date;

    @Exclude()
    @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
    })
    createdAt: Date;
}
