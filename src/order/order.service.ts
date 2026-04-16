import * as crypto from "node:crypto";

import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import {
    In,
    Repository
} from 'typeorm';

import { OrderStatus } from "./enums/OrderStatus";

import { CreateOrderDto } from './dtos/CreateOrderDto';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

import { Customer } from 'src/customers/entities/customer.entity';

import { ProductVariant } from 'src/inventory/entities/product-variant.entity';

import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';

import { InventoryLevel } from "src/inventory/entities/inventory-level.entity";

import { CartItem } from "src/cart/entities/cart-items.entity";

import { CustomerAddress } from "src/customers/entities/customer-address.entity";

import { calculateStock } from "src/common/calculateStock";

import {
    calculateCartShipping,
    ShippingCalculationResult
} from "src/common/calculateShipping";

import { getSkipAndTake } from "src/common/pagination";

import {
    OrderPreviewResponse,
} from "./types";

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
        @InjectRepository(CustomerAddress) private readonly addressRepo: Repository<CustomerAddress>,
    ) { }

    /**
     * Creates a new order
     *
     * @param customer
     * @param dto
     * @returns
     */
    async create(customer: Customer, dto: CreateOrderDto): Promise<Order> {
        try {
            // get cart items
            const cartItems = await this.cartRepo.find({
                where: {
                    uuid: In(dto.cartItemUuids),
                    customer: { id: customer.id }
                },
                relations: {
                    product: true,
                    variant: true,
                    customer: true
                }
            });

            if (cartItems.length !== dto.cartItemUuids.length) {
                throw new BadRequestException("Invalid cart items");
            }

            let subTotal = 0;
            const orderItems: OrderItem[] = [];

            for (const cart of cartItems) {
                const variant = cart.variant;

                // get inventory item of the product variant
                const inventoryItem = await this.inventoryRepo.findOne({
                    where: { variant: { id: variant.id } },
                    relations: {
                        levels: {
                            warehouse: true
                        }
                    }
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

                const priceAmount = Number(variant.price.amount);
                const totalAmount = priceAmount * cart.quantity;

                subTotal += totalAmount;

                // create order items
                const orderItem = new OrderItem()
                orderItem.uuid = crypto.randomUUID();
                orderItem.product = cart.product;
                orderItem.variant = variant;
                orderItem.warehouse = level.warehouse;
                orderItem.price = {
                    amount: priceAmount,
                    currencyCode: variant.price.currencyCode,
                };
                orderItem.quantity = cart.quantity;
                orderItem.total = {
                    amount: totalAmount,
                    currencyCode: variant.price.currencyCode,
                };

                await this.orderItemRepo.save(orderItem);

                orderItems.push(orderItem)
            }

            const currency = cartItems[0].variant.price.currencyCode;
            // shipping and discount needs to be updated after the implementation of shippping and discounts
            const shippingCost = 0;
            const discount = 0;
            const total = subTotal + shippingCost - discount;

            // payment service needs to integrated here

            // create a order
            const order = new Order();
            order.uuid = crypto.randomUUID();
            order.customer = customer;
            order.status = OrderStatus.PAYMENT_PENDING;
            order.subTotal = {
                amount: subTotal,
                currencyCode: currency,
            };
            order.shippingCost = {
                amount: shippingCost,
                currencyCode: currency,
            };
            order.discount = {
                amount: discount,
                currencyCode: currency,
            };
            order.total = {
                amount: total,
                currencyCode: currency,
            };
            order.orderItems = orderItems;

            await this.orderRepo.save(order);

            // clear the cart
            await this.cartRepo.delete({
                uuid: In(dto.cartItemUuids)
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
    async findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Order>> {
        try {
            // Get pagination params
            const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

            return this.orderRepo.find({
                relations: {
                    orderItems: true,
                },
                order: {
                    id: "DESC",
                },
                skip: skip,
                take: take,
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
    async findAllByCustomer(customerUuid: string, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Order>> {
        try {

            // Get pagination params
            const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

            return this.orderRepo.find({
                where: {
                    customer: { uuid: customerUuid }
                },
                relations: {
                    orderItems: true,
                },
                order: {
                    id: "DESC",
                },
                skip: skip,
                take: take,
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
                relations: {
                    orderItems: true,
                },
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
                relations: {
                    orderItems: {
                        variant: true,
                        warehouse: true
                    },
                },
            });

            if (!order) {
                throw new NotFoundException('Order not found');
            }

            if (order.status === OrderStatus.CANCELLED) {
                throw new BadRequestException('Already cancelled');
            }

            // Restore inventory
            for (const item of order.orderItems) {
                const inventoryItem = await this.inventoryRepo.findOne({
                    where: {
                        variant: { id: item.variant.id }
                    }
                });

                if (!inventoryItem) continue;

                const level = await this.inventoryLevelRepo.findOne({
                    where: {
                        inventoryItem: { id: inventoryItem.id },
                        warehouse: { id: item.warehouse.id },
                    },
                    relations: {
                        inventoryItem: true,
                        warehouse: true
                    },
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

    /**
    * order preview
    * @param customer
    * @returns
    */
    async orderPreview(customer: Customer): Promise<OrderPreviewResponse> {
        try {
            // Get cart items with relations
            const cartItems = await this.cartRepo.find({
                where: { customer: { id: customer.id } },
                relations: {
                    product: true,
                    variant: {
                        inventoryItem: {
                            levels: true
                        }
                    }
                }
            });

            if (!cartItems || cartItems.length === 0) {
                throw new BadRequestException({
                    error: 'Cart is empty'
                });
            }

            const address = await this.addressRepo.findOne({
                where: {
                    customer: { id: customer.id },
                    isDefault: true,
                },
            });

            if (!address) {
                throw new BadRequestException({
                    error: 'User address cannot be found.'
                });
            }

            // Validate cart items and prepare for shipping calculation
            const validatedItems: CartItem[] = [];
            let subtotal = 0;

            for (const item of cartItems) {
                // Check stock availability
                const stock = calculateStock(item.variant);

                if (stock < item.quantity) {
                    throw new BadRequestException({
                        error: `Insufficient stock for ${item.product.titleEn} - ${item.variant.titleEn}`
                    });
                }

                const itemTotal = item.variant.price.amount * item.quantity;
                subtotal += itemTotal;

                validatedItems.push({
                    ...item
                });
            }

            // Prepare cart items for shipping calculation
            const shippingCartItems = cartItems.map(item => ({
                weight: {
                    amount: item.variant.weight.amount,
                    unit: item.variant.weight.unit,
                },
                quantity: item.quantity,
            }));

            // Calculate shipping fee using utility function
            const shippingCalculation = calculateCartShipping(
                shippingCartItems,
                address.country,
                "USD", // Todo make currency dynamic
                subtotal
            );

            if ('error' in shippingCalculation) {
                throw new BadRequestException({
                    error: shippingCalculation.error
                });
            }

            // Calculate total order amount
            const totalAmount = subtotal + (shippingCalculation as ShippingCalculationResult).totalShippingCost;

            // Return complete order preview
            const orderPreview = {
                cart: validatedItems,
                address,
                cart_total: subtotal,
                shipping: shippingCalculation,
                shippingTotal: (shippingCalculation as ShippingCalculationResult).totalShippingCost,
                grand_total: totalAmount,
            };

            return orderPreview;
        } catch (error: any) {
            this.logger.error(`Error getting order preview: ${error}`);
            throw new InternalServerErrorException({
                error: 'Failed to get order preview',
                details: error,
            });
        }
    }
}
