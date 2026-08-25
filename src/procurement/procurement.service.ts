import { length } from 'class-validator';
import {
    Injectable,
    Logger,
    BadRequestException,
    InternalServerErrorException,
    NotFoundException,
    Inject,
} from '@nestjs/common';
import { Job } from 'bullmq';
import * as crypto from 'node:crypto';

import { generateSlug } from '../common/slug';
import { fetchImageAsFile } from '../common/fetchImage';
import { smartRoundInt } from '../common/smartRound';
import { extractFormattedText } from '../common/extractFormattedText';

import { CurrencyCode } from 'src/inventory/enums/CurrencyCode.enum';
import { WeightUnit } from 'src/inventory/enums/WeightUnit.enum';
import { DimensionsUnit } from 'src/inventory/enums/DimensionsUnit.enum';

import { ImportProductDto } from './dtos/ImportProductDto';
import { CreateHiobuyOrderDto } from './dtos/CreateHiobuyOrderDto';

import { CreateProductVariantDto } from '../inventory/dtos/CreateProductVariantDto';
import { SaveProcurementToStoreDto, SaveProcurementToStoreItemDto } from './dtos/SaveProcurementToStoreDto';

import { Product } from '../inventory/entities/product.entity';
import { ProductsService } from '../inventory/products.service';

import { ProductVariantService } from '../inventory/product-variant.service';

import { ProductOptionService } from '../inventory/product-option.service';

import { ProductOptionValueService } from '../inventory/product-option-value.service';

import { ProductVariantImageService } from '../inventory/product-variant-image.service';

import {
    ProductAttribute,
    ProductDetail,
    ProductSku,
    ProductVariant as ProcurementProductVariant,
    SearchProductItem,
    SearchProducts,
    SkuAttribute,
    importedProduct,
    CreateOrderResponse,
    BulkCreateOrderResponse,
    PreviewOrderResponse,
    SearchProduct,
} from './types';
import { ProductStatus } from 'src/inventory/enums/ProductStatus.enum';

import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, DataSource, Repository } from 'typeorm';

import { Order } from '../order/entities/order.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { ProductVariant } from '../inventory/entities/product-variant.entity';

import { CreateProcurementOrderDto, OrderAddressDto, OrderSkuDto } from './dtos/CreateProcurementOrderDto';
import { BulkCreateProcurementOrderDto } from './dtos/BulkCreateProcurementOrderDto';
import { PreviewOrderDto, PreviewOrderAddressDto, PreviewOrderSkuDto } from './dtos/PreviewOrderDto';
import { ResyncInventoryVariantsDto } from './dtos/ResyncInventoryVariantsDto';
import { QueueService } from 'src/queue/queue.service';
import { QueueName } from 'src/queue/enums/QueueTypes.enum';
import { InventoryResyncJobData, SkuMetaImportJobData } from 'src/queue/types';

import { ConfigService } from '@nestjs/config';

import { TranslationJobRegistryService } from '../translation/translation-job-registry.service';
import { moneyFromFloat } from 'src/common/currency';


@Injectable()
export class ProcurementService {
    private readonly logger = new Logger(ProcurementService.name);

