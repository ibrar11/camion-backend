import { BadRequestException } from '@nestjs/common';

import { WeightUnit } from 'src/inventory/enums/WeightUnit.enum';

import shippingRatesData from 'src/data/shipping-rates.json';

export interface WeightRange {
    min: number;
    max: number;
    ratePerKg: number;
    fixedFee: number;
}

export interface CountryShippingRate {
    country: string;
    countryCode: string;
    weightRanges: WeightRange[];
    transitDays: {
        min: number;
        max: number;
    };
    taxesAndFees?: {
        vat?: {
            rate: number;
            formula: string;
        };
        customsClearanceFee?: number;
    };
}

export interface HandlingFeeRange {
    min: number;
    max: number;
    feeUSD: number | string;
}

export interface ShippingCalculationInput {
    exchangeRates: ExchageRate;
    countryCode: string;
    totalWeightKg: number;
    declaredValue?: number;
    customsDuty?: number;
}

export interface ShippingCalculationResult {
    shippingFee: {
        amount: number;
        currency: string;
        breakdown: {
            weightCharge: number;
            fixedFee: number;
            ratePerKg: number;
        };
    };
    handlingFee: {
        amount: number;
        currency: string;
    };
    transitTime: {
        minDays: number;
        maxDays: number;
        estimatedRange: string;
    };
    taxesAndFees: {
        vat?: {
            rate: number;
            amount: number;
            formula: string;
        };
        customsClearanceFee?: {
            amount: number;
            formula: string;
        };
    };
    totalShippingCost: number;
    currency: string
    country: string;
    countryCode: string;
}

export interface CartItemForShipping {
    weight: {
        amount: number;
        unit: WeightUnit;
    };
    quantity: number;
}

export interface ExchageRate {
    cnyToTarget: number;
    usdToTarget: number;
    currency: string;
}

export interface ShippingRateResponse {
    rate: WeightRange;
    countryData: CountryShippingRate
}

export interface HandlingFeeResponse {
    amountUSD: number;
    amountCNY: number
}

export interface VATResponse {
    rate: number;
    amount: number;
    formula: string
}

export interface CustomFeeResponse {
    amount: number;
    formula: string
}

const SHIPPING_RATES = shippingRatesData.rates as CountryShippingRate[];
const HANDLING_FEES = shippingRatesData.handlingFees as HandlingFeeRange[];
const USD_TO_CNY = shippingRatesData.usdToCny;

/**
* Calculate shipping for a customer's cart
*
* @param cartItems
* @param countryCode
* @param declaredValue
* @returns
*/
export function calculateCartShipping(
    cartItems: CartItemForShipping[],
    countryCode: string,
    currency: string,
    declaredValue?: number
): ShippingCalculationResult {
    try {
        // Todo: exchage rate imeplementation (CNY -> target and USD -> target)

        const exchangeRates = {
            cnyToTarget: 0.15, // converting CNY → USD
            usdToTarget: 1, // target = USD
            currency: "USD",
        };

        const totalWeightKg = calculateTotalWeightFromCart(cartItems);
        const totalDeclaredValue = declaredValue || 0;

        return calculateShipping({
            exchangeRates,
            countryCode,
            totalWeightKg,
            declaredValue: totalDeclaredValue,
            customsDuty: 0,
        });
    } catch (error) {
        throw error;
    }
}


/**
* Calculate total weight from cart items
* @param cartItems
* @returns
*/
export function calculateTotalWeightFromCart(cartItems: CartItemForShipping[]): number {
    let totalWeightKg = 0;

    for (const item of cartItems) {
        const weightInKg = convertWeightToKg(item.weight.amount, item.weight.unit);
        totalWeightKg += weightInKg * item.quantity;
    }

    return totalWeightKg;
}

/**
* Convert weight to kilograms
* @param amount
* @param unit
* @returns
*/
export function convertWeightToKg(amount: number, unit: string): number {
    switch (unit) {
        case 'grams':
            return amount / 1000;
        case 'kilograms':
            return amount;
        case 'pounds':
            return amount * 0.453592;
        case 'ounces':
            return amount * 0.0283495;
        default:
            return amount;
    }
}


