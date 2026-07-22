import {
    Injectable,
    BadRequestException,
    Logger,
    InternalServerErrorException,
    Inject,
    HttpException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import {
    In,
    Repository
} from 'typeorm';

import { Customer } from '../customers/entities/customer.entity';

import { CartItem } from "../cart/entities/cart-items.entity";

import { CustomerAddress } from "../customers/entities/customer-address.entity";

import { ExchangeRateService } from "../pricing/exchange-rate.service";

import { calculateStock } from "../common/calculateStock";

import { Coupon } from "../referral/entities/coupon.entity";
import { GlobalCoupon } from "../referral/entities/global-coupon.entity";

import { PricingService } from "../pricing/pricing.service";

import { KeyValuePair } from "../key-value-pairs/entities/key-value-pair.entity";

import {
    calculateCartShipping,
    ShippingCalculationResult
} from "../common/calculateShipping";

import {
    calculateCouponDiscount
} from "../common/calculateCouponDiscount";

import {
    OrderPreviewResponse,
} from "./types";

import { KeyValuePairType } from "../key-value-pairs/enums/KeyValuePairType.enum";

import { ProductStatus } from "../inventory/enums/ProductStatus.enum";

import { getBestCampaign } from "../common/bestCampaign";

import { Campaign } from "../campaigns/entities/campaign.entity";
import { OrderPreviewV2Dto } from './dtos/OrderPreviewV2Dto';

@Injectable()
export class OrderServiceV2 {
    private readonly logger = new Logger(OrderServiceV2.name);

    constructor(
        @InjectRepository(CartItem) private cartRepository: Repository<CartItem>,
        @InjectRepository(CustomerAddress) private readonly addressRepository: Repository<CustomerAddress>,
        @InjectRepository(Coupon) private readonly couponRepository: Repository<Coupon>,
        @InjectRepository(GlobalCoupon) private readonly globalCouponRepository: Repository<GlobalCoupon>,
        @InjectRepository(KeyValuePair) private readonly keyValuePairRepository: Repository<KeyValuePair>,
        @Inject(ExchangeRateService) private readonly exchangeRateService: ExchangeRateService,
        @Inject(PricingService) private readonly pricingService: PricingService,
    ) { }

    /**
    * order preview
    * @param customer
    * @returns
    */
    async orderPreviewV2(customer: Customer, body: OrderPreviewV2Dto): Promise<OrderPreviewResponse> {
        try {
            // Get cart items with relations
            const cartItems = await this.cartRepository.find({
                where: {
                    customer: { id: customer.id },
                    uuid: In(body.cartItemUuids),
                    product: {
                        status: ProductStatus.ACTIVE,
                    }
                },
                relations: {
                    product: {
                        productCategories: {
                            category: {
                                campaignCategories: {
                                    campaign: true,
                                },
                            },
                        },
                    },
                    variant: {
                        inventoryItem: {
                            levels: true
                        },
                        images: true,
                        optionValues: {
                            optionValue: {
                                option: true
                            }
                        }
                    }
                }
            });

            if (!cartItems || cartItems.length === 0) {
                throw new BadRequestException(
                    'Cart is empty'
                );
            }

            // await Promise.all(
            //     cartItems.map(async (item) => {
            //         const checkProduct = await this.productRepository.findOne({
            //             where: {
            //                 id: item.product.id,
            //             },
            //         });

            //         if (!checkProduct) {
            //             throw new BadRequestException(
            //                 `Product not found`,
            //             );
            //         }

            //         if (checkProduct.status !== ProductStatus.ACTIVE) {
            //             throw new BadRequestException(
            //                 `Cannot create order for the non-active product ${checkProduct.slug}`,
            //             );
            //         }
            //     })
            // );

            const address = await this.addressRepository.findOne({
                where: {
                    customer: { id: customer.id },
                    isDefault: true,
                },
            });

            if (!address) {
                throw new BadRequestException(
                    'User address cannot be found.'
                );
            }

            // Validate cart items and prepare for shipping calculation
            const validatedItems: CartItem[] = [];
            let subTotal = 0;

            let campaign: Campaign | null = null;

            for (const item of cartItems) {
                // Check stock availability
                const stock = calculateStock(item.variant);

                if (stock < item.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock for ${item.product.titleEn} - ${item.variant.titleEn}`
                    );
                }

                campaign = getBestCampaign(item.product);

                // const priceAmount = await this.pricingService.applyPriceOnProductVariant(item.product, item.variant, null, item.subTotal.currencyCode, false);
                const priceDiscount = await this.pricingService.applyPriceOnProductVariant(item.product, item.variant, campaign, body.currency, true);

                const itemTotal = priceDiscount.amount * item.quantity;
                subTotal += itemTotal;

                item.availableStock = stock;
                item.isAvailable = stock > 0;

                item.subTotal = {
                    amount: priceDiscount.amount * item.quantity,
                    minorAmount: 0,
                    currencyCode: priceDiscount.currencyCode,
                };
                item.discountPrice = {
                    amount: 0,
                    minorAmount: 0,
                    currencyCode: priceDiscount.currencyCode,
                };
                item.total = {
                    amount: priceDiscount.amount * item.quantity,
                    minorAmount: 0,
                    currencyCode: priceDiscount.currencyCode,
                };

                validatedItems.push(item);
            }

            const [exchangeRates] = await Promise.all([
                this.exchangeRateService.findAll("", "")
            ]);
            const currency = cartItems[0]?.subTotal.currencyCode;

            const freeShippingExchangeRate = 1 / (exchangeRates.find((rate) => rate.srcCurrencyCode === currency && rate.targetCurrencyCode === 'qar')?.factor || 1);

            let shippingCost = 0;
            let eta = "";
            let shippingCalculation: ShippingCalculationResult | null = null;

            // Fetch free shipping threshold once
            const freeShippingValue = Number(
                (await this.keyValuePairRepository.findOne({
                    where: { name: `free_shipping_above_${currency}`.toLowerCase().trim() }
                }))?.integerValue
            ) || 0;

            const freeShippingEnabled = Boolean(
                (await this.keyValuePairRepository.findOne({
                    where: {
                        name: "free_shipping_enabled",
                        type: KeyValuePairType.Boolean
                    }
                }))?.booleanValue
            ) || false;

            // Decide if we should charge shipping
            const shouldApplyShipping = !freeShippingEnabled || freeShippingValue === null || subTotal < (freeShippingValue * freeShippingExchangeRate);


            if (shouldApplyShipping) {
                const shippingCartItems = cartItems.map(item => ({
                    weight: item.variant.weight,
                    quantity: item.quantity,
                }));

                shippingCalculation = calculateCartShipping(
                    shippingCartItems,
                    address.country,
                    body.currency,
                    exchangeRates,
                    subTotal
                );

                shippingCost = Math.ceil(shippingCalculation.totalShippingCost);
                eta = shippingCalculation.transitTime.estimatedRange;
            }

            // COUPON VALIDATION & DISCOUNT
            let discount = 0;
            if (body?.couponCode) {
                let coupon: Coupon | GlobalCoupon | null = null;
                const affiliateCoupon = await this.couponRepository.findOne({
                    where: { code: body.couponCode?.toLowerCase().trim() },
                    relations: {
                        affiliate: {
                            customer: true,
                            wallet: true,
                        },
                    },
                });

                if (campaign && affiliateCoupon) {
                    throw new BadRequestException(
                        "Coupon cannot be applied. Campaign products exists."
                    )
                }

                coupon = affiliateCoupon;

                if (!affiliateCoupon) {
                    const globalCoupon = await this.globalCouponRepository.findOne({
                        where: { code: body.couponCode?.toLowerCase().trim() },
                    });
                    if (!globalCoupon) {
                        throw new BadRequestException(
                            "Coupon does not exists. Please try again with valid coupon."
                        )
                    }
                    if (globalCoupon.timesUsed === globalCoupon.usageLimit) {
                        throw new BadRequestException(
                            "Coupon usage limit exceeded. Please try again with valid coupon."
                        )
                    }
                    coupon = globalCoupon;
                }
                if (coupon) {
                    discount = calculateCouponDiscount(coupon, subTotal, customer.uuid);
                    // discount = Math.ceil(discount);
                }
            }

            // let subTotalInQar = subTotal;
            // if (currency.toLowerCase().trim() !== "qar") {

            //     const exchangeRate = exchangeRates
            //         .filter(exchangeRate => exchangeRate.srcCurrencyCode.toLowerCase().trim() === currency.toLowerCase().trim() && exchangeRate.targetCurrencyCode.toLowerCase().trim() === 'qar')
            //         .at(0) ?? null;

            //     if (!exchangeRate) {
            //         throw new NotFoundException({
            //             error: `Exchange Rate for ${currency} to qar not found`
            //         });
            //     }

            //     subTotalInQar = subTotal * exchangeRate.factor;
            // }

            // Calculate total order amount
            const totalAmount = subTotal + shippingCost - discount;

            // Return complete order preview
            const orderPreview: OrderPreviewResponse = {
                items: validatedItems,
                shippingAddress: address,
                cart_total: subTotal,
                discount: discount,
                shipping: shippingCalculation,
                shippingTotal: shippingCost,
                grand_total: totalAmount,
                eta: eta,
            };

            const min_order_amount = Number(
                (await this.keyValuePairRepository.findOne({
                    where: {
                        name: `min_order_amount_${currency}`,
                        type: KeyValuePairType.Integer
                    }
                }))?.integerValue
            ) || 0;

            if (subTotal < min_order_amount) {
                orderPreview.orderTotalWarning = "Order value should not be less than 250 QAR"
            }

            return orderPreview;
        } catch (error: any) {
            this.logger.error(`Error getting order preview: ${error?.response?.error || error}`);
            if (error instanceof HttpException) {
                throw error;
            } else {
                throw new InternalServerErrorException({
                    error: 'Failed to get order preview',
                    details: error?.response?.error || error,
                });
            }
        }
    }
}
