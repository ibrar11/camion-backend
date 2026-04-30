import {
    Injectable,
    Logger,
} from '@nestjs/common';

import { ConfigService } from "@nestjs/config";
@Injectable()
export class ProductTranslationProvider {
    private readonly logger = new Logger(ProductTranslationProvider.name);

    constructor(private readonly configService: ConfigService) { }

    async translate(
        texts: string[],
        targetLanguage: string,
        sourceLanguage = 'en',
    ): Promise<string[]> {
        if (!texts.length) return [];

        const res = await fetch(`${this.configService.get<string>("PRODUCT_TRANSLATION_BASE_URL")}/api/translate/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts, sourceLanguage, targetLanguage }),
        });
        console.log("resresresresresres", res)

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
