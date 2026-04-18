import { Injectable } from "@nestjs/common";

import { PaymentProvider } from "../enums/PaymentProvider";

import { PaymentStrategy } from "../types";

@Injectable()
export class PaymentStrategyFactory {
    private static strategies = new Map<PaymentProvider, PaymentStrategy>();

    /**
	 * Register provider and strategy
	 *
	 * @param provider
	 * @param strategy
	 * @returns
	 */
    register(provider: PaymentProvider, strategy: PaymentStrategy) {
        // register the strategies for providers
        PaymentStrategyFactory.strategies.set(provider, strategy);
    }

    /**
	 * Fetch strategy
	 *
	 * @param provider
	 * @returns
	 */
    getStrategy(provider: PaymentProvider): PaymentStrategy {
        // fetch strategy for specific provider
        const strategy = PaymentStrategyFactory.strategies.get(provider);

        if (!strategy) {
        throw new Error(`No strategy found for ${provider}`);
        }

        return strategy;
    }
}