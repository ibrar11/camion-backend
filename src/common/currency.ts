import { CurrencyCode } from "../inventory/enums/CurrencyCode.enum";

/**
 * Acts as the core encapsulation of the Money object across the Camion app.
 *
 * It is intended to avoid floating-point precision issues in financial calculations
 * by preserving a normalized minor-unit representation.
 */
export class Money {
	/**
	 * A major-unit representation (dollars, euros, rial, etc.) for display and readability
	 */
	readonly amount: number;

	/**
	 * A minor-unit representation (cents, pence, dinar, etc.) for precise calculations
	 */
	readonly minorAmount: number;

	/**
	 * The ISO 4217 currency code for this monetary value.
	 */
	readonly currencyCode: CurrencyCode;
}

export const normalizeCurrencyCode = (
	currencyCode: CurrencyCode | string | null | undefined,
	fallback: CurrencyCode = CurrencyCode.QAR,
): CurrencyCode => {
	const normalized = String(currencyCode ?? fallback).trim().toLowerCase();
	return (normalized || fallback) as CurrencyCode;
};

/**
 * Converts money to floats
 *
 * ```ts
 * const value = moneyToFloat({
 * 	amount: 27,
 * 	minorAmount: 20,
 * 	currencyCode: CurrencyCode.QAR,
 * });
 * console.log(value);
 * => 27.2
 * ```
 *
 * @param money
 * @returns
 */
export const moneyToFloat = (money: Money): number => {
	return money.amount + (money.minorAmount / 100);
};

/**
 * Converts money to string
 *
 * ```ts
 * const value = moneyToString({
 * 	amount: 27,
 * 	minorAmount: 20,
 * 	currencyCode: CurrencyCode.QAR,
 * });
 * console.log(value);
 * => "27.20"
 * ```
 *
 * @param money
 * @returns
 */
export const moneyToString = (money: Money): string => {
	// Handle when minor amount is 0
	if (money.minorAmount === 0) {
		return `${money.amount}.00`;
	}

	// Handle when minor amount is 1..9
	if (money.minorAmount <= 9) {
		return `${Math.trunc(money.amount)}.${`${Math.trunc(money.minorAmount) / 100}`.substring(2)}`;
	}

	return `${Math.trunc(money.amount)}.${Math.trunc(money.minorAmount)}`;
};

/**
 * Converts the money to minor units
 *
 * ```ts
 * const value = moneyToMinor({
 * 	amount: 27,
 * 	minorAmount: 20,
 * 	currencyCode: CurrencyCode.QAR,
 * });
 * console.log(value);
 * => 2720
 * ```
 *
 * @param money
 * @returns
 */
export const moneyToMinor = (money: Money): number => {
	return (money.amount * 100) + money.minorAmount;
}

/**
 * Converts a minor-unit integer back into a Money object
 *
 * ```ts
 * const value = moneyFromMinor(2720, CurrencyCode.QAR);
 * console.log(value);
 * => { amount: 27, minorAmount: 20, currencyCode: "qar" }
 * ```
 *
 * @param minorUnits
 * @param currencyCode
 * @returns
 */
export const moneyFromMinor = (minorUnits: number, currencyCode: CurrencyCode): Money => {
	return {
		amount: Math.trunc(minorUnits / 100),
		minorAmount: minorUnits % 100,
		currencyCode,
	};
}

/**
 * Converts a floating-point monetary value into a Money object
 *
 * ```ts
 * const value = moneyFromFloat(27.2, CurrencyCode.QAR);
 * console.log(value);
 * => { amount: 27, minorAmount: 2, currencyCode: "qar" }
 * ```
 *
 * @param value
 * @param currencyCode
 * @returns
 */
export const moneyFromFloat = (
	value: number,
	currencyCode: CurrencyCode
): Money => {
	const [amount, minor = "0"] = value.toString().split(".");

	return {
		amount: Number(amount),
		minorAmount: Number(minor),
		currencyCode,
	};
};

/**
 * Adds 2 objects of money
 *
 * ```ts
 * const value = addMoney(
 * 	{ amount: 11, minorAmount: 60, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 15, minorAmount: 60, currencyCode: CurrencyCode.QAR, },
 * );
 * console.log(value);
 * => { amount: 27, minorAmount: 20, currencyCode: "qar" }
 * ```
 *
 * @param moneyA
 * @param moneyB
 * @returns
 */
