import { Injectable } from "@nestjs/common";

import { PaymentProvider } from "../enums/PaymentProvider";

import { PaymentStrategy } from "../interfaces/PaymentStrategy";

@Injectable()
export class PaymentStrategyFactory {
    private strategies = new Map<PaymentProvider, PaymentStrategy>();

    register(provider: PaymentProvider, strategy: PaymentStrategy) {
        this.strategies.set(provider, strategy);
        console.log("this.strategiesthis.strategiesthis.strategies",this.strategies)
    }

    getStrategy(provider: PaymentProvider): PaymentStrategy {
        const strategy = this.strategies.get(provider);

        if (!strategy) {
        throw new Error(`No strategy found for ${provider}`);
        }

        return strategy;
    }
}