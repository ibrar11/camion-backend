/**
 * `Unauthorized`
 * `unauthenticated`
 * `forbidden`
 * `jwt`
 * `invalid token`
 */
export const BLACKLIST_REGEX = /\b(?:Unauthorized|unauthenticated|forbidden|jwt|invalid token)\b/gi;

// return title.replace(BLACKLIST_REGEX, match => "*".repeat(match.length));