export const addMoney = (moneyA: Money, moneyB: Money): Money => {
	// Handle first null case
	if (moneyA === undefined || moneyA === null) {
		return {
			amount: 0,
			minorAmount: 0,
			currencyCode: CurrencyCode.USD,
		};
	}

	// Handle second null case
	if (moneyB === undefined || moneyB === null) {
		return moneyA;
	}

	// Make sure we have same currency on both sides
	if (moneyA.currencyCode !== moneyB.currencyCode) {
		throw "Make sure the currency on both sides is same.";
	}

	// Combine the major and minor amounts
	let totalAmount = moneyA.amount + moneyB.amount;
	let totalMinorAmount = moneyA.minorAmount + moneyB.minorAmount;

	// Handle carry-over if minor amount is more than 100
	if (totalMinorAmount >= 100) {
		const carryOverAmount = Math.trunc(totalMinorAmount / 100);
		totalAmount += carryOverAmount;
		totalMinorAmount = totalMinorAmount % 100;
	}

	return {
		amount: totalAmount,
		minorAmount: totalMinorAmount,
		currencyCode: moneyA.currencyCode,
	};
};

/**
 * Adds a percentage to the money
 *
 * ```ts
 * const subTotal = {
 * 	amount: 100,
 * 	minorAmount: 0,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 * const value = addMoneyPercentage(subTotal, 18);
 * console.log(value);
 * => { amount: 118, minorAmount: 0, currencyCode: "qar" }
 * ```
 *
 * @param money
 * @param percentage
 * @returns
 */
export const addMoneyPercentage = (money: Money, percentage: number): Money => {
	if (money === undefined || money === null) {
		return {
			amount: 0,
			minorAmount: 0,
			currencyCode: CurrencyCode.USD,
		};
	}

	// Minus the percentage from the amount
	const totalDestMinor = ((money.amount * 100) + money.minorAmount) * (1 + (percentage / 100));

	return {
		amount: Math.trunc(totalDestMinor / 100),
		minorAmount: totalDestMinor % 100,
		currencyCode: money.currencyCode,
	};
};

/**
 * Subtracts 2 objects of money
 *
 * ```ts
 * const value = subtractMoney(
 * 	{ amount: 10, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 9, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * );
 * console.log(value);
 * => { amount: 1, minorAmount: 0, currencyCode: "qar" }
 * ```
 *
 * @param moneyA
 * @param moneyB
 * @returns
 */
export const subtractMoney = (moneyA: Money, moneyB: Money): Money => {
	// Handle first null case
	if (moneyA === undefined || moneyA === null) {
		return {
			amount: 0,
			minorAmount: 0,
			currencyCode: CurrencyCode.USD,
		};
	}

	// Handle second null case
	if (moneyB === undefined || moneyB === null) {
		return moneyA;
	}

	// Make sure we have same currency on both sides
	if (moneyA.currencyCode !== moneyB.currencyCode) {
		throw "Make sure the currency on both sides is same.";
	}

	// Perform the subtraction
	const diffInMinor = ((moneyA.amount * 100) + moneyA.minorAmount) - ((moneyB.amount * 100) + moneyB.minorAmount);

	return {
		amount: Math.trunc(diffInMinor / 100),
		minorAmount: diffInMinor % 100,
		currencyCode: moneyA.currencyCode,
	};
};

/**
 * Subtracts a percentage from the money
 *
 * ```ts
 * const subTotal = {
 * 	amount: 100,
 * 	minorAmount: 0,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 * const value = subtractMoneyPercentage(subTotal, 10);
 * console.log(value);
 * => { amount: 90, minorAmount: 0, currencyCode: "qar" }
 * ```
 *
 * @param money
 * @param percentage
 * @returns
 */
export const subtractMoneyPercentage = (money: Money, percentage: number): Money => {
	if (money === undefined || money === null) {
		return {
			amount: 0,
			minorAmount: 0,
			currencyCode: CurrencyCode.USD,
		};
	}

	// Minus the percentage from the amount
	const totalDestMinor = ((money.amount * 100) + money.minorAmount) * (1 - (percentage / 100));

	return {
		amount: Math.trunc(totalDestMinor / 100),
		minorAmount: totalDestMinor % 100,
		currencyCode: money.currencyCode,
	};
};

