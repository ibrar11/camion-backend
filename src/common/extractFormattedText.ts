export function extractFormattedText(html: string): string {
    if (!html) return '';

    // Normalize escaped characters
    let cleaned = html
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\+/g, '')
        .trim();

    // Remove images completely
    cleaned = cleaned.replace(/<img[^>]*>/gi, '');

    // Replace block-level tags with line breaks
    cleaned = cleaned.replace(/<\/(div|p|br|li|h[1-6])>/gi, '\n');

    // Remove all remaining HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');

    // Decode basic HTML entities (minimal but useful)
    cleaned = cleaned
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

    // Normalize whitespace into clean lines
    return cleaned
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .join('\n');
}