import { 
    HttpException, 
    HttpStatus, 
    Injectable,
    Logger
} from '@nestjs/common';

import axios from 'axios';

import { SearchProductsDto } from './dtos/SearchProductsDto';
import { ProductDetailDto } from './dtos/ProductDetailDto';

@Injectable()
export class ProcurementService {
    private readonly logger = new Logger(ProcurementService.name);
    private baseUrl = process.env.GULLTRANS_BASE_URL;
    private uuid = process.env.GULLTRANS_UUID;
    private secret = process.env.GULLTRANS_AUTHORIZATION;

    private filterDescription (description: string) {
        return description
            .replace(/<img[^>]*>/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    async searchProducts(dto: SearchProductsDto, language?: string, currency?: string) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/client/third-purchase/search`,
                {
                    keyword: dto.keyword,
                    platform: '1688',
                    use_platform: "1",
                    page: dto.page,
                    page_size: dto.pageSize,
                    sort: dto.sort,
                    priceStart: dto.priceStart,
                    priceEnd: dto.priceEnd,
                },
                {
                    headers: {
                        Authorization: this.secret,
                        'X-Uuid': this.uuid,
                        'Content-Type': 'application/json',
                        Language: 'en',
                    },
                },
            );

            if (response.data.ret !== 1) {
                throw new HttpException(
                    response.data.msg,
                    HttpStatus.BAD_REQUEST,
                );
            }

            const products = response.data?.data?.data || [];

            const formattedProducts = products?.map((item: any) => ({
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
                source: '1688',
            }));

            const total = response.data.data.totalRecords;
            const page = response.data.data.currentPage;
            const pageSize = response.data.data.pageSize;
            const totalPages = (total % pageSize === 0) ? response.data.data.totalPage - 1 : response.data.data.totalPage;
            const has_next = page < totalPages;

            return {
                success: true,
                message: 'Done',
                data: formattedProducts,
                meta: {
                    total: total,
                    totalPages: totalPages,
                    page: page,
                    pageSize: pageSize,
                    has_next: has_next,
                },
            };
        } catch (error) {
            this.logger.error(`Error fetching products: ${error?.message}`);
            throw new HttpException(
                {
                error: 'Failed to fetch products',
                details: error.response?.data || error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getProductDetail(dto: ProductDetailDto, language?: string, currency?: string,) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/client/third-purchase/info`,
                {
                    keyword: dto.productId,
                    platform: '1688',
                    'use_platform': '1'
                },
                {
                headers: {
                    Authorization: this.secret,
                    'X-Uuid': this.uuid,
                    'Content-Type': 'application/json',
                    Language: 'en',
                },
                },
            );

            if (response.data.ret !== 1) {
                throw new HttpException(
                    response.data.msg,
                    HttpStatus.BAD_REQUEST,
                );
            }

            const product = response.data?.data?.result || {};

            if (!product) {
                throw new HttpException(
                    "Product not found",
                    HttpStatus.BAD_REQUEST,
                );
            }

            const description = this.filterDescription(product.description);

            const descriptionTrans = this.filterDescription(product.descriptionTrans ?? '');

            const optionsMap = new Map<string, Set<string>>();

            (product.productSkuInfos || []).forEach((sku: any) => {
                sku.skuAttributes?.forEach((attr: any) => {
                    const name = attr.attributeNameTrans || attr.attributeName;

                    if (!optionsMap.has(name)) {
                        optionsMap.set(name, new Set());
                    }

                    optionsMap.get(name)?.add(attr.valueTrans || attr.value);
                });
            });

            const options = Array.from(optionsMap.entries()).map(
                ([name, valuesSet]) => ({
                    name,
                    values: Array.from(valuesSet),
                }),
            );

            const variants = (product.productSkuInfos || []).map((sku: any) => ({
                skuId: sku.skuId,

                price: parseFloat(
                    sku.price ||
                    sku.consignPrice ||
                    sku.fenxiaoPriceInfo?.offerPrice ||
                    '0'
                ),

                stock: sku.amountOnSale,

                attributes: sku.skuAttributes?.map((attr: any) => ({
                    name: attr.attributeNameTrans || attr.attributeName,
                    value: attr.valueTrans || attr.value,
                })),

                image: sku.skuAttributes?.find((a: any) => a.skuImageUrl)?.skuImageUrl || null,
            }));

            const attributes = (product.productAttribute || []).map((attr: any) => ({
                name: attr.attributeNameTrans || attr.attributeName,
                value: attr.valueTrans || attr.value,
            }));

            const formattedProduct = {
                externalId: product.offerId,
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
                source: '1688',
            };

            return {
                success: true,
                message: 'Done',
                data: formattedProduct
            };
        } catch (error) {
            this.logger.error(`Error fetching products: ${error?.message}`);
            throw new HttpException(
                {
                error: 'Failed to fetch products',
                details: error.response?.data || error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
