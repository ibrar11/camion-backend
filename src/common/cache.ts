import { generateSlug } from "./slug";

/**
 * Generates a redis key
 *
 * @param rootName
 * @param parentName
 * @param children
 * @returns
 */
export function generateCacheKey(rootName: string, parentName: string, children: Array<string | number | boolean>): string {
	if (children === null || children === undefined || children.length === 0) {
		children = [];
	}

	if (!rootName) {
		rootName = "";
	}

	if (!parentName) {
		parentName = "";
	}

	return `cache:${rootName}:${parentName}:${children.map((value, i) => `arg${i + 1}=${value}`).join(":")}`;
};

/**
 * Generates a redis key for search
 *
 * @param rootName
 * @param query
 * @param children
 * @returns
 */
export function generateSearchCacheKey(rootName: string, query: string, children: Array<string | number | boolean>): string {
	return generateCacheKey(rootName, `q:${generateSlug(query)}`, children);
}
