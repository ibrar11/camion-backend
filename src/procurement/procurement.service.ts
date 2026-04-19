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

import { CurrencyCode } from '../inventory/enums/CurrencyCode';
import { WeightUnit } from '../inventory/enums/WeightUnit';
import { DimensionsUnit } from '../inventory/enums/DimensionsUnit';

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
    importedProduct
} from './types';


@Injectable()
export class ProcurementService {
    private readonly logger = new Logger(ProcurementService.name);

    constructor(
        @Inject(ProductsService) private readonly productService: ProductsService,
        @Inject(ProductVariantService) private readonly variantService: ProductVariantService,
        @Inject(ProductOptionService) private readonly optionService: ProductOptionService,
        @Inject(ProductOptionValueService) private readonly optionValueService: ProductOptionValueService,
        @Inject(ProductVariantImageService) private readonly variantImageService: ProductVariantImageService,
    ) { }

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
    ): Promise<Array<SearchProducts>> {
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

            // Format the products
            const formattedProducts = products?.map((item) => ({
                externalId: item.offerId,
                title: (item.subjectTrans || item.subject).slice(0,128),
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
                updatedAt: item.modifyDate,
            }));

            return formattedProducts;
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

            const descriptionTrans = product.descriptionTrans ?
                extractFormattedText(product.descriptionTrans)
                : description;

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
                    image:
                        sku.skuAttributes?.find((a) => a.skuImageUrl)?.skuImageUrl ?? null,
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
            const formattedProduct = {
                externalId: product.offerId,
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
                shipping: {
                    weight: smartRoundInt(product.productShippingInfo?.weight),
                    length: smartRoundInt(product.productShippingInfo?.length),
                    width: smartRoundInt(product.productShippingInfo?.width),
                    height: smartRoundInt(product.productShippingInfo?.height),
                    origin: product.productShippingInfo?.sendGoodsAddressText,
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
                                categories: dto.categories //need to add categories through admin dashboard
                            });

                            const optionValuesUuids: string[] = []

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
                                                        en: option.name,
                                                        ar: option.name,
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
                                                                en: option.values[valueIndex],
                                                                ar: option.values[valueIndex],
                                                            },
                                                            position: valueIndex + 1,
                                                        };

                                                        // add product options values
                                                        const optionValue = await this.optionValueService.createProductOptionValue(
                                                            createdOption.uuid,
                                                            optionValuePayload
                                                        );
                                                        optionValuesUuids.push(optionValue.uuid)
                                                    } catch (error: any) {
                                                        this.logger.error(`Option value creation failed for product ${product.uuid}: ${error?.message}`);
                                                    }
                                                }

                                            } catch (error: any) {
                                                this.logger.error(`Option creation failed for product ${product.uuid}: ${error?.message}`,);
                                            }
                                        }),
                                    );
                                }
                            }

                            // 4. create product variants and product variant images
                            if (productDetails.variants?.length) {
                                const VARIANT_BATCH_SIZE = 5;
                                const warehouse = dto.warehouseUUID;
                                for (let i = 0; i < productDetails.variants.length; i += VARIANT_BATCH_SIZE) {
                                    const batch = productDetails.variants.slice(i, i + VARIANT_BATCH_SIZE);

                                    await Promise.all(
                                        batch.map(async (variant) => {
                                            try {
                                                const dto: CreateProductVariantDto = {
                                                    warehouse: warehouse,
                                                    title: {
                                                        en: variant.title ?? '',
                                                        ar: variant.title ?? '',
                                                    },
                                                    sku: variant.skuId?.toString() || crypto.randomUUID(),
                                                    barcode: variant.skuId?.toString() || '',
                                                    quantity: variant.stock || 0,
                                                    price: {
                                                        amount: variant.price || 0,
                                                        currencyCode: CurrencyCode.USD,
                                                    },
                                                    weight: {
                                                        amount: productDetails.shipping?.weight || 0,
                                                        unit: WeightUnit.Kilograms,
                                                    },
                                                    dimensions: {
                                                        width: productDetails.shipping?.width || 0,
                                                        height: productDetails.shipping?.height || 0,
                                                        length: productDetails.shipping?.length || 0,
                                                        unit: DimensionsUnit.Centimeter
                                                    },
                                                    optionValues: optionValuesUuids,
                                                };

                                                // add product variants
                                                const createdVariant = await this.variantService.createProductVariant(
                                                    product.uuid,
                                                    dto,
                                                );

                                                const imageFile = await fetchImageAsFile(variant.image || '')

                                                await this.variantImageService.createProductVariantImage(createdVariant.uuid, imageFile);

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
                            this.logger.error(`Failed importing product ${id}: ${error?.message}`);

                            results.failed.push({
                                id,
                                reason: error?.message || error,
                            });
                        }
                    }),
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
}
