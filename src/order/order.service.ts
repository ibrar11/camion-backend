import * as crypto from "node:crypto";

import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OrderStatus } from "./enums/OrderStatus";

import { CreateOrderDto } from './dtos/CreateOrderDto';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

import { Customer } from 'src/customers/entities/customer.entity';

import { ProductVariant } from 'src/inventory/entities/product-variant.entity';

import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';

import { InventoryLevel } from "src/inventory/entities/inventory-level.entity";

import { CartItem } from "src/cart/entities/cart-items.entity";

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        @InjectRepository(Order) private orderRepo: Repository<Order>,
        @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
        @InjectRepository(InventoryItem) private inventoryRepo: Repository<InventoryItem>,
        @InjectRepository(InventoryLevel) private inventoryLevelRepo: Repository<InventoryLevel>,
        @InjectRepository(CartItem) private cartRepo: Repository<CartItem>,
    ) { }

    /**
     * Creates a new order
     *
     * @param customer
     * @param dto
     * @returns
     */
    async create(customer: Customer, dto: CreateOrderDto): Promise<Order>{
        try {
            // get cart items
            const cartItems = await this.cartRepo.find({
                where: {
                    customer: { uuid: customer.uuid }
                },
                relations: {
                    product: true,
                    variant: true,
                    customer: true
                }
            });

            if (!cartItems.length) {
                throw new BadRequestException('Cart is empty');
            }

            let subTotal = 0;
            const orderItems: OrderItem[] = [];

            for (const cart of cartItems) {
                const variant = cart.variant;

                // get inventory item of the product variant
                const inventoryItem = await this.inventoryRepo.findOne({
                    where: { variant: { id: variant.id } },
                    relations: { levels: true }
                });

                if (!inventoryItem || !inventoryItem.levels.length) {
                    throw new BadRequestException(`No inventory found for ${variant.sku}`);
                }

                // Find a warehouse with enough stock
                const level = inventoryItem.levels.find(
                    l => l.quantity >= cart.quantity
                );

                if (!level) {
                    throw new BadRequestException(
                        `Insufficient stock for ${variant.sku}`
                    );
                }

                // Deduct
                level.quantity -= cart.quantity;
                await this.inventoryLevelRepo.save(level);

                const price = Number(variant.price);
                const total = price * cart.quantity;

                subTotal += total;

                // create order items
                const orderItem = new OrderItem()
                orderItem.uuid = crypto.randomUUID();
                orderItem.product = cart.product;
                orderItem.variant = variant;
                orderItem.productName = variant.titleEn;
                orderItem.warehouse = level.warehouse;
                orderItem.sku = variant.sku;
                orderItem.price = price;
                orderItem.quantity = cart.quantity;
                orderItem.total = total;

                await this.orderItemRepo.save(orderItem);
            }

            // shipping and discount needs to be updated after the implementation of shippping and discounts
            const shippingCost = 0;
            const discount = 0;
            const total = subTotal + shippingCost - discount;

            // payment service needs to integrated here

            // create a order
            const order = new Order();
            order.uuid = crypto.randomUUID();
            order.customer = customer;
            order.status = OrderStatus.PENDING;
            order.currency = 'USD'; // needs to make currency dynamic
            order.subTotal = subTotal;
            order.shippingCost = shippingCost;
            order.discount = discount;
            order.total = total;
            order.orderItems = orderItems;
            order.customerSnapshot = dto.customerData;

            await this.orderRepo.save(order);

            // clear the cart
            await this.cartRepo.delete({
                customer: { id: customer.id }
            });

            return order;
        } catch (error: any) {
            this.logger.error(`Error placing order: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to place order',
                details: error.message || error,
            });
        }
    }

    /**
     * fetch all orders
     *
     * @returns
     */
    async findAll(): Promise<Array<Order>> {
        try {
            return this.orderRepo.find({
                relations: [
                    'items',
                    'items.product',
                    'items.variant',
                    'customer'
                ],
                order: { createdAt: 'DESC' },
            });
        } catch (error: any) {
            this.logger.error(`Error fetching orders: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to fetch orders',
                details: error.message || error,
            });
        }
    }

    /**
     * fetch all orders of a customer
     * @param customerUuid
     * @returns
     */
    async myOrders(customerUuid: string): Promise<Array<Order>> {
        try {
            return this.orderRepo.find({
                where: {
                    customer: { uuid: customerUuid }
                },
                relations: [
                    'items',
                    'items.product',
                    'items.variant',
                    'customer'
                ],
                order: { createdAt: 'DESC' },
            });
        } catch (error: any) {
            this.logger.error(`Error fetching my orders: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to fetch customer orders',
                details: error.message || error,
            });
        }
    }

    /**
     * fetch a single order
     * @param uuid
     * @returns
     */
    async findOne(uuid: string): Promise<Order> {
        try {
            const order = await this.orderRepo.findOne({
                where: { uuid },
                relations: [
                    'items',
                    'items.product',
                    'items.variant',
                    'customer'
                ],
            });

            if (!order) throw new NotFoundException('Order not found');

            return order;
        } catch (error: any) {
            this.logger.error(`Error fetching order: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to fetch order',
                details: error.message || error,
            });
        }
    }

    /**
     * update order
     * @param uuid
     * @param status
     * @returns
     */
    async updateStatus(uuid: string, status: OrderStatus): Promise<Order> {
        try {
            const order = await this.findOne(uuid);

            order.status = status;

            if (status === 'DELIVERED') {
                order.isPaid = true;
                order.paidAt = new Date();
            }

            return this.orderRepo.save(order);
        } catch (error: any) {
            this.logger.error(`Error updating order status: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to update order status',
                details: error.message || error,
            });
        }
    }

    /**
     * update order
     * @param uuid
     * @returns
     */
    async cancel(uuid: string): Promise<void> {
        try {
            // find the order to cancel
            const order = await this.orderRepo.findOne({
                where: { uuid },
                relations: [
                    'orderItems',
                    'orderItems.variant',
                ],
            });

            if (!order) {
                throw new NotFoundException('Order not found');
            }

            if (order.status === 'CANCELLED') {
                throw new BadRequestException('Already cancelled');
            }

            // Restore inventory
            for (const item of order.orderItems) {
                const inventoryItem = await this.inventoryRepo.findOne({
                    where: { variant: { id: item.variant.id } },
                });

                if (!inventoryItem) continue;

                const level = await this.inventoryLevelRepo.findOne({
                    where: {
                        inventoryItem: { id: inventoryItem.id },
                        warehouse: { id: item.warehouse.id },
                    },
                    relations: ['inventoryItem', 'warehouse'],
                });

                if (!level) continue;

                // Restore stock
                level.quantity += item.quantity;

                await this.inventoryLevelRepo.save(level);
            }

            order.status = OrderStatus.CANCELLED;

            await this.orderRepo.save(order);

        } catch (error: any) {
            this.logger.error(`Error canceling order: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to cancel order',
                details: error.message || error,
            });
        }
    }
}
