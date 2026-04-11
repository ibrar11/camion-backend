export const generateSlug = (input: string): string => {
	if (input === null || input === undefined || input.length === 0) {
		return "";
	}

	return input
		.normalize("NFKD")					// Returns the Unicode Normalization Form of this string
		.replace(/[\u0300-\u036f]/g, '')	// Remove accents
		.toLowerCase()						// Convert the string to lower case
		.trim()								// Remove whitespace from each end of the string
		.replace(/[^a-z0-9\s-]/g, '')		// Remove invalid characters
		.replace(/\s+/g, '-')				// Replace spaces with hypens
		.replace(/-+/g, '-')				// Merge multiple hypens into the same hypen
		.replace(/^-+|-+$/g, '')			// Remove hyphens on each end of the string
		.slice(0,63)                        // Remove more character than 63 on each end of the string
};
