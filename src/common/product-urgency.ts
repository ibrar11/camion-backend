import crypto from "node:crypto";

export function generateDeterministicUrgencyStockCount(
	productId: number,
	campaignId: number,
	minStockCount: number,
	maxStockCount: number,
): number {
	const lower = Math.floor(Math.min(minStockCount, maxStockCount));
	const upper = Math.floor(Math.max(minStockCount, maxStockCount));
	const span = upper - lower + 1;

	if (span <= 1) {
		return lower;
	}

	const seed = `${productId}:${campaignId}:${lower}:${upper}`;
	const hash = crypto.createHash("sha256").update(seed).digest();
	const value = hash.readUInt32BE(0);

	return lower + (value % span);
}
