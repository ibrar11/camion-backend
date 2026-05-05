export function extractFormattedText(html: string): string {
    if (!html) return '';

    let cleaned = html
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\+/g, '')
        .trim();

    cleaned = cleaned.replace(
        /<div[^>]*(display\s*:\s*none|sdmap-dynamic-offer-list)[^>]*>.*?<\/div>/gis,
        ''
    );

    cleaned = cleaned.replace(/<img[^>]*>/gi, '');

    cleaned = cleaned.replace(/<\/(div|p|br|li|h[1-6])>/gi, '\n');

    cleaned = cleaned.replace(/<[^>]+>/g, '');

    cleaned = cleaned
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');

    const result = cleaned
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
            if (!line) return false;

            if (/^\{.*\}$/.test(line)) return false;

            if (!/[a-zA-Z\u4e00-\u9fa5]/.test(line)) return false;

            return true;
        })
        .join('\n');

    return result || '';
}