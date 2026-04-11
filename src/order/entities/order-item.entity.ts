import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { Exclude } from "class-transformer";

import { CurrencyCode } from "src/inventory/enums/CurrencyCode";

import { Order } from "./order.entity";

import { Product } from "src/inventory/entities/product.entity";

import { ProductVariant } from "src/inventory/entities/product-variant.entity";

import { Warehouse } from "src/inventory/entities/warehouse.entity";


export class Money {
    @Column({ type: "integer", })
    amount: number;

    @Column({
        type: "enum",
        enum: CurrencyCode,
        default: CurrencyCode.USD,
    })
    currencyCode: CurrencyCode;
}
@Entity('order_items')
export class OrderItem {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "uuid", nullable: false, unique: true, })
    uuid: string;

    @ManyToOne(() => Order, (order) => order.orderItems)
    order: Order;

    @Exclude()
    @ManyToOne(() => Product, (product) => product.orderItems)
    product: Product;

    @Exclude()
    @ManyToOne(() => ProductVariant, (variant) => variant.orderItems)
    variant: ProductVariant;

    @Exclude()
    @ManyToOne(() => Warehouse, (warehouse) => warehouse.orderItems)
    warehouse: Warehouse;

    @Column(() => Money)
    price: Money;

    @Column()
    quantity: number;

    @Column(() => Money)
    total: Money;

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
