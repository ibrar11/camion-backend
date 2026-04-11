import {
    Injectable,
    Logger,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';

import { generateSlug } from 'src/common/slug';

import {
    ProductAttribute,
    ProductDetail,
    ProductSku,
    SearchProductItem,
    SearchProducts,
    SkuAttribute
} from './types';

@Injectable()
export class ProcurementService {
    private readonly logger = new Logger(ProcurementService.name);

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
                title: item.subjectTrans || item.subject,
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
                details: error.response?.data || error.message,
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

            const description = product.description;

            const descriptionTrans = product.descriptionTrans ?? '';

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

                return {
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

            const slug = generateSlug(product.subjectTrans || product.subject).slice(0,63)

            // Format the Product
            const formattedProduct = {
                externalId: product.offerId,
                slug: slug,
                title: product.subjectTrans || product.subject,
                description: description,
                descriptionTrans: descriptionTrans,
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
                    weight: product.productShippingInfo?.weight,
                    length: product.productShippingInfo?.length,
                    width: product.productShippingInfo?.width,
                    height: product.productShippingInfo?.height,
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
            this.logger.error(`Error fetching products: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to fetch product',
                details: error.response?.data || error.message,
            });
        }
    }
}
