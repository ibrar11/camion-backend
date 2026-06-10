import { Field, ObjectType } from "@nestjs/graphql";

import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { Exclude } from "class-transformer";

import { Translation } from "./translation.entity";

import { Language } from "../../languages/entities/language.entity";

export class TranslateField {
    @Column({ type: "uuid", nullable: false, unique: true, })
    uuid: string;

    @Column({type: "text"})
    translatedText: string;
}

@ObjectType()
@Entity('translation_items')
export class TranslationItem {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column({ type: "uuid", nullable: false, unique: true, })
    uuid: string;

    @ManyToOne(() => Translation, (translation) => translation.translationItems, { onDelete: "CASCADE", })
    translation: Translation;

    @ManyToOne(() => Language, (language) => language.translationItems, { onDelete: "CASCADE" })
    language: Language;

    @Column({type: "text"})
    translatedProductTitle: string;

    @Column({type: "text"})
    translatedProductBrief: string;

    @Column({type: "text"})
    translatedProductDescription: string;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    translatedProductVariants: TranslateField[];

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    translatedProductOptions: TranslateField[];

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    translatedProductOptionValues: TranslateField[];

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
    translatedCategories: TranslateField[];

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