/**
 * Multiplies a currency by a factor
 *
 * ```ts
 * const money = {
 * 	amount: 11,
 * 	minorAmount: 60,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 * const value = multiplyMoney(money, 2);
 * console.log(value);
 * => { amount: 23, minorAmount: 20, currencyCode: "qar" }
 * ```
 *
 * @param money
 * @param factor
 * @returns
 */
export const multiplyMoney = (money: Money, factor: number): Money => {
	if (money === undefined || money === null) {
		return {
			amount: 0,
			minorAmount: 0,
			currencyCode: CurrencyCode.USD,
		};
	}

	// Multiply the total minor amount by a factor
	const totalDestMinor = Math.ceil(((money.amount * 100) + money.minorAmount) * factor);

	return {
		amount: Math.trunc(totalDestMinor / 100),
		minorAmount: totalDestMinor % 100,
		currencyCode: money.currencyCode,
	};
};

/**
 * Converts cost to price using pricing factor and exchangeRateFactor
 *
 * ```ts
 * const cost = {
 * 	amount: 14,
 * 	minorAmount: 0,
 * 	currencyCode: CurrencyCode.CNY,
 * };
 *
 * // Calculate base price
 * const basePrice = getBasePrice(cost, CurrencyCode.QAR, 7, 0.53);
 * console.log(basePrice);
 * => { amount: 51, minorAmount: 94, currencyCode: "qar" }
 * ```
 *
 * @param cost
 * @param currencyCode
 * @param pricingFactor
 * @param exchangeRateFactor
 * @returns
 */
export const getBasePrice = (
	cost: Money,
	currencyCode: CurrencyCode,
	pricingFactor: number,
	exchangeRateFactor: number,
): Money => {
	// Apply the exchange rate
	let totalDestMinor = Math.ceil(((cost.amount * 100) + cost.minorAmount) * pricingFactor * exchangeRateFactor);

	return {
		amount: Math.trunc(totalDestMinor / 100),
		minorAmount: totalDestMinor % 100,
		currencyCode: currencyCode,
	};
};

/**
 * Converts cost to price using pricing factor, exchangeRateFactor and discountPercentage
 *
 * ```ts
 * const cost = {
 * 	amount: 14,
 * 	minorAmount: 0,
 * 	currencyCode: CurrencyCode.CNY,
 * };
 *
 * // Calculate the discounted price
 * const discountedPrice = getDiscountedPrice(cost, CurrencyCode.QAR, 7, 0.53, 50);
 * console.log(discountedPrice);
 * => { amount: 25, minorAmount: 97, currencyCode: "qar" }
 * ```
 *
 * @param cost
 * @param currencyCode
 * @param pricingFactor
 * @param exchangeRateFactor
 * @param discountPercentage
 * @returns
 */
export const getDiscountedPrice = (
	cost: Money,
	currencyCode: CurrencyCode,
	pricingFactor: number,
	exchangeRateFactor: number,
	discountPercentage: number,
) => {
	// Apply the exchange rate
	let totalDestMinor = Math.ceil(((cost.amount * 100) + cost.minorAmount) * pricingFactor * exchangeRateFactor);

	// Apply discount if discount percentage is not zero.
	if (discountPercentage !== 0) {
		totalDestMinor = Math.ceil(totalDestMinor * (1 - (discountPercentage / 100)));
	}

	return {
		amount: Math.trunc(totalDestMinor / 100),
		minorAmount: totalDestMinor % 100,
		currencyCode: currencyCode,
	};
};

/**
 * Converts cost to price using exchangeRateFactor
 *
 * ```ts
 * const cost = {
 * 	amount: 14,
 * 	minorAmount: 0,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 *
 * const totalDestMinor = Math.ceil(((cost.amount * 100) + cost.minorAmount) * exchangeRateFactor);
 * console.log(totalDestMinor);
 * => { amount: 25, minorAmount: 97, currencyCode: "qar" }
 * ```
 *
 * @param cost
 * @param currencyCode
 * @param exchangeRateFactor
 * @returns
 */
