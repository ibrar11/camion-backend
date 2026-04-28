import {
    Injectable,
    Logger,
} from '@nestjs/common';

const FETCH_TIMEOUT_MS = 10_000;

@Injectable()
export class ProductTranslationProvider {
    private readonly logger = new Logger(ProductTranslationProvider.name);

    async translate(
        texts: string[],
        targetLanguage: string,
        sourceLanguage = 'en',
    ): Promise<string[]> {
        if (!texts.length) return [];

        const res = await fetch('http://localhost:3002/api/translate/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts, sourceLanguage, targetLanguage }),
        });

        if (!res.ok) {
            throw new Error(`Translation API responded with ${res.status}`);
        }

        const data = await res.json();

        return data ?? texts;
    }

    async translateBatch(
        texts: string[],
        targetLanguage: string,
        sourceLanguage = 'en',
    ): Promise<string[]> {
        const translations = await this.translate(texts, targetLanguage, sourceLanguage);
        return translations;
    }
}