    constructor(
        private readonly configService: ConfigService,
        @Inject(ProductsService) private readonly productService: ProductsService,
        @Inject(ProductVariantService) private readonly variantService: ProductVariantService,
        @Inject(ProductOptionService) private readonly optionService: ProductOptionService,
        @Inject(ProductOptionValueService) private readonly optionValueService: ProductOptionValueService,
        @Inject(ProductVariantImageService) private readonly variantImageService: ProductVariantImageService,
        @Inject(QueueService) private readonly queueService: QueueService,
        @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
        @InjectRepository(Warehouse) private readonly warehouseRepository: Repository<Warehouse>,
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductVariant) private readonly productVariantRepository: Repository<ProductVariant>,
        @Inject(TranslationJobRegistryService) private readonly jobRegistry: TranslationJobRegistryService,
    ) { }

    private isSameObject(a: unknown, b: unknown): boolean {
        return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    }

    private toFiniteNumberOrFallback(value: unknown, fallback: number): number {
        const parsed = typeof value === "number" ? value : Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    private chunkArray<T>(items: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < items.length; i += chunkSize) {
            chunks.push(items.slice(i, i + chunkSize));
        }
        return chunks;
    }

    async enqueueInventoryVariantsResync(body: ResyncInventoryVariantsDto): Promise<{
        jobId: string;
        status: "queued";
        scope: "all" | "selected";
        productsCount: number;
    }> {
        const scope = body.scope ?? "selected";

        if (scope === "all") {
            if (body.productUuids?.length) {
                throw new BadRequestException({
                    message: "productUuids is not allowed when scope is all",
                });
            }

            const products = await this.productRepository.find({
                select: { uuid: true },
                where: { procurementId: Not(IsNull()) },
            });
            const productUuids = products.map((p) => p.uuid);
            if (!productUuids.length) {
                throw new BadRequestException({
                    message: "No products with procurementId found for resync",
                });
            }

            const queued = await this.queueService.addInventoryResyncJob(productUuids);
            return { ...queued, scope, productsCount: productUuids.length };
        }

        const productUuids = body.productUuids ?? [];
        if (!productUuids.length) {
            throw new BadRequestException({
                message: "productUuids must be a non-empty array when scope is selected",
            });
        }

        const queued = await this.queueService.addInventoryResyncJob(productUuids);
        return { ...queued, scope, productsCount: productUuids.length };
    }

    async getInventoryVariantsResyncJob(jobId: string): Promise<{
        jobId: string;
        status: "queued" | "active" | "completed" | "failed" | "not_found";
        progress?: string | number | boolean | object;
        result?: any;
        failedReason?: string | null;
    }> {
        const job = await this.queueService.getJob(QueueName.INVENTORY_RESYNC, jobId) as Job<InventoryResyncJobData> | null;
        if (!job) {
            return { jobId, status: "not_found" };
        }

        const state = await job.getState();
        const statusMap: Record<string, "queued" | "active" | "completed" | "failed"> = {
            waiting: "queued",
            delayed: "queued",
            paused: "queued",
            active: "active",
            completed: "completed",
            failed: "failed",
        };

        return {
            jobId,
            status: statusMap[state] ?? "queued",
            progress: job.progress,
            result: job.returnvalue,
            failedReason: job.failedReason ?? null,
        };
    }

    async enqueueSkuMetaImport(): Promise<{
        totalProducts: number;
        totalJobs: number;
        singleJobProducts: number;
        batchedJobProducts: number;
        jobs: Array<{
            jobId: string;
            status: "queued";
            productUuids: string[];
            productsCount: number;
        }>;
    }> {
        const products = await this.findProductsWithMissingSkuMetaCounts();

        if (!products.length) {
            throw new BadRequestException({
                message: "No products with missing skuMeta were found",
            });
        }

        const largeProducts: string[] = [];
        const normalProducts: string[] = [];

        for (const product of products) {
            if (product.totalVariants > 50) {
                largeProducts.push(product.uuid);
                continue;
            }

            normalProducts.push(product.uuid);
        }

        const jobs: Array<{
            jobId: string;
            status: "queued";
            productUuids: string[];
            productsCount: number;
        }> = [];

        for (const productUuid of largeProducts) {
            const queued = await this.queueService.addSkuMetaImportJob([productUuid]);
            jobs.push({
                ...queued,
                productUuids: [productUuid],
                productsCount: 1,
            });
        }

        for (const batch of this.chunkArray(normalProducts, 10)) {
            const queued = await this.queueService.addSkuMetaImportJob(batch);
            jobs.push({
                ...queued,
                productUuids: batch,
                productsCount: batch.length,
            });
        }

        return {
            totalProducts: products.length,
            totalJobs: jobs.length,
            singleJobProducts: largeProducts.length,
            batchedJobProducts: normalProducts.length,
            jobs,
        };
    }

    async getSkuMetaImportJob(jobId: string): Promise<{
        jobId: string;
        status: "queued" | "active" | "completed" | "failed" | "not_found";
        progress?: string | number | boolean | object;
        result?: any;
        failedReason?: string | null;
    }> {
        const job = await this.queueService.getJob(
            QueueName.SKU_META_IMPORT,
            jobId
        ) as Job<SkuMetaImportJobData> | null;

        if (!job) {
            return { jobId, status: "not_found" };
        }

        const state = await job.getState();
        const statusMap: Record<string, "queued" | "active" | "completed" | "failed"> = {
            waiting: "queued",
            delayed: "queued",
            paused: "queued",
            active: "active",
            completed: "completed",
            failed: "failed",
        };

        return {
            jobId,
            status: statusMap[state] ?? "queued",
            progress: job.progress,
            result: job.returnvalue,
            failedReason: job.failedReason ?? null,
        };
    }

    private async findProductsWithMissingSkuMetaCounts(): Promise<Array<{
        uuid: string;
        totalVariants: number;
        missingSkuVariants: number;
    }>> {
        const products = await this.productRepository
            .createQueryBuilder("product")
            .leftJoin("product.variants", "variant")
            .select("product.uuid", "uuid")
            .addSelect("COUNT(variant.id)", "totalVariants")
            .addSelect(
                "SUM(CASE WHEN variant.skuMeta IS NULL THEN 1 ELSE 0 END)",
                "missingSkuVariants",
            )
            .groupBy("product.id")
            .addGroupBy("product.uuid")
            .having("SUM(CASE WHEN variant.skuMeta IS NULL THEN 1 ELSE 0 END) > 0")
            .getRawMany<{
                uuid: string;
                totalVariants: string;
                missingSkuVariants: string;
            }>();

        return products.map((product) => ({
            uuid: product.uuid,
            totalVariants: Number(product.totalVariants ?? 0),
            missingSkuVariants: Number(product.missingSkuVariants ?? 0),
        }));
    }

    private normalizeLookupText(value: unknown): string {
        return String(value ?? "").trim().toLowerCase();
    }

    private getErrorReason(error: unknown): string {
        if (!error) {
            return "Unknown error";
        }

        const anyError = error as any;
        const response = anyError?.response ?? anyError?.getResponse?.();
        if (response) {
            if (typeof response === "string") {
                return response;
            }

            if (typeof response === "object") {
                const reason =
                    response.message ??
                    response.error ??
                    response.msg ??
                    anyError?.message ??
                    "Unknown error";

                if (Array.isArray(reason)) {
                    return reason.join(", ");
                }

                return (
                    String(reason)
                );
            }
        }

        return anyError?.message ?? String(error);
    }

    private isProcurementNotFoundError(error: unknown): boolean {
        const reason = this.getErrorReason(error).toLowerCase();
        return (
            reason.includes("product not found") ||
            reason.includes("not found with that procurement id") ||
            (reason.includes("not found") && reason.includes("gulltrans")) ||
            (reason.includes("not found") && reason.includes("gultans"))
        );
    }

    private async fetchProcurementProductDetailWithRetry(productId: string): Promise<
        | { status: "success"; product: ProductDetail }
        | { status: "not_found"; reason: string }
        | { status: "failed"; reason: string }
    > {
        const maxAttempts = 3;
        let lastReason = "Unknown error";

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                const product = await this.getProductDetail(productId);
                return { status: "success", product };
            } catch (error) {
                const reason = this.getErrorReason(error);
                lastReason = reason;

                if (this.isProcurementNotFoundError(error)) {
                    return { status: "not_found", reason };
                }

                if (attempt < maxAttempts) {
                    this.logger.warn(
                        `Retrying procurement lookup for ${productId} after attempt ${attempt} failed: ${reason}`,
                    );
                    continue;
                }
            }
        }

        return { status: "failed", reason: lastReason };
    }

    private async getActiveWarehouse(): Promise<Warehouse> {
        const warehouse = await this.warehouseRepository.findOne({ where: { isActive: true } });
        if (!warehouse) {
            throw new BadRequestException({
                message: "No active warehouse found for procurement resync",
            });
        }
        return warehouse;
    }

    private getMatchingOptionValueUUIDs(product: Product, sourceVariant: ProcurementProductVariant): string[] {
        const optionValueUUIDs: string[] = [];
        const seen = new Set<string>();
        const options = product.options ?? [];

        for (const sourceAttribute of sourceVariant.attributes ?? []) {
            const sourceName = this.normalizeLookupText(
                sourceAttribute.name,
            );
            const sourceValue = this.normalizeLookupText(
                sourceAttribute.value,
            );

            const matchedOption = options.find((option) => {
                return (
                    this.normalizeLookupText(option.nameEn) === sourceName ||
                    this.normalizeLookupText(option.nameAr) === sourceName
                );
            });

            if (!matchedOption) {
                continue;
            }

            const matchedValue = matchedOption.values?.find((optionValue) => {
                return (
                    this.normalizeLookupText(optionValue.valueEn) === sourceValue ||
                    this.normalizeLookupText(optionValue.valueAr) === sourceValue ||
                    this.normalizeLookupText(optionValue.value) === sourceValue
                );
            });

            if (!matchedValue || seen.has(matchedValue.uuid)) {
                continue;
            }

            seen.add(matchedValue.uuid);
            optionValueUUIDs.push(matchedValue.uuid);
        }

        return optionValueUUIDs;
    }

    private async createMissingVariantFromSource(
        product: Product,
        sourceProduct: ProductDetail,
        sourceVariant: ProcurementProductVariant,
    ): Promise<ProductVariant> {
        const warehouse = await this.getActiveWarehouse();
        const sku = String(sourceVariant.skuId);
        const title = (sourceVariant.title || sku).trim().slice(0, 128);
        const optionValues = this.getMatchingOptionValueUUIDs(product, sourceVariant);

        const dto: CreateProductVariantDto = {
            warehouse: warehouse.uuid,
            title: {
                en: title,
                ar: title,
            },
            sku,
            barcode: sku,
            quantity: sourceVariant.stock || 0,
            cost: {
                amount: smartRoundInt(sourceVariant.price) || 0,
                minorAmount: 0,
                currencyCode: sourceProduct.currencyCode,
            },
            weight: {
                amount: smartRoundInt(sourceVariant.shipping?.weight || 0) || 0,
                unit: WeightUnit.Kilograms,
            },
            dimensions: {
                width: smartRoundInt(sourceVariant.shipping?.width || 0) || 0,
                height: smartRoundInt(sourceVariant.shipping?.height || 0) || 0,
                length: smartRoundInt(sourceVariant.shipping?.length || 0) || 0,
                unit: DimensionsUnit.Centimeter,
            },
            optionValues,
            skuMeta: sourceVariant.skuMeta ?? undefined,
        };

        const createdVariant = await this.variantService.createProductVariantForProduct(
            product.uuid,
            dto,
            false,
        );

        if (sourceVariant.image) {
            try {
                const imageFile = await fetchImageAsFile(sourceVariant.image);
                await this.variantImageService.createProductVariantImage(createdVariant.uuid, imageFile);
            } catch (error) {
                this.logger.warn(
                    `Failed to attach procurement image for new variant ${createdVariant.uuid} on product ${product.uuid}: ${(error as Error)?.message ?? error}`,
                );
            }
        }

        return createdVariant;
    }

    async resyncInventoryVariantsByProducts(productUuids: string[]): Promise<{
        productsRequested: number;
        productsFound: number;
        productsWithProcurementId: number;
        productsFailed: number;
        productsArchived: number;
        failedProducts: Array<{
            productUuid: string;
            procurementId: string | null;
            error: string;
        }>;
        variantsMatched: number;
        variantsUpdated: number;
        variantsCreated: number;
        variantsMissingInSource: number;
        productsSkippedWithoutProcurementId: string[];
    }> {
        const productsSkippedWithoutProcurementId: string[] = [];
        const failedProducts: Array<{
            productUuid: string;
            procurementId: string | null;
            error: string;
        }> = [];
        let productsFound = 0;
        let productsFailed = 0;
        let productsArchived = 0;
        let variantsMatched = 0;
        let variantsUpdated = 0;
        let variantsCreated = 0;
        let variantsMissingInSource = 0;
        let productsWithProcurementId = 0;

        const productUuidChunks = this.chunkArray(productUuids, 200);
        for (const productUuidChunk of productUuidChunks) {
            const products = await this.productRepository.find({
                where: { uuid: In(productUuidChunk) },
                relations: {
                    variants: true,
                    options: {
                        values: true,
                    },
                },
            });
            productsFound += products.length;

            for (const product of products) {
                if (!product.procurementId) {
                    productsSkippedWithoutProcurementId.push(product.uuid);
                    continue;
                }

                try {
                    productsWithProcurementId += 1;
                    const procurementLookup = await this.fetchProcurementProductDetailWithRetry(product.procurementId);

                    if (procurementLookup.status === "not_found") {
                        product.status = ProductStatus.ARCHIVED;
                        await this.productRepository.save(product);
                        productsArchived += 1;
                        this.logger.warn(
                            `Archived product ${product.uuid} because procurement id ${product.procurementId} was not found: ${procurementLookup.reason}`,
                        );
                        continue;
                    }

                    if (procurementLookup.status === "failed") {
                        throw new Error(procurementLookup.reason);
                    }

                    const sourceProduct = procurementLookup.product;
                    const sourceBySku = new Map<string, ProcurementProductVariant>();

                    for (const sourceVariant of sourceProduct.variants ?? []) {
                        sourceBySku.set(String(sourceVariant.skuId), sourceVariant);
                    }

                    for (const localVariant of product.variants ?? []) {
                        const sourceVariant = sourceBySku.get(localVariant.sku);
                        if (!sourceVariant) {
                            variantsMissingInSource += 1;
                            continue;
                        }

                        variantsMatched += 1;
                        let changed = false;
                        const nextWeightAmount = this.toFiniteNumberOrFallback(
                            sourceVariant.shipping?.weight,
                            localVariant.weight.amount,
                        );
                        const nextWidth = this.toFiniteNumberOrFallback(
                            sourceVariant.shipping?.width,
                            localVariant.dimensions.width,
                        );
                        const nextHeight = this.toFiniteNumberOrFallback(
                            sourceVariant.shipping?.height,
                            localVariant.dimensions.height,
                        );
                        const nextLength = this.toFiniteNumberOrFallback(
                            sourceVariant.shipping?.length,
                            localVariant.dimensions.length,
                        );

                        const nextTitleEn = (sourceVariant.title || "").slice(0, 128);
                        if (localVariant.titleEn !== nextTitleEn) {
                            localVariant.titleEn = nextTitleEn;
                            changed = true;
                        }

                        if (localVariant.weight.amount !== nextWeightAmount) {
                            localVariant.weight.amount = nextWeightAmount;
                            changed = true;
                        }
                        if (localVariant.weight.unit !== WeightUnit.Kilograms) {
                            localVariant.weight.unit = WeightUnit.Kilograms;
                            changed = true;
                        }

                        if (localVariant.dimensions.width !== nextWidth) {
                            localVariant.dimensions.width = nextWidth;
                            changed = true;
                        }
                        if (localVariant.dimensions.height !== nextHeight) {
                            localVariant.dimensions.height = nextHeight;
                            changed = true;
                        }
                        if (localVariant.dimensions.length !== nextLength) {
                            localVariant.dimensions.length = nextLength;
                            changed = true;
                        }
                        if (localVariant.dimensions.unit !== DimensionsUnit.Centimeter) {
                            localVariant.dimensions.unit = DimensionsUnit.Centimeter;
                            changed = true;
                        }

                        if (!this.isSameObject(localVariant.skuMeta, sourceVariant.skuMeta)) {
                            localVariant.skuMeta = sourceVariant.skuMeta as Record<string, any>;
                            changed = true;
                        }

                        if (changed) {
                            await this.productVariantRepository.save(localVariant);
                            variantsUpdated += 1;
                        }
                    }

                    for (const sourceVariant of sourceProduct.variants ?? []) {
                        const localVariant = (product.variants ?? []).find((variant) => variant.sku === String(sourceVariant.skuId));
                        if (localVariant) {
                            continue;
                        }

                        await this.createMissingVariantFromSource(product, sourceProduct, sourceVariant);
                        variantsCreated += 1;
                    }
                } catch (error) {
                    productsFailed += 1;
                    failedProducts.push({
                        productUuid: product.uuid,
                        procurementId: product.procurementId ?? null,
                        error: (error as Error)?.message ?? "Unknown error",
                    });
                    this.logger.error(
                        `Failed inventory resync for product ${product.uuid} (procurementId=${product.procurementId}): ${(error as Error).message}`,
                    );
                }
            }
        }

        return {
            productsRequested: productUuids.length,
            productsFound,
            productsWithProcurementId,
            productsFailed,
            productsArchived,
            failedProducts,
            variantsMatched,
            variantsUpdated,
            variantsCreated,
            variantsMissingInSource,
            productsSkippedWithoutProcurementId,
        };
    }

    async importSkuMetaByProducts(productUuids: string[] = []): Promise<{
        productsRequested: number;
        productsFound: number;
        productsWithProcurementId: number;
        productsFailed: number;
        failedProducts: Array<{ productUuid: string; procurementId: string | null; error: string }>;
        variantsMatched: number;
        variantsUpdated: number;
        variantsMissingInSource: number;
        productsSkippedWithoutProcurementId: string[];
    }> {
        this.logger.log(`Importing skuMeta from procurement API`);

        const uniqueProductUuids = [...new Set(productUuids)];
        const productUuidChunks = this.chunkArray(uniqueProductUuids, 200);

        let productsFound = 0;
        let productsWithProcurementId = 0;
        let productsFailed = 0;
        let variantsMatched = 0;
        let variantsUpdated = 0;
        let variantsMissingInSource = 0;
        const productsSkippedWithoutProcurementId: string[] = [];
        const failedProducts: Array<{ productUuid: string; procurementId: string | null; error: string }> = [];

        for (const productUuidChunk of productUuidChunks) {
            const products = await this.productRepository.find({
                where: { uuid: In(productUuidChunk) },
                relations: {
                    variants: true,
                },
            });
            productsFound += products.length;

            for (const product of products) {
                if (!product.procurementId) {
                    productsSkippedWithoutProcurementId.push(product.uuid);
                    continue;
                }

                try {
                    productsWithProcurementId += 1;
                    const sourceProduct = await this.getProductDetail(product.procurementId);
                    const sourceBySku = new Map<string, ProcurementProductVariant>();

                    for (const sourceVariant of sourceProduct.variants ?? []) {
                        sourceBySku.set(String(sourceVariant.skuId), sourceVariant);
                    }

                    for (const localVariant of product.variants ?? []) {
                        const sourceVariant = sourceBySku.get(localVariant.sku);
                        if (!sourceVariant) {
                            variantsMissingInSource += 1;
                            continue;
                        }

                        variantsMatched += 1;
                        if (!this.isSameObject(localVariant.skuMeta, sourceVariant.skuMeta)) {
                            localVariant.skuMeta = sourceVariant.skuMeta as Record<string, any>;
                            await this.productVariantRepository.save(localVariant);
                            variantsUpdated += 1;
                        }
                    }
                } catch (error) {
                    productsFailed += 1;
                    failedProducts.push({
                        productUuid: product.uuid,
                        procurementId: product.procurementId ?? null,
                        error: (error as Error)?.message ?? "Unknown error",
                    });
                    this.logger.error(
                        `Failed skuMeta import for product ${product.uuid} (procurementId=${product.procurementId}): ${(error as Error).message}`,
                    );
                }
            }
        }

        return {
            productsRequested: uniqueProductUuids.length,
            productsFound,
            productsWithProcurementId,
            productsFailed,
            failedProducts,
            variantsMatched,
            variantsUpdated,
            variantsMissingInSource,
            productsSkippedWithoutProcurementId,
        };
    }

    private async getActiveWarehouseGulltransIds(): Promise<{ warehouseId: string; userId: string }> {
        const warehouse = await this.warehouseRepository.findOne({ where: { isActive: true } });
        return {
            warehouseId: warehouse?.gulltransWarehouseId ?? '',
            userId: warehouse?.gulltransUserId ?? '',
        };
    }

    /**
     * Builds the Gulltrans ship-to address for the active warehouse — goods are shipped from the
     * 1688 supplier to Camion's own warehouse, not to the end customer. Single source of truth for
     * this address, used by both the order-preview and order-create Gulltrans calls.
     *
     * @returns
     */
    async getWarehouseAddress(): Promise<OrderAddressDto> {
        const warehouse = await this.warehouseRepository.findOne({ where: { isActive: true } });
        if (!warehouse) {
            throw new NotFoundException({ error: 'No active warehouse found' });
        }

        return {
            receiver_name: warehouse.contactName ?? '',
            phone: warehouse.phone ?? '',
            address: [warehouse.addressLine1, warehouse.addressLine2].filter(Boolean).join(', '),
            city: warehouse.city,
            province: warehouse.state,
            district: warehouse.district ?? '',
            postcode: warehouse.postcode ?? '',
            company: warehouse.name,
            country_name: warehouse.country,
            country: { country_code: warehouse.countryCode ?? '', name: warehouse.country },
        };
    }

    /**
     * Maps the full Gulltrans order address to the narrower shape the preview-order endpoint expects.
     *
     * @param address
     * @returns
     */
    private toPreviewAddress(address: OrderAddressDto): PreviewOrderAddressDto {
        return {
            receiver_name: address.receiver_name,
            postcode: address.postcode ?? '',
            province: address.province,
            city: address.city,
            district: address.district ?? '',
            street: address.street,
            address: address.address,
            phone: address.phone,
        };
    }

    /**
     * Maps create-order SKUs to the shape the preview-order endpoint expects.
     *
     * @param skus
     * @returns
     */
    private toPreviewSkus(skus: OrderSkuDto[]): PreviewOrderSkuDto[] {
        return skus.map((sku) => ({
            goods_id: sku.goods_id,
            sku_id: sku.platform_sku,
            sum: sku.quantity,
            spec_id: sku.sku_info?.spec_id || '0',
        }));
    }

    /**
     * Previews a Gulltrans order to fetch its real shipping (freight) cost before creating it.
     *
     * @param dto
     * @returns
     */
    async previewOrder(dto: PreviewOrderDto): Promise<PreviewOrderResponse> {
        try {
            const response = await fetch(
                `${process.env.GULLTRANS_BASE_URL}/api/client/third-purchase/preview-order`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: process.env.GULLTRANS_AUTHORIZATION || '',
                        'X-Uuid': process.env.GULLTRANS_UUID || '',
                        'Content-Type': 'application/json',
                        Language: 'en',
                    },
                    body: JSON.stringify(dto),
                },
            );

            const data = await response.json();

            if (data.ret !== 1) {
                this.logger.error(`Gulltrans: order preview failed — ${data.msg}`);
                throw new BadRequestException({
                    error: data.msg,
                });
            }

            return {
                goodsFee: data?.data?.goodsFee,
                paymentFee: data?.data?.paymentFee,
                freightFee: data?.data?.freightFee,
                isFree: data?.data?.isFree,
            };
        } catch (error: any) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            this.logger.error(`Gulltrans: order preview threw — ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to preview order shipping cost',
                details: error.response?.error || error.message,
            });
        }
    }

    private async markGulltransOrderCreated(orderUuid: string | undefined, gulltransOrderSn: string) {
        if (!orderUuid) return;
        await this.orderRepository
            .createQueryBuilder()
            .update()
            .set({ gulltransOrderSns: () => "array_append(COALESCE(gulltrans_order_sns, '{}'), :sn)" })
            .setParameter('sn', gulltransOrderSn)
            .where('uuid = :uuid', { uuid: orderUuid })
            .execute();
    }

    /**
     * Finds a list of products with specific keyword
     *
     * @param dto
     * @returns
     */
    async searchProduct(
        keyword: string,
        page: string = '1',
        pageSize: string = '20',
        sort: string,
        priceStart: string = '',
        priceEnd: string = ''
    ): Promise<SearchProducts> {
        try {
            if (Number(pageSize) > 50) {
                throw new BadRequestException({
                    message: "Page size should not be greater than 50"
                });
            }
            // Get the product list from 1688
            const response = await fetch(
                `${process.env.GULLTRANS_BASE_URL}/api/client/third-purchase/search`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: process.env.GULLTRANS_AUTHORIZATION || '',
                        'X-Uuid': process.env.GULLTRANS_UUID || '',
                        'Content-Type': 'application/json',
                        Language: 'en',
                    },
                    body: JSON.stringify({
                        keyword: keyword,
                        platform: '1688',
                        use_platform: "1",
                        page: page,
                        page_size: pageSize,
                        sort: sort,
                        priceStart: priceStart,
                        priceEnd: priceEnd,
                    }),
                },
            );

            const data = await response.json();

            if (data.ret !== 1) {
                throw new BadRequestException({
                    error: data.msg,
                });
            }

            const products: SearchProductItem[] = data?.data?.data || [];

            const totalProducts = data?.data?.totalRecords;
            const page_size = data?.data?.pageSize;
            const currentPage = data?.data?.currentPage;
            const excludeLastPage = (totalProducts % page_size) === 0;
            const totalPage = excludeLastPage ? data?.data?.totalPage - 1 : data?.data?.totalPage;

            // Format the products
            const formattedProducts: Array<SearchProduct> = products?.map((item) => ({
                externalId: item.offerId,
                title: (item.subjectTrans || item.subject).slice(0, 128),
                price: parseFloat(
                    item.priceInfo?.promotionPrice ||
                    item.priceInfo?.price ||
                    '0'
                ),
                originalPrice: parseFloat(item.priceInfo?.price || '0'),
                image: item.imageUrl,
                productUrl: item.promotionURL,
                monthlySales: item.monthSold,
                rating: parseFloat(item.tradeScore || '0'),
                minOrderQuantity: item.minOrderQuantity,
                isDropshipping: item.isOnePsale,
                supplierType: item.sellerIdentities?.[0] || null,
                category: {
                    level1: item.topCategoryId,
                    level2: item.secondCategoryId,
                    level3: item.thirdCategoryId,
                },
                createdAt: item.createDate,
                updatedAt: item.modifyDate
            }));

            return {
                data: formattedProducts,
                pagination: {
                    totalProducts: totalProducts,
                    totalPage: totalPage,
                    page_size: page_size,
                    currentPage: currentPage,
                }
            };
        } catch (error: any) {
            this.logger.error(`Error fetching products: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to fetch products',
                details: error.response?.error || error.message,
            });
        }
    }

    /**
     * Finds a product details
     *
     * @param productId
     * @returns
     */
    async getProductDetail(productId: string): Promise<ProductDetail> {
        try {
            if (!productId) {
                throw new BadRequestException({
                    message: "Product id cannot be empty"
                });
            }
            // Get the product details from 1688
            const response = await fetch(
                `${process.env.GULLTRANS_BASE_URL}/api/client/third-purchase/info`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: process.env.GULLTRANS_AUTHORIZATION || '',
                        'X-Uuid': process.env.GULLTRANS_UUID || '',
                        'Content-Type': 'application/json',
                        Language: 'en',
                    },
                    body: JSON.stringify({
                        keyword: productId,
                        platform: '1688',
                        use_platform: '1'
                    }),
                },
            );

            const data = await response.json();

            if (data.ret !== 1) {
                if (this.normalizeLookupText(data?.msg).includes("not found")) {
                    throw new NotFoundException({
                        error: data.msg || "Product not found with that procurement id in gulltrans",
                    });
                }

                throw new BadRequestException({
                    error: data.msg,
                });
            }

            const product = data?.data?.result || {};

            if (!product || Object.keys(product).length === 0) {
                throw new NotFoundException({
                    error: "Product not found with that procurement id in gulltrans",
                });
            }

            const chineseTexts: string[] = [];
            const translationMap = new Map<string, string>(); // Map original Chinese -> index in array

            // Helper to add text to batch if it's Chinese (contains Chinese characters)
            const addIfChinese = (text: string): number | null => {
                if (!text || text.trim().length === 0) return null;

                // Check if contains Chinese characters (Unicode range: \u4e00-\u9fa5)
                const hasChinese = /[\u4e00-\u9fa5]/.test(text);
                if (hasChinese) {
                    // Avoid duplicates
                    if (!translationMap.has(text)) {
                        translationMap.set(text, text);
                        chineseTexts.push(text);
                        return chineseTexts.length - 1;
                    }
                    return Array.from(translationMap.keys()).indexOf(text);
                }
                return null;
            };

            // Extract subject (title)
            const subjectCh = product.subject || '';
            const subjectTrans = product.subjectTrans || '';
            addIfChinese(subjectTrans || subjectCh);

            // Extract product attributes (options)
            const attributes = product.productAttribute ?? [];
            for (const attr of attributes) {
                addIfChinese(attr.attributeNameTrans || attr.attributeName);
                addIfChinese(attr.valueTrans || attr.value);
            }

            // Extract SKU attributes (variant options)
            const skus = product.productSkuInfos ?? [];
            for (const sku of skus) {
                const skuAttributes = sku.skuAttributes ?? [];
                for (const attr of skuAttributes) {
                    addIfChinese(attr.attributeNameTrans || attr.attributeName);
                    addIfChinese(attr.valueTrans || attr.value);
                }
            }

            this.logger.log(`Found ${chineseTexts.length} Chinese text segments to translate`);

            let translations: string[] = [];

            if (chineseTexts.length > 0) {
                try {
                    const translationResponse = await fetch(
                        `${this.configService.get<string>("PRODUCT_TRANSLATION_BASE_URL")}/api/translate/batch`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                texts: chineseTexts,
                                sourceLanguage: 'ch',  // Chinese
                                targetLanguage: 'en',
                            }),
                        },
                    );

                    if (translationResponse.ok) {
                        translations = await translationResponse.json();
                        this.logger.log(`Successfully translated ${translations.length} Chinese segments`);
                    } else {
                        this.logger.warn(`Translation API returned ${translationResponse.status}, using original text`);
                        translations = chineseTexts; // Fallback to original
                    }
                } catch (error: any) {
                    this.logger.error(`Batch translation failed: ${error.message}`);
                    translations = chineseTexts; // Fallback to original
                }
            }

            const getTranslatedText = (originalText: string): string => {
                if (!originalText) return originalText;

                // Check if already English (no Chinese characters)
                const hasChinese = /[\u4e00-\u9fa5]/.test(originalText);
                if (!hasChinese) return originalText;

                const index = chineseTexts.indexOf(originalText);
                if (index !== -1 && translations[index]) {
                    return translations[index];
                }
                return originalText;
            };


            const description = extractFormattedText(product.description);
            let descriptionTrans: string = '';

            if (product.descriptionTrans && !(/[\u4e00-\u9fa5]/.test(product.descriptionTrans))) {
                descriptionTrans = extractFormattedText(product.descriptionTrans);
            } else if (description.length > 0) {
                // If description needs translation and wasn't in batch (because it might be English already)
                const hasChineseDesc = /[\u4e00-\u9fa5]/.test(description);
                if (hasChineseDesc) {
                    // Single translation for description
                    try {
                        const translationResponse = await fetch(
                            `${this.configService.get<string>("PRODUCT_TRANSLATION_BASE_URL")}/api/translate/batch`,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    texts: [description],
                                    sourceLanguage: 'ch',
                                    targetLanguage: 'en',
                                }),
                            },
                        );

                        const data = await translationResponse.json();
                        if (!translationResponse.ok) {

                            throw new BadRequestException({
                                error: data.message,
                            });
                        }

                        descriptionTrans = data[0] || "";
                    } catch (error: any) {
                        this.logger.error(`Description translation failed: ${error}`);
                        descriptionTrans = description;
                    }
                } else {
                    descriptionTrans = description;
                }
            }

            const optionsMap = new Map<string, Set<string>>();

            // Helper to get option name and value with translation
            const getOptionName = (attr: SkuAttribute | ProductAttribute): string => {
                const name = (attr.attributeName === attr.attributeNameTrans) ? getTranslatedText(attr.attributeName) : attr.attributeNameTrans;
                return name || attr.attributeName;
            };

            const getOptionValue = (attr: SkuAttribute | ProductAttribute): string => {
                const value = (attr.value === attr.valueTrans) ? getTranslatedText(attr.value) : attr.valueTrans;
                return value || attr.value;
            };

            const variants = skus.map((sku: ProductSku) => {
                const attributes = sku.skuAttributes?.map((attr: SkuAttribute) => {
                    const name = getOptionName(attr);
                    const value = getOptionValue(attr);

                    if (!optionsMap.has(name)) {
                        optionsMap.set(name, new Set());
                    }
                    optionsMap.get(name)!.add(value);

                    return { name, value };
                }) ?? [];

                // Create variant title from translated attribute values
                const title = (sku.skuAttributes?.map(attr => getOptionValue(attr)).join(' ') ?? '')
                    .trim();

                const shippingInfo = product.productShippingInfo?.skuShippingDetails?.find(
                    (detail: any) => detail.skuId === sku.skuId.toString()
                ) ?? product.productShippingInfo;

                const skuImg = sku.skuAttributes?.find((a) => a.skuImageUrl)?.skuImageUrl ?? '';

                const price = parseFloat(
                    sku.price ||
                    sku.consignPrice ||
                    sku.fenxiaoPriceInfo?.offerPrice ||
                    '0'
                );

                return {
                    title: title,
                    skuId: sku.skuId,
                    price: price,
                    stock: sku.amountOnSale,
                    attributes,
                    image: skuImg,
                    shipping: {
                        weight: smartRoundInt(shippingInfo?.weight || 0),
                        length: smartRoundInt(shippingInfo?.length || 0),
                        width: smartRoundInt(shippingInfo?.width || 0),
                        height: smartRoundInt(shippingInfo?.height || 0),
                        origin: product.productShippingInfo?.sendGoodsAddressText || '',
                    },
                    skuMeta: {
                        shop_id: product.sellerOpenId,
                        shop_name: product.companyName,
                        spec_id: sku.specId,
                        sku_img: skuImg,
                        min_order_quantity: String(product.minOrderQuantity ?? 1),
                        batch_number: '1',
                        imgs: product.productImage?.images ?? [],
                        specs: sku.skuAttributes?.map((attr: SkuAttribute) => ({
                            label: getOptionName(attr),
                            value: getOptionValue(attr),
                        })) ?? [],
                    },
                };
            });

            const options = Array.from(optionsMap, ([name, values]) => ({
                name,
                values: Array.from(values),
            }));

            const formattedAttributes = (product.productAttribute ?? []).map((attr: ProductAttribute) => ({
                name: getOptionName(attr),
                value: getOptionValue(attr),
            }));

            // Get translated title

            let title = (subjectTrans || subjectCh).slice(0, 128);
            const titleHasChinese = /[\u4e00-\u9fa5]/.test(title);
            if (titleHasChinese) {
                // Try to get translated title from batch
                const translatedTitle = getTranslatedText(subjectCh);
                if (translatedTitle !== subjectCh) {
                    title = translatedTitle.slice(0, 128);
                } else {
                    // Fallback: single translation for title
                    try {
                        const translationResponse = await fetch(
                            `${this.configService.get<string>("PRODUCT_TRANSLATION_BASE_URL")}/api/translate/batch`,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    text: [subjectCh],
                                    sourceLanguage: 'ch',
                                    targetLanguage: 'en',
                                }),
                            },
                        );
                        const data = await translationResponse.json();
                        if (!translationResponse.ok) {

                            throw new BadRequestException({
                                error: data.message,
                            });
                        }

                        if (data?.length > 0) {
                            title = data[0].slice(0, 128);
                        }
                    } catch (error: any) {
                        this.logger.error(`Title translation failed: ${error.message}`);
                    }
                }
            }

            const slug = generateSlug(title);

            // Build and return formatted product

            const formattedProduct: ProductDetail = {
                externalId: product.offerId,
                shopId: product.sellerOpenId,
                shopName: product.companyName,
                slug: slug,
                title: title,
                description: description,
                descriptionTrans: descriptionTrans,
                descriptionHtml: product.description,
                images: product.productImage?.images || [],
                mainImage: product.productImage?.images?.[0] || null,
                video: product.mainVideo,
                price: parseFloat(
                    product.productSaleInfo?.priceRangeList?.[0]?.price || '0'
                ),
                currencyCode: CurrencyCode.CNY,
                minOrderQuantity: product.minOrderQuantity,
                variants,
                options,
                attributes: formattedAttributes,
                supplier: {
                    name: product.companyName,
                    id: product.sellerOpenId,
                },
                category: {
                    level1: product.topCategoryId,
                    level2: product.secondCategoryId,
                    level3: product.thirdCategoryId,
                },
                meta: {
                    rating: parseFloat(product.tradeScore || '0'),
                    sold: product.productSaleInfo?.amountOnSale,
                    isDropshipping: product.tagInfoList?.find(
                        (t: any) => t.key === 'isOnePsale'
                    )?.value || false,
                },
            };

            this.logger.log(`Product ${productId} processed successfully with ${variants.length} variants, ${options.length} options`);

            return formattedProduct;
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error fetching product: ${error?.message}`, error);
            throw new InternalServerErrorException({
                error: 'Failed to fetch product',
                details: error.response?.error || error.message,
            });
        }
    }

    /**
     * Import product details in db
     *
     * @param dto
     * @returns
     */
    async importProduct(dto: ImportProductDto) {
        const results = {
            success: [] as importedProduct[],
            failed: [] as { id: string; reason: string }[],
        };
        const importedProductUuids: string[] = [];

        try {
            const ids = [...new Set(dto.externalId || [])];

            if (!ids.length) {
                throw new BadRequestException({
                    message: 'externalId array cannot be empty',
                });
            }

            const BATCH_SIZE = 3;

            for (let i = 0; i < ids.length; i += BATCH_SIZE) {
                const batch = ids.slice(i, i + BATCH_SIZE);

                await Promise.all(
                    batch.map(async (id) => {
                        let product: Product | null = null;
                        try {
                            // 1. Fetch product details from 1688
                            const productDetails = await this.getProductDetail(id);
                            let featuredImageUUID: string = '';

                            // 2. create product in database and
                            product = await this.productService.createProduct({
                                slug: productDetails.slug,
                                title: {
                                    en: productDetails.title,
                                    ar: productDetails.title
                                },
                                description: {
                                    en: productDetails.descriptionTrans, //need to update through admin dashboard
                                    ar: productDetails.description //need to update through admin dashboard
                                },
                                brief: {
                                    en: '', //need to add through admin dashboard
                                    ar: '' //need to add through admin dashboard
                                },
                                descriptionHtml: {
                                    en: productDetails.descriptionHtml,
                                    ar: productDetails.descriptionHtml
                                },
                                categories: dto.categories, //need to add categories through admin dashboard
                                shopId: productDetails.shopId ?? undefined,
                                shopName: productDetails.shopName ?? undefined,
                                procurementId: productDetails.externalId ? String(productDetails.externalId) : undefined,
                            });

                            // The product is imported as active now.
                            // const product = await this.productService.updateProductStatus(productCreated.uuid, { status: ProductStatus.ACTIVE, });

                            const optionValueMap = new Map<string, string>();

                            if (product) {
                                const currentProduct = product;
                                // 3. create product option and product option values for product
                                if (productDetails.options?.length) {
                                    const VARIANT_BATCH_SIZE = 5;

                                    for (let i = 0; i < productDetails.options.length; i += VARIANT_BATCH_SIZE) {
                                        const batch = productDetails.options.slice(i, i + VARIANT_BATCH_SIZE);

                                        await Promise.all(
                                            batch.map(async (option, index) => {
                                                try {
                                                    const optionPayload = {
                                                        name: {
                                                            en: option.name?.trim().slice(0, 64),
                                                            ar: option.name?.trim().slice(0, 64),
                                                        },
                                                        position: i + index + 1
                                                    };

                                                    // add product options
                                                    const createdOption = await this.optionService.createProductOption(
                                                        currentProduct.uuid,
                                                        optionPayload,
                                                    );

                                                    for (let valueIndex = 0; valueIndex < option.values.length; valueIndex++) {
                                                        try {
                                                            const optionValuePayload = {
                                                                value: {
                                                                    en: option.values[valueIndex]?.trim().slice(0, 64),
                                                                    ar: option.values[valueIndex]?.trim().slice(0, 64),
                                                                },
                                                                position: valueIndex + 1,
                                                            };

                                                            // add product options values
                                                            const optionValue = await this.optionValueService.createProductOptionValue(
                                                                createdOption.uuid,
                                                                optionValuePayload
                                                            );
                                                            optionValueMap.set(optionValue.valueEn, optionValue.uuid);
                                                        } catch (error: any) {
                                                            this.logger.error(`Option value creation failed for product ${currentProduct.uuid}: ${error}`);
                                                        }
                                                    }

                                                } catch (error: any) {
                                                    this.logger.error(`Option creation failed for product ${currentProduct.uuid}: ${error}`,);
                                                    throw error;
                                                }
                                            }),
                                        );
                                    }
                                }

                                // 4. create product variants and product variant images
                                if (productDetails.variants?.length) {
                                    const VARIANT_BATCH_SIZE = 5;
                                    const warehouse = dto.warehouseUUID;
                                    const hasVariantImages = productDetails.variants.some(v => !!v.image);

                                    let firstVariantId: string | null = null;
                                    let fallbackImagesAssigned = false;

                                    for (let i = 0; i < productDetails.variants.length; i += VARIANT_BATCH_SIZE) {
                                        const batch = productDetails.variants.slice(i, i + VARIANT_BATCH_SIZE);

                                        await Promise.all(
                                            batch.map(async (variant) => {
                                                try {
                                                    const optionValuesUuids = variant.attributes
                                                        .map(attr => optionValueMap.get(attr.value))
                                                        .filter((uuid): uuid is string => Boolean(uuid));

                                                    const dto: CreateProductVariantDto = {
                                                        warehouse: warehouse,
                                                        title: {
                                                            en: variant.title?.trim().slice(0, 128) ?? '',
                                                            ar: variant.title?.trim().slice(0, 128) ?? '',
                                                        },
                                                        sku: variant.skuId?.toString() || crypto.randomUUID(),
                                                        barcode: variant.skuId?.toString() || '',
                                                        quantity: variant.stock || 0,
                                                        cost: moneyFromFloat(variant.price, CurrencyCode.CNY),
                                                        weight: {
                                                            amount: variant.shipping?.weight || 0,
                                                            unit: WeightUnit.Kilograms,
                                                        },
                                                        dimensions: {
                                                            width: variant.shipping?.width || 0,
                                                            height: variant.shipping?.height || 0,
                                                            length: variant.shipping?.length || 0,
                                                            unit: DimensionsUnit.Centimeter
                                                        },
                                                        optionValues: optionValuesUuids,
                                                        skuMeta: variant.skuMeta,
                                                    };

                                                    // add product variants
                                                    const createdVariant = await this.variantService.createProductVariant(
                                                        currentProduct.uuid,
                                                        dto,
                                                        true
                                                    );

                                                    if (!firstVariantId) {
                                                        firstVariantId = createdVariant.uuid;
                                                    }

                                                    // Variant already has its own image
                                                    if (variant.image) {
                                                        const imageFile = await fetchImageAsFile(variant.image);
                                                        const createdImage = await this.variantImageService.createProductVariantImage(
                                                            createdVariant.uuid,
                                                            imageFile,
                                                        );
                                                        if (!featuredImageUUID) {
                                                            featuredImageUUID = createdImage.uuid;
                                                        }
                                                        return;
                                                    }

                                                    //  No variant images exist → use featured images ONLY ONCE
                                                    if (!hasVariantImages && !fallbackImagesAssigned && firstVariantId === createdVariant.uuid) {
                                                        if (Array.isArray(productDetails.images)) {
                                                            for (const img of productDetails.images) {
                                                                const imageFile = await fetchImageAsFile(img);
                                                                const createdImage = await this.variantImageService.createProductVariantImage(
                                                                    createdVariant.uuid,
                                                                    imageFile,
                                                                );
                                                                if (!featuredImageUUID) {
                                                                    featuredImageUUID = createdImage.uuid;
                                                                }
                                                            }
                                                        }
                                                        fallbackImagesAssigned = true;
                                                    }

                                                } catch (error: any) {
                                                    this.logger.error(`Variant creation failed for product ${currentProduct.uuid}: ${error?.message}`, error);
                                                    throw error;
                                                }
                                            }),
                                        );
                                    }
                                }

                                if (featuredImageUUID) {
                                    await this.productService.updateProductFeaturedImage(product.uuid, { imageUUID: featuredImageUUID })
                                }

                            }
                            results.success.push({
                                externalId: id,
                                product: product
                            });

                            importedProductUuids.push(product.uuid);

                        } catch (error: any) {
                            this.logger.error(`Failed importing product ${id}: ${error}`);

                            if (product?.uuid) {
                                await this.productRepository.delete({
                                    uuid: product.uuid
                                })
                            }

                            results.failed.push({
                                id,
                                reason: error?.message || error,
                            });
                        }
                    }),
                );
            }

            // Before queuing translation, check if already queued
            const productsNeedingTranslation: string[] = [];

            for (const product of importedProductUuids) {
                const isBeingTranslated = await this.jobRegistry.isProductBeingTranslated(product);
                if (!isBeingTranslated) {
                    productsNeedingTranslation.push(product);
                } else {
                    this.logger.log(`Product ${product} already has a translation job, skipping`);
                }
            }

            if (importedProductUuids.length) {
                await this.queueService.addImportedProductsTranslationJob(
                    productsNeedingTranslation,
                    "en",
                );
            }

            return results;
        } catch (error: any) {
            this.logger.error(`Error importing products: ${error?.message || error}`);
            throw new InternalServerErrorException({
                error: 'Failed to import products',
                details: error.response?.error || error,
            });
        }
    }

    /**
     * Save product details in db
     *
     * @param dto
     * @returns
     */
    async saveProduct(dto: SaveProcurementToStoreDto) {
        const results = {
            success: [] as Product[],
            failed: [] as { id: string; reason: string }[],
        };
        const savedProductUuids: string[] = [];

        try {
            const items = [...new Set(dto.items || [])];

            if (!items.length) {
                throw new BadRequestException({
                    message: 'procurement items array cannot be empty',
                });
            }

            const BATCH_SIZE = 3;

            for (let i = 0; i < items.length; i += BATCH_SIZE) {
                const batch = items.slice(i, i + BATCH_SIZE);

                await Promise.all(
                    batch.map(async (item) => {
                        let product: Product | null = null
                        try {
                            let featuredImageUUID: string = '';

                            // create product in database and
                            // The product is saved as active now.
                            product = await this.productService.createProduct({
                                slug: item.slug,
                                title: {
                                    en: item.title.en,
                                    ar: item.title.ar
                                },
                                description: {
                                    en: item.description.en,
                                    ar: item.description.ar
                                },
                                brief: {
                                    en: item.brief.en,
                                    ar: item.brief.ar
                                },
                                descriptionHtml: {
                                    en: item.descriptionHtml.en,
                                    ar: item.descriptionHtml.ar
                                },
                                categories: item.categories,
                                shopId: item.shopId ?? undefined,
                                shopName: item.shopName ?? undefined,
                                procurementId: item.externalId ? String(item.externalId) : undefined,
                            });

                            const optionValueMap = new Map<string, string>();

                            // 3. create product option and product option values for product
                            if (product) {
                                const currentProduct = product;
                                if (item.options?.length) {
                                    const VARIANT_BATCH_SIZE = 5;

                                    for (let i = 0; i < item.options.length; i += VARIANT_BATCH_SIZE) {
                                        const batch = item.options.slice(i, i + VARIANT_BATCH_SIZE);

                                        await Promise.all(
                                            batch.map(async (option, index) => {
                                                try {
                                                    const optionPayload = {
                                                        name: {
                                                            en: option.name?.en?.trim().slice(0, 64),
                                                            ar: option.name?.ar?.trim().slice(0, 64),
                                                        },
                                                        position: i + index + 1
                                                    };

                                                    // add product options
                                                    const createdOption = await this.optionService.createProductOption(
                                                        currentProduct.uuid,
                                                        optionPayload,
                                                    );

                                                    for (let valueIndex = 0; valueIndex < option.values.length; valueIndex++) {
                                                        try {
                                                            const optionValuePayload = {
                                                                value: {
                                                                    en: option.values[valueIndex]?.value?.en?.trim().slice(0, 64),
                                                                    ar: option.values[valueIndex]?.value?.ar?.trim().slice(0, 64),
                                                                },
                                                                position: valueIndex + 1,
                                                            };

                                                            // add product options values
                                                            const optionValue = await this.optionValueService.createProductOptionValue(
                                                                createdOption.uuid,
                                                                optionValuePayload
                                                            );
                                                            optionValueMap.set(optionValue.valueEn, optionValue.uuid);
                                                        } catch (error: any) {
                                                            this.logger.error(`Option value creation failed for product ${currentProduct.uuid}: ${error}`);
                                                        }
                                                    }

                                                } catch (error: any) {
                                                    this.logger.error(`Option creation failed for product ${currentProduct.uuid}: ${error}`,);
                                                    throw error;
                                                }
                                            }),
                                        );
                                    }
                                }

                                // 4. create product variants and product variant images
                                if (item.variants?.length) {
                                    const VARIANT_BATCH_SIZE = 5;
                                    const warehouse = item.warehouseUUID

                                    for (let i = 0; i < item.variants.length; i += VARIANT_BATCH_SIZE) {
                                        const batch = item.variants.slice(i, i + VARIANT_BATCH_SIZE);

                                        await Promise.all(
                                            batch.map(async (variant, index) => {
                                                try {
                                                    const optionValuesUuids = variant.attributes?.map(attr => optionValueMap.get(attr.optionValueEn)).filter((uuid): uuid is string => Boolean(uuid)) || [];

                                                    const dto: CreateProductVariantDto = {
                                                        warehouse: warehouse,
                                                        title: {
                                                            en: variant.title?.en?.trim().slice(0, 128) ?? '',
                                                            ar: variant.title?.ar?.trim().slice(0, 128) ?? '',
                                                        },
                                                        sku: variant.sku?.toString() || crypto.randomUUID(),
                                                        barcode: variant.barcode?.toString() || '',
                                                        quantity: variant.quantity || 0,
                                                        cost: {
                                                            amount: variant.cost.amount || 0,
                                                            minorAmount: variant.cost.minorAmount || 0,
                                                            currencyCode: variant.cost.currencyCode,
                                                        },
                                                        weight: {
                                                            amount: variant.weight.amount || 0,
                                                            unit: variant.weight.unit,
                                                        },
                                                        dimensions: {
                                                            width: variant.dimensions.width || 0,
                                                            height: variant.dimensions.height || 0,
                                                            length: variant.dimensions.length || 0,
                                                            unit: DimensionsUnit.Centimeter
                                                        },
                                                        optionValues: optionValuesUuids,
                                                    };

                                                    // add product variants
                                                    const createdVariant = await this.variantService.createProductVariant(
                                                        currentProduct.uuid,
                                                        dto,
                                                        true
                                                    );

                                                    if (index === 0) {
                                                        const featuredImageUrl = item.images.find((img) => img.isFeatured === true);
                                                        if (featuredImageUrl?.url) {
                                                            const imageFile = await fetchImageAsFile(featuredImageUrl?.url);
                                                            const image = await this.variantImageService.createProductVariantImage(
                                                                createdVariant.uuid,
                                                                imageFile,
                                                            );
                                                            featuredImageUUID = image.uuid;
                                                        }
                                                    }

                                                    // Variant has its image
                                                    if (variant.imageUrl) {
                                                        const imageFile = await fetchImageAsFile(variant.imageUrl);
                                                        const image = await this.variantImageService.createProductVariantImage(
                                                            createdVariant.uuid,
                                                            imageFile,
                                                        );
                                                    }

                                                } catch (error: any) {
                                                    this.logger.error(`Variant creation failed for product ${currentProduct.uuid}: ${error?.message}`, error);
                                                    throw error;
                                                }
                                            }),
                                        );
                                    }
                                }

                                if (featuredImageUUID) {
                                    await this.productService.updateProductFeaturedImage(product.uuid, { imageUUID: featuredImageUUID });
                                }
                            }

                            results.success.push(product);

                            savedProductUuids.push(product.uuid);

                        } catch (error: any) {
                            this.logger.error(`Failed importing product ${item.externalId}: ${error}`);

                            if (product?.uuid) {
                                await this.productRepository.delete({
                                    uuid: product.uuid
                                })
                            }
                            results.failed.push({
                                id: item.externalId,
                                reason: error?.message || error,
                            });
                        }
                    }),
                );
            }

            // Before queuing translation, check if already queued
            const productsNeedingTranslation: string[] = [];

            for (const product of savedProductUuids) {
                const isBeingTranslated = await this.jobRegistry.isProductBeingTranslated(product);
                if (!isBeingTranslated) {
                    productsNeedingTranslation.push(product);
                } else {
                    this.logger.log(`Product ${product} already has a translation job, skipping`);
                }
            }


            if (savedProductUuids.length) {
                await this.queueService.addImportedProductsTranslationJob(
                    productsNeedingTranslation,
                    "en",
                );
            }

            return results;
        } catch (error: any) {
            this.logger.error(`Error importing products: ${error?.message || error}`);
            throw new InternalServerErrorException({
                error: 'Failed to import products',
                details: error.response?.error || error,
            });
        }
    }

    /**
     * Groups flat order items by (shop_id, platform_url), merging skus
     * and summing goods_amount and freight_fee within each group.
     * Grouping by platform_url keeps different products as separate Gulltrans
     * orders — Gulltrans platform_url and name are order-level fields, not
     * per-SKU, so mixing products in one order makes all SKUs show the same URL.
     */
    private groupOrdersByShop(orders: BulkCreateProcurementOrderDto['orders']) {
        const groupMap = new Map<string, typeof orders>();

        for (const order of orders) {
            const shopKey = order.shop_id || order.shop_name || `__ungrouped__${orders.indexOf(order)}`;
            const key = `${shopKey}::${order.platform_url}`;
            if (!groupMap.has(key)) groupMap.set(key, []);
            groupMap.get(key)!.push(order);
        }

        return Array.from(groupMap.values()).map((group) => {
            const first = group[0];

            const mergedSkus = group.flatMap((o) => o.skus);

            const totalGoodsAmount = group
                .reduce((sum, o) => sum + parseFloat(o.goods_amount || '0'), 0)
                .toString();

            const totalFreightFee = group
                .reduce((sum, o) => sum + parseFloat(o.freight_fee || '0'), 0)
                .toString();

            const remark = group.map((o) => o.remark).filter(Boolean).join(' | ') || undefined;

            return {
                ...first,
                goods_amount: totalGoodsAmount,
                freight_fee: totalFreightFee,
                remark,
                skus: mergedSkus,
            };
        });
    }

    /**
     * Creates multiple Gulltrans daigou orders, auto-grouping products by shop,
     * with a shared delivery address.
     *
     * @param dto
     * @returns
     */
    async bulkCreateOrder(dto: BulkCreateProcurementOrderDto): Promise<BulkCreateOrderResponse> {
        const results: BulkCreateOrderResponse = { success: [], failed: [] };

        const grouped = dto.orders;
        const { warehouseId, userId } = await this.getActiveWarehouseGulltransIds();
        const previewAddress = this.toPreviewAddress(dto.address);

        const BATCH_SIZE = 3;

        for (let i = 0; i < grouped.length; i += BATCH_SIZE) {
            const batch = grouped.slice(i, i + BATCH_SIZE);

            await Promise.all(
                batch.map(async (order) => {
                    try {
                        this.logger.log(`Gulltrans: previewing shipping cost for shop ${order.shop_id} (${order.skus?.length ?? 0} SKU(s))`);
                        const preview = await this.previewOrder({
                            platform: order.platform,
                            skus: this.toPreviewSkus(order.skus),
                            address: previewAddress,
                        });
                        const freightFee = String(preview.freightFee ?? 0);

                        this.logger.log(`Gulltrans: creating order for shop ${order.shop_id} (${order.skus?.length ?? 0} SKU(s), goods amount: ${order.goods_amount}, freight fee: ${freightFee})`);
                        const response = await fetch(
                            `${process.env.GULLTRANS_BASE_URL}/api/client/daigou-open/create-order`,
                            {
                                method: 'PUT',
                                headers: {
                                    Authorization: process.env.GULLTRANS_AUTHORIZATION || '',
                                    'X-Uuid': process.env.GULLTRANS_UUID || '',
                                    'Content-Type': 'application/json',
                                    Language: 'en',
                                },
                                body: JSON.stringify({
                                    ...order,
                                    freight_fee: freightFee,
                                    address: dto.address,
                                    warehouse_id: warehouseId,
                                    user_id: userId,
                                }),
                            },
                        );

                        const data = await response.json();

                        if (data.ret !== 1) {
                            this.logger.error(`Gulltrans: order creation failed for shop ${order.shop_id} — ${data.msg}`);
                            results.failed.push({
                                shopId: order.shop_id,
                                reason: data.msg,
                            });
                            return;
                        }

                        this.logger.log(`Gulltrans: order created for shop ${order.shop_id} — order_sn ${data?.data?.order_sn}`);

                        const orderSn: string = data?.data?.order_sn;
                        await this.markGulltransOrderCreated(dto.orderUuid, orderSn);

                        results.success.push({
                            shopId: order.shop_id,
                            orderSn,
                            raw: data?.data,
                        });
                    } catch (error: any) {
                        const reason = error.response?.error || error?.message || 'Unknown error';
                        this.logger.error(`Gulltrans: order creation threw for shop ${order.shop_id} — ${reason}`);
                        results.failed.push({
                            shopId: order.shop_id,
                            reason,
                        });
                    }
                }),
            );
        }

        return results;
    }

    /**
     * Creates a Gulltrans daigou order (passthrough)
     *
     * @param dto
     * @returns
     */
    async createOrder(dto: CreateProcurementOrderDto): Promise<CreateOrderResponse> {
        const { warehouseId, userId } = await this.getActiveWarehouseGulltransIds();

        this.logger.log(`Gulltrans: previewing shipping cost for shop ${(dto as any).shop_id ?? 'unknown'}`);
        const preview = await this.previewOrder({
            platform: dto.platform,
            skus: this.toPreviewSkus(dto.skus),
            address: this.toPreviewAddress(dto.address),
        });
        const freightFee = String(preview.freightFee ?? 0);

        try {
            this.logger.log(`Gulltrans: creating single order for shop ${(dto as any).shop_id ?? 'unknown'} (freight fee: ${freightFee})`);
            const response = await fetch(
                `${process.env.GULLTRANS_BASE_URL}/api/client/daigou-open/create-order`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: process.env.GULLTRANS_AUTHORIZATION || '',
                        'X-Uuid': process.env.GULLTRANS_UUID || '',
                        'Content-Type': 'application/json',
                        Language: 'en',
                    },
                    body: JSON.stringify({
                        ...dto,
                        freight_fee: freightFee,
                        warehouse_id: warehouseId,
                        user_id: userId,
                    }),
                },
            );

            const data = await response.json();

            if (data.ret !== 1) {
                this.logger.error(`Gulltrans: single order creation failed — ${data.msg}`);
                throw new BadRequestException({
                    error: data.msg,
                });
            }

            const orderSn: string = data?.data?.order_sn;
            this.logger.log(`Gulltrans: single order created — order_sn ${orderSn}`);
            await this.markGulltransOrderCreated(dto.orderUuid, orderSn);

            return {
                success: true,
                orderSn,
                raw: data?.data,
            };
        } catch (error: any) {
            this.logger.error(`Gulltrans: single order creation threw — ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to create order',
                details: error.response?.error || error.message,
            });
        }
    }

    /**
     * Creates a Hiobuy order (new provider — used only by the flag-gated per-order dispatch path).
     * Does not touch Gulltrans's bulkCreateOrder/createOrder above.
     *
     * @param dto
     * @returns
     */
    async createHiobuyOrder(dto: CreateHiobuyOrderDto): Promise<{ orderId: string; raw: any }> {
        try {
            this.logger.log(`Hiobuy: creating order (${dto.lines.length} line(s))`);
            const response = await fetch(
                // TODO: remove hardcoded base URL, revert to process.env.HIOBUY_BASE_URL (testing only)
                `https://api.hiobuy.com/v1/orders/create`,
                {
                    method: 'POST',
                    headers: {
                        // TODO: remove hardcoded key, revert to process.env.HIOBUY_API_KEY (testing only)
                        Authorization: `Bearer hio_live_6p4q672c2o315x011o2b2t733w5h2b5q2z5q0p002j281d4o`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        channel: '1688',
                        lines: dto.lines,
                        receiver: dto.receiver,
                    }),
                },
            );

            const data = await response.json();

            if (!data.success) {
                const specificReason = data.message ?? data.failed_offers?.[0]?.reason;
                const reason = specificReason ?? `Hiobuy order creation failed — raw response: ${JSON.stringify(data)}`;
                this.logger.error(`Hiobuy: order creation failed — ${reason}`);
                throw new BadRequestException(reason);
            }

            const orderId: string = data.order_id;
            this.logger.log(`Hiobuy: order created — order_id ${orderId}`);

            return { orderId, raw: data };
        } catch (error: any) {
            if (error instanceof BadRequestException) throw error;
            this.logger.error(`Hiobuy: order creation threw — ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to create Hiobuy order',
                details: error.response?.error || error.message,
            });
        }
    }

    /**
     * Queries Hiobuy's logistics trace endpoint for the real 1688 courier freight tracking
     * number, once the seller has actually shipped. Returns null (not an error) if the goods
     * haven't shipped yet.
     *
     * @param orderId
     * @returns
     */
    async getHiobuyLogisticsTrace(orderId: string): Promise<{ trackingNumber: string | null; raw: any }> {
        try {
            const response = await fetch(
                // TODO: remove hardcoded base URL, revert to process.env.HIOBUY_BASE_URL (testing only)
                `https://api.hiobuy.com/v1/orders/logistics/trace`,
                {
                    method: 'POST',
                    headers: {
                        // TODO: remove hardcoded key, revert to process.env.HIOBUY_API_KEY (testing only)
                        Authorization: `Bearer hio_live_6p4q672c2o315x011o2b2t733w5h2b5q2z5q0p002j281d4o`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        channel: '1688',
                        order_id: orderId,
                    }),
                },
            );

            const data = await response.json();
            const packages: any[] = data?.tracking?.packages ?? [];

            if (packages.length > 1) {
                this.logger.warn(`Hiobuy: order ${orderId} has ${packages.length} packages — using the first`);
            }

            const trackingNumber: string | null = packages[0]?.tracking_number ?? null;
            return { trackingNumber, raw: data };
        } catch (error: any) {
            this.logger.error(`Hiobuy: logistics trace threw for order ${orderId} — ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to fetch Hiobuy logistics trace',
                details: error.response?.error || error.message,
            });
        }
    }
}
