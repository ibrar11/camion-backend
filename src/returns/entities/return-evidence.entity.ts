import { Field, ObjectType } from "@nestjs/graphql";

import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { ReturnRequest } from "./return-request.entity";

@ObjectType()
@Entity({ name: "return_evidence" })
export class ReturnEvidence {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column({ type: "uuid", unique: true })
    uuid: string;

    @Exclude()
    @ManyToOne(() => ReturnRequest, (r) => r.evidence, { onDelete: "CASCADE" })
    returnRequest: ReturnRequest;

    @Field()
    @Column({ type: "varchar" })
    url: string;

    @Field()
    @Column({ type: "varchar" })
    mimeType: string;

    @Field()
    @CreateDateColumn({ type: "timestamptz" })
    createdAt: Date;
}
