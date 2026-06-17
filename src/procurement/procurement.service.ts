import {
    Injectable,
    Logger,
    BadRequestException,
    InternalServerErrorException,
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
    SearchProduct,
} from './types';
import { ProductStatus } from 'src/inventory/enums/ProductStatus.enum';

import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, DataSource, Repository } from 'typeorm';

import { Order } from '../order/entities/order.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { ProductVariant } from '../inventory/entities/product-variant.entity';

import { CreateProcurementOrderDto } from './dtos/CreateProcurementOrderDto';
import { BulkCreateProcurementOrderDto } from './dtos/BulkCreateProcurementOrderDto';
import { ResyncInventoryVariantsDto } from './dtos/ResyncInventoryVariantsDto';
import { QueueService } from 'src/queue/queue.service';
import { ProductOptionValue } from 'src/inventory/entities/product-option-value.entity';
import { QueueName } from 'src/queue/enums/QueueTypes.enum';
import { InventoryResyncJobData } from 'src/queue/types';

import { ConfigService } from '@nestjs/config';

import { TranslationJobRegistryService } from '../translation/translation-job-registry.service';


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

    async resyncInventoryVariantsByProducts(productUuids: string[]): Promise<{
        productsRequested: number;
        productsFound: number;
        productsWithProcurementId: number;
        productsFailed: number;
        failedProducts: Array<{
            productUuid: string;
            procurementId: string | null;
            error: string;
        }>;
        variantsMatched: number;
        variantsUpdated: number;
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
        let variantsMatched = 0;
        let variantsUpdated = 0;
        let variantsMissingInSource = 0;
        let productsWithProcurementId = 0;

        const productUuidChunks = this.chunkArray(productUuids, 200);
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
                throw new BadRequestException({
                    error: data.msg,
                });
            }

            const product = data?.data?.result || {};

            if (!product) {
                throw new BadRequestException({
                    error: "Product not found",
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
                            `${this.configService.get<string>("PRODUCT_TRANSLATION_BASE_URL")}/api/translate`,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    text: description,
                                    sourceLanguage: 'ch',
                                    targetLanguage: 'en',
                                }),
                            },
                        );
                        const data: { translated: string } = await translationResponse.json();
                        descriptionTrans = data?.translated || "";
                    } catch (error: any) {
                        this.logger.error(`Description translation failed: ${error.message}`);
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
                );

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
                    price: smartRoundInt(price),
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
                            `${this.configService.get<string>("PRODUCT_TRANSLATION_BASE_URL")}/api/translate`,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    text: subjectCh,
                                    sourceLanguage: 'ch',
                                    targetLanguage: 'en',
                                }),
                            },
                        );
                        const data: { translated: string } = await translationResponse.json();
                        if (data?.translated) {
                            title = data.translated.slice(0, 128);
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
                                                        cost: {
                                                            amount: smartRoundInt(variant.price) || 0,
                                                            currencyCode: productDetails.currencyCode,
                                                        },
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
                                                            amount: smartRoundInt(variant.cost.amount) || 0,
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
     * Groups flat order items by shop_id (falls back to shop_name), merging skus
     * and summing goods_amount and freight_fee within each group.
     */
    private groupOrdersByShop(orders: BulkCreateProcurementOrderDto['orders']) {
        const groupMap = new Map<string, typeof orders>();

        for (const order of orders) {
            const key = order.shop_id || order.shop_name || `__ungrouped__${orders.indexOf(order)}`;
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

            const name = group.map((o) => o.name).join(' | ').slice(0, 256);

            const remark = group.map((o) => o.remark).filter(Boolean).join(' | ') || undefined;

            return {
                ...first,
                name,
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

        const grouped = this.groupOrdersByShop(dto.orders);
        const { warehouseId, userId } = await this.getActiveWarehouseGulltransIds();

        const BATCH_SIZE = 3;

        for (let i = 0; i < grouped.length; i += BATCH_SIZE) {
            const batch = grouped.slice(i, i + BATCH_SIZE);

            await Promise.all(
                batch.map(async (order) => {
                    try {
                        this.logger.log(`Gulltrans: creating order for shop ${order.shop_id} (${order.skus?.length ?? 0} SKU(s), goods amount: ${order.goods_amount})`);
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
                        this.logger.error(`Gulltrans: order creation threw for shop ${order.shop_id} — ${error?.message}`);
                        results.failed.push({
                            shopId: order.shop_id,
                            reason: error?.message || 'Unknown error',
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
        try {
            this.logger.log(`Gulltrans: creating single order for shop ${(dto as any).shop_id ?? 'unknown'}`);
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
}
