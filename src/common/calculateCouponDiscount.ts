import {
    BadRequestException
} from "@nestjs/common";

import { Coupon } from "../referral/entities/coupon.entity";
import { GlobalCoupon } from "../referral/entities/global-coupon.entity";

import { Money, moneyToMinor, moneyFromMinor, isGreaterThan } from "./currency";

export function calculateCouponDiscount(
    coupon: Coupon | GlobalCoupon,
    orderSubtotal: Money,
    customerId?: string,
): Money {
    try {
        // Check if coupon is expired
        if (coupon.expiresAt < new Date()) {
            throw new BadRequestException(
                "This coupon has expired. Please use a different coupon."
            );
        }

        const subtotalMinor = moneyToMinor(orderSubtotal);

        if ('affiliate' in coupon) {
            // Check if affiliate is active
            if (coupon.affiliate.status !== 'accepted') {
                throw new BadRequestException(
                    "This coupon is currently unavailable."
                );
            }

            // Prevent customer from using their own coupon
            if (customerId && coupon.affiliate?.customer?.uuid === customerId) {
                throw new BadRequestException(
                    "You cannot use your own affiliate coupon."
                );
            }

            // Calculate discount amount (minor-unit precise)
            const discountMinor = Math.ceil((subtotalMinor * coupon.discountPercentage) / 100);

            return moneyFromMinor(discountMinor, orderSubtotal.currencyCode);
        }

        if ('discountType' in coupon && coupon.discountType === "fixed") {
            // discountValue has no minor-unit component in the DB — major units only
            const fixedDiscount: Money = { amount: coupon.discountValue, minorAmount: 0, currencyCode: orderSubtotal.currencyCode };
            if (isGreaterThan(fixedDiscount, orderSubtotal)) {
                return orderSubtotal;
            }
            return fixedDiscount;
        }

        // Calculate discount amount (minor-unit precise)
        const discountMinor = Math.ceil((subtotalMinor * coupon.discountPercentage) / 100);

        return moneyFromMinor(discountMinor, orderSubtotal.currencyCode);
    } catch (error: any) {
        throw error;
    }
}

// export function calculateAffiliateCommission(
//     affiliate: Affiliate,
//     orderTotal: number,
//     discountAmount: number,
// ): number {
//     // Different commission rates for different affiliate types
//     let commissionRate = 0;

//     switch (affiliate.type) {
//         case 'affiliate':
//             commissionRate = 5; // 5% for regular affiliates
//             break;
//         case 'influencer':
//             commissionRate = 10; // 10% for influencers
//             break;
//         default:
//             commissionRate = 5;
//     }

//     // Calculate commission on the actual paid amount (after discount)
//     const paidAmount = orderTotal - discountAmount;
//     const commissionAmount = (paidAmount * commissionRate) / 100;

//     return Math.floor(commissionAmount); // Round down to nearest integer

// }