import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class ProductTranslationProvider {
    private readonly logger = new Logger(ProductTranslationProvider.name);

    // simple in-memory cache fallback (you can swap with Redis later)
    private cache = new Map<string, string>();

    constructor(private readonly configService: ConfigService) { }

    private hash(text: string, source: string, target: string): string {
        return crypto
            .createHash('sha1')
            .update(`${source}:${target}:${text}`)
            .digest('hex');
    }

    async translate(
        texts: string[],
        targetLanguage: string,
        sourceLanguage = 'en',
    ): Promise<string[]> {
        if (!texts.length) return [];

        const normalized = texts.map(t => (t ?? '').trim());

        // 1. Build cache keys
        const keys = normalized.map(t =>
            this.hash(t, sourceLanguage, targetLanguage),
        );

        const result: string[] = new Array(texts.length);

        const missingTexts: string[] = [];
        const missingIndexes: number[] = [];

        // 2. Check cache
        for (let i = 0; i < normalized.length; i++) {
            const cached = this.cache.get(keys[i]);

            if (cached) {
                result[i] = cached;
            } else {
                missingTexts.push(normalized[i]);
                missingIndexes.push(i);
            }
        }

        // 3. Everything cached → no OpenAI call
        if (!missingTexts.length) {
            return result;
        }

        // 4. Call OpenAI ONLY for missing
        const res = await fetch(
            `${this.configService.get<string>(
                'PRODUCT_TRANSLATION_BASE_URL',
            )}/api/translate/batch`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    texts: missingTexts,
                    sourceLanguage,
                    targetLanguage,
                }),
            },
        );

        if (!res.ok) {
            throw new Error(`Translation API responded with ${res.status}`);
        }

        const data: string[] = await res.json();

        // 5. Rebuild + cache
        missingIndexes.forEach((originalIndex, i) => {
            const translated = data?.[i] ?? missingTexts[i];

            result[originalIndex] = translated;

            this.cache.set(
                keys[originalIndex],
                translated,
            );
        });

        return result;
    }

    async translateBatch(
        texts: string[],
        targetLanguage: string,
        sourceLanguage = 'en',
    ): Promise<string[]> {
        return this.translate(texts, targetLanguage, sourceLanguage);
    }

    async translateSingleText(
        text: string,
        targetLanguage: string,
        sourceLanguage = 'en',
    ): Promise<string> {
        if (!text) return text;

        const result = await this.translate([text], targetLanguage, sourceLanguage);
        return result?.[0] ?? text;
    }
}