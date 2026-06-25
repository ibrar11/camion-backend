import { Campaign } from "../campaigns/entities/campaign.entity";

import { Product } from "../inventory/entities/product.entity";

export function getBestCampaign(product: Product): Campaign | null {
    if (product === null || !Array.isArray(product.productCategories) || product.productCategories.length === 0) {
        return null;
    }

    const campaigns = product.productCategories
        .flatMap(pc => pc.category?.campaignCategories ?? [])
        .map(cc => cc.campaign)
        .filter(
            campaign =>
                campaign &&
                campaign.isActive &&
                new Date(campaign.startsAt).getTime() <= new Date().getTime() &&
                new Date(campaign.finishesAt).getTime() >= new Date().getTime(),
        );

    if (!campaigns.length) {
        return null;
    }

    return campaigns.reduce((best, current) =>
        current.discountPercentage > best.discountPercentage
            ? current
            : best
    );
}