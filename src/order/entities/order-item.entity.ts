import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { Exclude } from "class-transformer";

import { Order } from "./order.entity";

import { Product } from "src/inventory/entities/product.entity";

import { ProductVariant } from "src/inventory/entities/product-variant.entity";

import { Warehouse } from "src/inventory/entities/warehouse.entity";

@Entity('order_items')
export class OrderItem {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "uuid", nullable: false, unique: true, })
    uuid: string;

    @ManyToOne(() => Order, (order) => order.orderItems)
    order: Order;

    @ManyToOne(() => Product, (product) => product.orderItems)
    product: Product;

    @ManyToOne(() => ProductVariant, (variant) => variant.orderItems)
    variant: ProductVariant;

    @ManyToOne(() => Warehouse, (warehouse) => warehouse.orderItems)
    warehouse: Warehouse;

    @Column()
    productName: string;

    @Column()
    sku: string;

    @Column({ type: 'decimal' })
    price: number;

    @Column()
    quantity: number;

    @Column({ type: 'decimal' })
    total: number;

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