export const getExchangedPrice = (
	cost: Money,
	currencyCode: CurrencyCode,
	exchangeRateFactor: number,
) => {
	// Apply the exchange rate
	const totalDestMinor = Math.ceil(((cost.amount * 100) + cost.minorAmount) * exchangeRateFactor);

	return {
		amount: Math.trunc(totalDestMinor / 100),
		minorAmount: totalDestMinor % 100,
		currencyCode: currencyCode,
	};
};

/**
 * Sums the list of money objects
 *
 * ```ts
 * const arr: Array<Money> = [
 * 	{ amount: 10, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 10, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 10, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 10, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 10, minorAmount: 45, currencyCode: CurrencyCode.QAR, },
 * ];
 * const value = sumMoney(arr);
 * console.log(value);
 * => { amount: 50, minorAmount: 45, currencyCode: "qar" }
 * ```
 *
 * @param arr
 * @returns
 */
export const sumMoney = (arr: Array<Money>): Money => {
	if (!Array.isArray(arr) || arr.length === 0) {
		return {
			amount: 0,
			minorAmount: 0,
			currencyCode: CurrencyCode.USD,
		};
	}

	// Convert all major amounts to minor amounts
	const totalMinorAmount = arr.reduce((previousValue, current) => {
		return previousValue + ((current.amount * 100) + current.minorAmount);
	}, 0);

	return {
		amount: Math.trunc(totalMinorAmount / 100),
		minorAmount: totalMinorAmount % 100,
		currencyCode: arr[0].currencyCode,
	};
};

/**
 * Returns the maximum money from the list
 *
 * ```ts
 * const arr: Array<Money> = [
 * 	{ amount: 20, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 10, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 10, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 10, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 10, minorAmount: 45, currencyCode: CurrencyCode.QAR, },
 * ];
 * const value = maxMoney(arr);
 * console.log(value);
 * => { amount: 20, minorAmount: 0, currencyCode: "qar" }
 * ```
 *
 * @param arr
 * @returns
 */
export const maxMoney = (arr: Array<Money>): Money => {
	if (!Array.isArray(arr) || arr.length === 0) {
		return {
			amount: 0,
			minorAmount: 0,
			currencyCode: CurrencyCode.USD,
		};
	}

	// Convert all the values to their minor units and get the maximum value from it.
	const max = Math.max(...(arr.map(value => (value.amount * 100) + value.minorAmount)));

	// Convert the maximum value back to money
	return {
		amount: Math.trunc(max / 100),
		minorAmount: max % 100,
		currencyCode: arr[0].currencyCode,
	};
};

/**
 * Returns the minimum money from the list
 *
 * ```ts
 * const arr: Array<Money> = [
 * 	{ amount: 20, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 10, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 10, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 10, minorAmount: 0, currencyCode: CurrencyCode.QAR, },
 * 	{ amount: 10, minorAmount: 45, currencyCode: CurrencyCode.QAR, },
 * ];
 * const value = minMoney(arr);
 * console.log(value);
 * => { amount: 10, minorAmount: 0, currencyCode: "qar" }
 * ```
 *
 * @param arr
 * @returns
 */
export const minMoney = (arr: Array<Money>): Money => {
	if (!Array.isArray(arr) || arr.length === 0) {
		return {
			amount: 0,
			minorAmount: 0,
			currencyCode: CurrencyCode.USD,
		};
	}

	// Convert all the values to their minor units and get the minimum value from it.
	const min = Math.min(...(arr.map(value => (value.amount * 100) + value.minorAmount)));

	// Convert the minimum value back to money
	return {
		amount: Math.trunc(min / 100),
		minorAmount: min % 100,
		currencyCode: arr[0].currencyCode,
	};
};

/**
 * Implements a lesser-than operator on money objects
 *
 * ```ts
 * const moneyA: Money = {
 * 	amount: 100,
 * 	minorAmount: 50,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 * const moneyB: Money = {
 * 	amount: 200,
 * 	minorAmount: 50,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 * const value = isLesserThan(moneyA, moneyB);
 * console.log(value);
 * => true
 * ```
 *
 * @param lhs
 * @param rhs
 * @returns
 */
export const isLesserThan = (lhs: Money, rhs: Money): boolean => {
	if (lhs === undefined || lhs === null) {
		throw "Please pass a valid value for money A";
	}

	if (rhs === undefined || rhs === null) {
		throw "Please pass a valid value for money B";
	}

	if (lhs.currencyCode !== rhs.currencyCode) {
		throw "Please make sure you have the same currency on both sides.";
	}

	return ((lhs.amount * 100) + lhs.minorAmount) < ((rhs.amount * 100) + rhs.minorAmount);
};

