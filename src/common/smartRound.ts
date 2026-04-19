export function smartRoundInt(
    value: number,
    threshold: number = 0.5
): number {
    const num = value;

    const integerPart = Math.floor(num);
    const decimalPart = num - integerPart;

    // Decide rounding direction
    return decimalPart >= threshold
        ? integerPart + 1   // ceil
        : integerPart;      // floor
}