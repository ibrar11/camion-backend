export interface SearchProductItem {
    offerId: number;
    subject: string;
    subjectTrans?: string;
    imageUrl: string;
    priceInfo: PriceInfo;
    monthSold: number;
    isOnePsale: boolean;
    sellerIdentities: string[];
    tradeScore: string;
    topCategoryId: number;
    secondCategoryId: number;
    thirdCategoryId: number;
    createDate: string;
    modifyDate: string;
    minOrderQuantity: number;
    promotionURL: string;
}

export interface PriceInfo {
    price: string;
    consignPrice?: string;
    promotionPrice?: string;
}

export interface ProductAttribute {
    attributeId: string;
    attributeName: string;
    attributeNameTrans?: string;
    value: string;
    valueTrans?: string;
}

export interface ProductSku {
    skuId: number;
    specId: string;
    price: string;
    consignPrice?: string;

    amountOnSale: number;

    skuAttributes: SkuAttribute[];

    fenxiaoPriceInfo?: {
        offerPrice: string;
    };
}

export interface SkuAttribute {
    attributeId: number;
    attributeName: string;
    attributeNameTrans?: string;
    value: string;
    valueTrans?: string;
    skuImageUrl?: string;
}

export interface SearchProducts {
    externalId: number;
    title: string;
    price: number;
    originalPrice: number;
    image: string;
    productUrl: string;
    monthlySales: number;
    rating: number;
    minOrderQuantity: number;
    isDropshipping: boolean;
    supplierType: string | null;
    category: {
        level1: number;
        level2: number;
        level3: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface ProductVariant {
    skuId: number;
    price: number;
    stock: number;
    attributes: {
        name: string;
        value: string;
    }[];
    image: string | null;
}

export interface ProductOption {
    name: string;
    values: string[];
}

export interface ProductAttributeFormatted {
    name: string;
    value: string;
}

export interface ProductDetail {
    externalId: number;
    slug: string;
    title: string;
    description: string;
    descriptionTrans: string;
    images: string[];
    mainImage: string | null;
    video?: string;

    price: number;
    minOrderQuantity: number;

    variants: ProductVariant[];
    options: ProductOption[];
    attributes: ProductAttributeFormatted[];

    supplier: {
        name: string;
        id: string;
    };

    category: {
        level1: number;
        level2: number;
        level3: number;
    };

    shipping: {
        weight?: number;
        length?: number;
        width?: number;
        height?: number;
        origin?: string;
    };

    meta: {
        rating: number;
        sold?: number;
        isDropshipping: boolean;
    };
}