/**
 * Implements a greater-than operator on money objects
 *
 * ```ts
 * const moneyA: Money = {
 * 	amount: 200,
 * 	minorAmount: 50,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 * const moneyB: Money = {
 * 	amount: 100,
 * 	minorAmount: 50,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 * const value = isGreaterThan(moneyA, moneyB);
 * console.log(value);
 * => true
 * ```
 *
 * @param lhs
 * @param rhs
 * @returns
 */
export const isGreaterThan = (lhs: Money, rhs: Money): boolean => {
	if (lhs === undefined || lhs === null) {
		throw "Please pass a valid value for money A";
	}

	if (rhs === undefined || rhs === null) {
		throw "Please pass a valid value for money B";
	}

	if (lhs.currencyCode !== rhs.currencyCode) {
		throw "Please make sure you have the same currency on both sides.";
	}

	return ((lhs.amount * 100) + lhs.minorAmount) > ((rhs.amount * 100) + rhs.minorAmount);
};

/**
 * Implements a lesser-than-or-equal-to operator on money objects
 *
 * ```ts
 * const moneyA: Money = {
 * 	amount: 100,
 * 	minorAmount: 50,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 * const moneyB: Money = {
 * 	amount: 200,
 * 	minorAmount: 50,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 * const value = isLesserThanOrEqualTo(moneyA, moneyB);
 * console.log(value);
 * => true
 * ```
 *
 * @param lhs
 * @param rhs
 * @returns
 */
export const isLesserThanOrEqualTo = (lhs: Money, rhs: Money): boolean => {
	if (lhs === undefined || lhs === null) {
		throw "Please pass a valid value for money A";
	}

	if (rhs === undefined || rhs === null) {
		throw "Please pass a valid value for money B";
	}

	if (lhs.currencyCode !== rhs.currencyCode) {
		throw "Please make sure you have the same currency on both sides.";
	}

	return ((lhs.amount * 100) + lhs.minorAmount) <= ((rhs.amount * 100) + rhs.minorAmount);
};

/**
 * Implements a greater-than-or-equal-to operator on money objects
 *
 * ```ts
 * const moneyA: Money = {
 * 	amount: 200,
 * 	minorAmount: 50,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 * const moneyB: Money = {
 * 	amount: 100,
 * 	minorAmount: 50,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 * const value = isGreaterThanOrEqualTo(moneyA, moneyB);
 * console.log(value);
 * => true
 * ```
 *
 * @param lhs
 * @param rhs
 * @returns
 */
export const isGreaterThanOrEqualTo = (lhs: Money, rhs: Money): boolean => {
	if (lhs === undefined || lhs === null) {
		throw "Please pass a valid value for money A";
	}

	if (rhs === undefined || rhs === null) {
		throw "Please pass a valid value for money B";
	}

	if (lhs.currencyCode !== rhs.currencyCode) {
		throw "Please make sure you have the same currency on both sides.";
	}

	return ((lhs.amount * 100) + lhs.minorAmount) >= ((rhs.amount * 100) + rhs.minorAmount);
};

/**
 * Implements an equals-to operator on money objects
 *
 * ```ts
 * const moneyA: Money = {
 * 	amount: 200,
 * 	minorAmount: 50,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 * const moneyB: Money = {
 * 	amount: 200,
 * 	minorAmount: 50,
 * 	currencyCode: CurrencyCode.QAR,
 * };
 * const value = isEqual(moneyA, moneyB);
 * console.log(value);
 * => true
 * ```
 *
 * @param lhs
 * @param rhs
 * @returns
 */
export const isEqual = (lhs: Money, rhs: Money): boolean => {
	if (lhs === undefined || lhs === null) {
		throw "Please pass a valid value for money A";
	}

	if (rhs === undefined || rhs === null) {
		throw "Please pass a valid value for money B";
	}

	if (lhs.currencyCode !== rhs.currencyCode) {
		throw "Please make sure you have the same currency on both sides.";
	}

	return ((lhs.amount * 100) + lhs.minorAmount) === ((rhs.amount * 100) + rhs.minorAmount);
};
