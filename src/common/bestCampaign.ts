import { Campaign } from "../campaigns/entities/campaign.entity";

import { Product } from "../inventory/entities/product.entity";

export function getBestCampaign(product: Product): Campaign | null {
    const campaigns = product.productCategories
        .flatMap(pc => pc.category?.campaignCategories ?? [])
        .map(cc => cc.campaign)
        .filter(
            campaign =>
                campaign &&
                campaign.isActive &&
                campaign.startsAt <= new Date() &&
                campaign.finishesAt >= new Date(),
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