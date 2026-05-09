import {
    Injectable,
    Logger,
    BadRequestException,
    InternalServerErrorException,
    Inject,
} from '@nestjs/common';

import { generateSlug } from '../common/slug';
import { fetchImageAsFile } from '../common/fetchImage';
import { smartRoundInt } from '../common/smartRound';
import { extractFormattedText } from '../common/extractFormattedText';

import { CurrencyCode } from 'src/inventory/enums/CurrencyCode.enum';
import { WeightUnit } from 'src/inventory/enums/WeightUnit.enum';
import { DimensionsUnit } from 'src/inventory/enums/DimensionsUnit.enum';

import { ImportProductDto } from './dtos/ImportProductDto';

import { CreateProductVariantDto } from '../inventory/dtos/CreateProductVariantDto';

import { ProductsService } from '../inventory/products.service';

import { ProductVariantService } from '../inventory/product-variant.service';

import { ProductOptionService } from '../inventory/product-option.service';

import { ProductOptionValueService } from '../inventory/product-option-value.service';

import { ProductVariantImageService } from '../inventory/product-variant-image.service';

import {
    ProductAttribute,
    ProductDetail,
    ProductSku,
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
import { Repository } from 'typeorm';

import { Order } from '../order/entities/order.entity';

import { CreateProcurementOrderDto } from './dtos/CreateProcurementOrderDto';
import { BulkCreateProcurementOrderDto } from './dtos/BulkCreateProcurementOrderDto';
import { QueueService } from 'src/queue/queue.service';
import { ProductOptionValue } from 'src/inventory/entities/product-option-value.entity';

import { ConfigService } from '@nestjs/config';


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
    ) { }

    private async markGulltransOrderCreated(orderUuid: string | undefined, gulltransOrderId: string | number) {
        if (!orderUuid) return;
        await this.orderRepository.update({ uuid: orderUuid }, { gulltransOrderId: String(gulltransOrderId) });
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

            const description = extractFormattedText(product.description);

            let descriptionTrans: string = '';
            if (product.descriptionTrans) {
                descriptionTrans = extractFormattedText(product.descriptionTrans);
            } else {
                this.logger.log(`Attempting to translate product descritpion: ${product?.offerId}`);
                const translation = await await fetch(
                    `${this.configService.get<string>("PRODUCT_TRANSLATION_BASE_URL")}/api/translate/contextual`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            text: description,
                            sourceLanguage: 'ch',
                            targetLanguage: 'en',
                            updateWeaviate: true
                        }),
                    },
                );
                const data = await translation.json();
                descriptionTrans = data?.translated || "";
            }

            const skus = product.productSkuInfos ?? [];

            const getName = (attr: SkuAttribute | ProductAttribute) => {
                return attr.attributeNameTrans || attr.attributeName;
            }

            const getValue = (attr: SkuAttribute | ProductAttribute) => {
                return attr.valueTrans || attr.value;
            }

            const optionsMap = new Map<string, Set<string>>();

            //Extract the options and variants
            const variants = skus.map((sku: ProductSku) => {
                const attributes = sku.skuAttributes?.map((attr: SkuAttribute) => {
                    const name = getName(attr);
                    const value = getValue(attr);

                    if (!optionsMap.has(name)) {
                        optionsMap.set(name, new Set());
                    }
                    optionsMap.get(name)!.add(value);

                    return { name, value };
                }) ?? [];

                const title = sku.skuAttributes.map(sku => sku.valueTrans).join(' ');
                const shippingInfo = product.productShippingInfo.skuShippingDetails.find((detail: any) => detail.skuId === sku.skuId.toString());

                const skuImg = sku.skuAttributes?.find((a) => a.skuImageUrl)?.skuImageUrl ?? '';

                return {
                    title: title,
                    skuId: sku.skuId,
                    price: parseFloat(
                        sku.price ||
                        sku.consignPrice ||
                        sku.fenxiaoPriceInfo?.offerPrice ||
                        '0'
                    ),
                    stock: sku.amountOnSale,
                    attributes,
                    image: skuImg,
                    shipping: {
                        weight: smartRoundInt(shippingInfo.weight),
                        length: smartRoundInt(shippingInfo.length),
                        width: smartRoundInt(shippingInfo.width),
                        height: smartRoundInt(shippingInfo.height),
                        origin: product.productShippingInfo.sendGoodsAddressText,
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
                            label: attr.attributeName,
                            value: attr.value,
                        })) ?? [],
                    },
                };
            });

            const options = Array.from(optionsMap, ([name, values]) => ({
                name,
                values: Array.from(values),
            }));

            const attributes = (product.productAttribute ?? []).map((attr: ProductAttribute) => ({
                name: getName(attr),
                value: getValue(attr),
            }));

            const slug = generateSlug(product.subjectTrans || product.subject);
            const title = product.subjectTrans || product.subject;
            // Format the Product
            const formattedProduct: ProductDetail = {
                externalId: product.offerId,
                shopId: product.sellerOpenId,
                shopName: product.companyName,
                slug: slug,
                title: title.slice(0, 128),
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
                attributes,
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
                        try {
                            // 1. Fetch product details from 1688
                            const productDetails = await this.getProductDetail(id);

                            // 2. create product in database and
                            const product = await this.productService.createProduct({
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

                            importedProductUuids.push(product.uuid);

                            // The product is imported as active now.
                            // const product = await this.productService.updateProductStatus(productCreated.uuid, { status: ProductStatus.ACTIVE, });

                            const optionValueMap = new Map<string, string>();

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
                                                    product.uuid,
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
                                                        this.logger.error(`Option value creation failed for product ${product.uuid}: ${error}`);
                                                    }
                                                }

                                            } catch (error: any) {
                                                this.logger.error(`Option creation failed for product ${product.uuid}: ${error}`,);
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
                                                    product.uuid,
                                                    dto,
                                                    true
                                                );

                                                if (!firstVariantId) {
                                                    firstVariantId = createdVariant.uuid;
                                                }

                                                // Variant already has its own image
                                                if (variant.image) {
                                                    const imageFile = await fetchImageAsFile(variant.image);
                                                    await this.variantImageService.createProductVariantImage(
                                                        createdVariant.uuid,
                                                        imageFile,
                                                    );
                                                    return;
                                                }

                                                //  No variant images exist → use featured images ONLY ONCE
                                                if (!hasVariantImages && !fallbackImagesAssigned && firstVariantId === createdVariant.uuid) {
                                                    if (Array.isArray(productDetails.images)) {
                                                        for (const img of productDetails.images) {
                                                            const imageFile = await fetchImageAsFile(img);
                                                            await this.variantImageService.createProductVariantImage(
                                                                createdVariant.uuid,
                                                                imageFile,
                                                            );
                                                        }
                                                    }
                                                    fallbackImagesAssigned = true;
                                                }

                                            } catch (error: any) {
                                                this.logger.error(`Variant creation failed for product ${product.uuid}: ${error?.message}`, error);
                                            }
                                        }),
                                    );
                                }
                            }

                            results.success.push({
                                externalId: id,
                                product: product
                            });

                        } catch (error: any) {
                            this.logger.error(`Failed importing product ${id}: ${error}`);

                            results.failed.push({
                                id,
                                reason: error?.message || error,
                            });
                        }
                    }),
                );
            }

            if (importedProductUuids.length) {
                await this.queueService.addImportedProductsTranslationJob(
                    importedProductUuids,
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

        const BATCH_SIZE = 3;

        for (let i = 0; i < grouped.length; i += BATCH_SIZE) {
            const batch = grouped.slice(i, i + BATCH_SIZE);

            await Promise.all(
                batch.map(async (order) => {
                    try {
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
                                    warehouse_id: process.env.GULLTRANS_WAREHOUSE_ID || '',
                                    user_id: process.env.GULLTRANS_USER_ID || '',
                                }),
                            },
                        );

                        const data = await response.json();

                        if (data.ret !== 1) {
                            results.failed.push({
                                shopId: order.shop_id,
                                reason: data.msg,
                            });
                            return;
                        }

                        this.logger.log(`Gulltrans order created for shop ${order.shop_id}`);

                        const orderId = data?.data?.order_id ?? data?.data?.orderId ?? data?.data?.id;
                        await this.markGulltransOrderCreated(dto.orderUuid, orderId);

                        results.success.push({
                            shopId: order.shop_id,
                            orderId,
                            raw: data?.data,
                        });
                    } catch (error: any) {
                        this.logger.error(`Error creating order for shop ${order.shop_id}: ${error?.message}`);
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
        try {
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
                        warehouse_id: process.env.GULLTRANS_WAREHOUSE_ID || '',
                        user_id: process.env.GULLTRANS_USER_ID || '',
                    }),
                },
            );

            const data = await response.json();

            if (data.ret !== 1) {
                throw new BadRequestException({
                    error: data.msg,
                });
            }

            const orderId = data?.data?.order_id;
            await this.markGulltransOrderCreated(dto.orderUuid, orderId);

            return {
                success: true,
                orderId,
                raw: data?.data,
            };
        } catch (error: any) {
            this.logger.error(`Error creating order: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to create order',
                details: error.response?.error || error.message,
            });
        }
    }
}