/**
* Main shipping calculation function
* @param input
*/
export function calculateShipping(input: ShippingCalculationInput): ShippingCalculationResult {
    try {
        const { exchangeRates, countryCode, totalWeightKg, declaredValue = 0, customsDuty = 0 } = input;

        if (!exchangeRates?.cnyToTarget || !exchangeRates?.usdToTarget) {
            throw new BadRequestException({
                error: 'Exchange rates are required'
            });
        }

        const { cnyToTarget, usdToTarget, currency } = exchangeRates;

        if (!countryCode) {
            throw new BadRequestException({
                error: 'Country code is required.'
            });
        }

        if (totalWeightKg <= 0) {
            throw new BadRequestException({
                error: 'Total weight must be greater than 0'
            });
        }

        // Get shipping rate
        const rateData = getShippingRate(countryCode, totalWeightKg);

        if (!rateData) {
            throw new BadRequestException({
                error: `No shipping rate found for ${countryCode} with weight ${totalWeightKg}kg`
            });
        }

        const { rate, countryData } = rateData;

        // Calculate base shipping fee
        const weightChargeCNY = rate.ratePerKg * totalWeightKg;
        const shippingFeeCNY = weightChargeCNY + rate.fixedFee;

        const shippingFee = convertCNYToTarget(shippingFeeCNY, cnyToTarget);

        // Calculate handling fee
        const handlingFeeRaw = calculateHandlingFee(totalWeightKg);
        const handlingFee = convertUSDToTarget(handlingFeeRaw.amountUSD, usdToTarget);

        // Calculate taxes and fees
        const vat = countryData.taxesAndFees?.vat
            && calculateVAT(countryData, declaredValue, customsDuty);

        const vatAmount = vat?.amount ?? 0;

        const isClearanceExist = countryData.taxesAndFees?.customsClearanceFee !== undefined;
        const customsFee = isClearanceExist ?
            {
                ...calculateCustomsFee(countryData),
                amount: convertCNYToTarget(
                    calculateCustomsFee(countryData).amount,
                    cnyToTarget
                ),
            }
            : null;

        const customsFeeAmount = customsFee ? customsFee.amount : 0;

        // Calculate total shipping cost (base shipping + handling + taxes)
        const totalShippingCost =
            shippingFee +
            handlingFee +
            vatAmount +
            customsFeeAmount;

        return {
            shippingFee: {
                amount: shippingFee,
                currency,
                breakdown: {
                    weightCharge: convertCNYToTarget(weightChargeCNY, cnyToTarget),
                    fixedFee: convertCNYToTarget(rate.fixedFee, cnyToTarget),
                    ratePerKg: convertCNYToTarget(rate.ratePerKg, cnyToTarget),
                },
            },
            handlingFee: {
                amount: handlingFee,
                currency,
            },
            transitTime: {
                minDays: countryData.transitDays.min,
                maxDays: countryData.transitDays.max,
                estimatedRange: `${countryData.transitDays.min}-${countryData.transitDays.max} working days`,
            },
            taxesAndFees: {
                ...(vat && { vat }),
                ...(customsFee && { customsClearanceFee: customsFee }),
            },
            totalShippingCost,
            currency,
            country: countryData.country,
            countryCode: countryData.countryCode,
        };
    } catch (error) {
        throw error;
    }
}

/**
* Get shipping rate for a specific country and weight
* @param countryCode
* @param weightKg
*/
export function getShippingRate(countryCode: string, weightKg: number): ShippingRateResponse {
    const countryData = SHIPPING_RATES.find(rate => (rate.countryCode === countryCode || rate.country === countryCode));

    if (!countryData) {
        throw new BadRequestException({
            error: `Unsupported country: ${countryCode}`
        });
    }

    const weightRange = countryData.weightRanges.find(
        range => weightKg >= range.min && weightKg <= range.max
    );

    if (!weightRange) {
        throw new BadRequestException({
            error: `No shipping rate for ${countryCode} at weight ${weightKg}kg`
        });
    }

    return { rate: weightRange, countryData };
}

/**
* Calculate handling fee based on weight
* @param weightKg
*/
export function calculateHandlingFee(weightKg: number): HandlingFeeResponse {
    const feeRange = HANDLING_FEES.find(range => weightKg > range.min && weightKg <= range.max);

    if (!feeRange) {
        return { amountUSD: 0, amountCNY: 0 };
    }

    let feeUSD = 0;

    if (typeof feeRange.feeUSD === 'string' && feeRange.feeUSD === 'perKg') {
        feeUSD = weightKg * 0.1;
    } else {
        feeUSD = feeRange.feeUSD as number;
    }

    return {
        amountUSD: feeUSD,
        amountCNY: feeUSD * USD_TO_CNY,
    };
}

/**
* Calculate VAT based on country rules
* @param countryData
* @param declaredValue
* @param customsDuty
*/
export function calculateVAT(
    countryData: CountryShippingRate,
    declaredValue: number,
    customsDuty: number = 0
): VATResponse {
    const vatConfig = countryData.taxesAndFees?.vat;

    if (!vatConfig) {
        throw new BadRequestException({
            error: `VAT not configured for ${countryData.country}`
        });
    }

    let amount = 0;
    let formula = vatConfig.formula;

    if (formula.includes('declaredValue + customsDuty')) {
        amount = (declaredValue + customsDuty) * (vatConfig.rate / 100);
        formula = `(${declaredValue} + ${customsDuty}) × ${vatConfig.rate}%`;
    } else if (formula.includes('declaredValue')) {
        amount = declaredValue * (vatConfig.rate / 100);
        formula = `${declaredValue} × ${vatConfig.rate}%`;
    }

    return {
        rate: vatConfig.rate,
        amount,
        formula,
    };
}

/**
* Calculate customs clearance fee
* @param countryData
*/
export function calculateCustomsFee(countryData: CountryShippingRate): CustomFeeResponse {
    const customsFee = countryData.taxesAndFees?.customsClearanceFee;

    if (!customsFee) {
        throw new BadRequestException({
            error: `Customs fee not configured for ${countryData.country}`
        });
    }

    return {
        amount: customsFee,
        formula: `${customsFee} CNY per item`,
    };
}

/**
* convert CNY to target
* @param amount
* @param rate
*/
function convertCNYToTarget(amount: number, rate: number): number {
    return amount * rate;
}

/**
* convert USD to target
* @param amount
* @param rate
*/
function convertUSDToTarget(amount: number, rate: number): number {
    return amount * rate;
}
