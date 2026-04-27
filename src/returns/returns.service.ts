/// <reference types="multer" />
import * as crypto from "node:crypto";

import {
    BadRequestException,
    Injectable,
    Logger,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ReturnRequest } from "./entities/return-request.entity";
import { ReturnEvidence } from "./entities/return-evidence.entity";
import { ReturnStatus } from "./enums/ReturnStatus.enum";

import { CreateReturnRequestDto } from "./dtos/CreateReturnRequestDto";
import { UpdateReturnRequestStatusDto } from "./dtos/UpdateReturnRequestStatusDto";

import { Customer } from "../customers/entities/customer.entity";
import { Order } from "../order/entities/order.entity";
import { OrderItem } from "../order/entities/order-item.entity";
import { OrderStatus } from "../order/enums/OrderStatus";

import { InventoryItem } from "../inventory/entities/inventory-item.entity";
import { InventoryLevel } from "../inventory/entities/inventory-level.entity";

import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/enums/notification-type.enum";
import { NotificationPriority } from "../notifications/enums/notification-priority.enum";

import { S3Service } from "../common/s3.service";
import { getSkipAndTake } from "../common/pagination";

@Injectable()
export class ReturnsService {
    private readonly logger = new Logger(ReturnsService.name);

    constructor(
        @InjectRepository(ReturnRequest) private readonly returnRequestRepository: Repository<ReturnRequest>,
        @InjectRepository(ReturnEvidence) private readonly returnEvidenceRepository: Repository<ReturnEvidence>,
        @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem) private readonly orderItemRepository: Repository<OrderItem>,
        @InjectRepository(InventoryItem) private readonly inventoryItemRepository: Repository<InventoryItem>,
        @InjectRepository(InventoryLevel) private readonly inventoryLevelRepository: Repository<InventoryLevel>,
        private readonly notificationsService: NotificationsService,
        private readonly s3Service: S3Service,
    ) {}

    async createReturnRequest(customer: Customer, dto: CreateReturnRequestDto): Promise<ReturnRequest> {
        try {
            const order = await this.orderRepository.findOne({
                where: {
                    uuid: dto.orderUuid,
                    customer: { id: customer.id },
                },
                relations: { orderItems: true },
            });

            if (!order) {
                throw new NotFoundException({ error: "Order not found" });
            }

            if (order.status !== OrderStatus.DELIVERED) {
                throw new BadRequestException({
                    error: "Returns can only be requested for delivered orders",
                });
            }

            const existing = await this.returnRequestRepository.findOne({
                where: { order: { id: order.id }, customer: { id: customer.id } },
            });

            if (existing) {
                throw new BadRequestException({
                    error: "A return request already exists for this order",
                });
            }

            let orderItem: OrderItem | null = null;
            if (dto.orderItemUuid) {
                orderItem = await this.orderItemRepository.findOne({
                    where: { uuid: dto.orderItemUuid, order: { id: order.id } },
                });

                if (!orderItem) {
                    throw new NotFoundException({ error: "Order item not found" });
                }
            }

            const returnRequest = new ReturnRequest();
            returnRequest.uuid = crypto.randomUUID();
            returnRequest.customer = customer;
            returnRequest.order = order;
            returnRequest.orderItem = orderItem as OrderItem;
            returnRequest.reason = dto.reason;
            returnRequest.reasonDetail = dto.reasonDetail;
            returnRequest.status = ReturnStatus.PENDING;
            returnRequest.refundAmount = orderItem ? orderItem.total : order.total;
            returnRequest.evidence = [];

            await this.returnRequestRepository.save(returnRequest);

            order.status = OrderStatus.RETURN_REQUESTED;
            await this.orderRepository.save(order);

            await this.notificationsService.create({
                customerUUID: customer.uuid,
                type: NotificationType.ORDER_RETURNED,
                title: "Return Request Submitted",
                brief: "Your return request has been submitted and is under review.",
                message: `Your return request for order #${order.uuid} has been submitted. Please upload evidence to support your request. Our team will review it shortly.`,
                payload: { orderUuid: order.uuid, returnRequestUuid: returnRequest.uuid },
                priority: NotificationPriority.HIGH,
            });

            return returnRequest;
        } catch (error: any) {
            this.logger.error(`Error creating return request: ${error}`);
            if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException({
                error: "Failed to create return request",
                details: error?.message,
            });
        }
    }

    async uploadEvidence(returnRequestUuid: string, file: Express.Multer.File): Promise<ReturnEvidence> {
        try {
            const returnRequest = await this.returnRequestRepository.findOne({
                where: { uuid: returnRequestUuid },
            });

            if (!returnRequest) {
                throw new NotFoundException({ error: "Return request not found" });
            }

            if (returnRequest.status !== ReturnStatus.PENDING) {
                throw new BadRequestException({
                    error: "Evidence can only be uploaded for pending return requests",
                });
            }

            const { url } = await this.s3Service.uploadFile("returns", file);

            const evidence = new ReturnEvidence();
            evidence.uuid = crypto.randomUUID();
            evidence.returnRequest = returnRequest;
            evidence.url = url;
            evidence.mimeType = file.mimetype;

            return this.returnEvidenceRepository.save(evidence);
        } catch (error: any) {
            this.logger.error(`Error uploading evidence: ${error}`);
            if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException({
                error: "Failed to upload evidence",
                details: error?.message,
            });
        }
    }

    async findAllByCustomer(customerUuid: string, pageNumber = 1, itemsPerPage = 20, status?: ReturnStatus): Promise<ReturnRequest[]> {
        const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);
        return this.returnRequestRepository.find({
            where: {
                customer: { uuid: customerUuid },
                ...(status ? { status } : {}),
            },
            relations: { order: true, orderItem: true, evidence: true },
            order: { id: "DESC" },
            skip,
            take,
        });
    }

    async findAll(pageNumber = 1, itemsPerPage = 20, status?: ReturnStatus): Promise<ReturnRequest[]> {
        const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);
        return this.returnRequestRepository.find({
            where: status ? { status } : {},
            relations: { order: true, orderItem: true, evidence: true, customer: true },
            order: { id: "DESC" },
            skip,
            take,
        });
    }

    async findOne(uuid: string): Promise<ReturnRequest> {
        const returnRequest = await this.returnRequestRepository.findOne({
            where: { uuid },
            relations: { order: true, orderItem: true, evidence: true },
        });

        if (!returnRequest) {
            throw new NotFoundException({ error: "Return request not found" });
        }

        return returnRequest;
    }

    async updateStatus(uuid: string, dto: UpdateReturnRequestStatusDto): Promise<ReturnRequest> {
        try {
            const returnRequest = await this.returnRequestRepository.findOne({
                where: { uuid },
                relations: {
                    order: {
                        orderItems: {
                            variant: true,
                            warehouse: true,
                        },
                    },
                    orderItem: true,
                    evidence: true,
                    customer: true,
                },
            });

            if (!returnRequest) {
                throw new NotFoundException({ error: "Return request not found" });
            }

            if (returnRequest.status !== ReturnStatus.PENDING) {
                throw new BadRequestException({
                    error: "Only pending return requests can be updated",
                });
            }

            if (dto.status === ReturnStatus.APPROVED) {
                if (!returnRequest.evidence || returnRequest.evidence.length === 0) {
                    throw new BadRequestException({
                        error: "Cannot approve a return request without evidence",
                    });
                }

                // Restore inventory for the returned items
                const itemsToRestore = returnRequest.orderItem
                    ? [returnRequest.orderItem]
                    : returnRequest.order.orderItems;

                for (const item of itemsToRestore) {
                    const inventoryItem = await this.inventoryItemRepository.findOne({
                        where: { variant: { id: item.variant.id } },
                    });

                    if (!inventoryItem) continue;

                    const level = await this.inventoryLevelRepository.findOne({
                        where: {
                            inventoryItem: { id: inventoryItem.id },
                            warehouse: { id: item.warehouse.id },
                        },
                        relations: { inventoryItem: true, warehouse: true },
                    });

                    if (!level) continue;

                    level.quantity += item.quantity;
                    await this.inventoryLevelRepository.save(level);
                }

                returnRequest.status = ReturnStatus.APPROVED;
                returnRequest.adminNote = dto.adminNote ?? null;
                returnRequest.order.status = OrderStatus.RETURNED;
                await this.orderRepository.save(returnRequest.order);

                await this.notificationsService.create({
                    customerUUID: returnRequest.customer.uuid,
                    type: NotificationType.ORDER_REFUNDED,
                    title: "Return Approved",
                    brief: "Your return request has been approved.",
                    message: `Your return request for order #${returnRequest.order.uuid} has been approved. A refund of ${returnRequest.refundAmount.amount} ${returnRequest.refundAmount.currencyCode.toUpperCase()} will be processed shortly.`,
                    payload: { orderUuid: returnRequest.order.uuid, returnRequestUuid: returnRequest.uuid },
                    priority: NotificationPriority.HIGH,
                });

                await this.notificationsService.create({
                    customerUUID: returnRequest.customer.uuid,
                    type: NotificationType.PAYMENT_REFUND_INITIATED,
                    title: "Refund Initiated",
                    brief: "Your refund has been initiated.",
                    message: `A refund of ${returnRequest.refundAmount.amount} ${returnRequest.refundAmount.currencyCode.toUpperCase()} has been initiated for order #${returnRequest.order.uuid}.`,
                    payload: { orderUuid: returnRequest.order.uuid, returnRequestUuid: returnRequest.uuid },
                    priority: NotificationPriority.HIGH,
                });
            } else if (dto.status === ReturnStatus.REJECTED) {
                returnRequest.status = ReturnStatus.REJECTED;
                returnRequest.adminNote = dto.adminNote ?? null;
                returnRequest.order.status = OrderStatus.DELIVERED;
                await this.orderRepository.save(returnRequest.order);

                await this.notificationsService.create({
                    customerUUID: returnRequest.customer.uuid,
                    type: NotificationType.ORDER_RETURNED,
                    title: "Return Request Rejected",
                    brief: "Your return request has been rejected.",
                    message: `Your return request for order #${returnRequest.order.uuid} has been rejected.${dto.adminNote ? ` Reason: ${dto.adminNote}` : ""}`,
                    payload: { orderUuid: returnRequest.order.uuid, returnRequestUuid: returnRequest.uuid },
                    priority: NotificationPriority.HIGH,
                });
            } else {
                throw new BadRequestException({
                    error: "Status can only be updated to approved or rejected",
                });
            }

            return this.returnRequestRepository.save(returnRequest);
        } catch (error: any) {
            this.logger.error(`Error updating return request status: ${error}`);
            if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException({
                error: "Failed to update return request status",
                details: error?.message,
            });
        }
    }
}
