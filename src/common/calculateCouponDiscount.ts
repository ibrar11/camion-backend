import {
    BadRequestException
} from "@nestjs/common";

import { Coupon } from "../referral/entities/coupon.entity";
import { GlobalCoupon } from "../referral/entities/global-coupon.entity";

import { Affiliate } from "../referral/entities/affiliate.entity";

export function calculateCouponDiscount(
    coupon: Coupon | GlobalCoupon,
    orderSubtotal: number,
    customerId?: string,
): number {
    try {
        // Check if coupon is expired
        if (coupon.expiresAt < new Date()) {
            throw new BadRequestException({
                error: "This coupon has expired. Please use a different coupon."
            });
        }

        if ('affiliate' in coupon) {
            // Check if affiliate is active
            if (coupon.affiliate.status !== 'accepted') {
                throw new BadRequestException({
                    error: "This coupon is currently unavailable."
                });
            }

            // Prevent customer from using their own coupon
            if (customerId && coupon.affiliate?.customer?.uuid === customerId) {
                throw new BadRequestException({
                    error: "You cannot use your own affiliate coupon."
                });
            }

            // Calculate discount amount
            const discountAmount = Math.ceil((orderSubtotal * coupon.discountPercentage) / 100);

            return discountAmount;
        }

        if ('discountType' in coupon && coupon.discountType === "fixed") {
            if (coupon.discountValue > orderSubtotal) {
                return orderSubtotal;
            }
            return coupon.discountValue;
        }

        // Calculate discount amount
        const discountAmount = Math.ceil((orderSubtotal * coupon.discountPercentage) / 100);

        return discountAmount;
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