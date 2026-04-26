import {
    Injectable,
    Logger,
} from '@nestjs/common';

@Injectable()
export class ProductTranslationProvider {
    private readonly logger = new Logger(ProductTranslationProvider.name);

    async translate(
        text: string,
        targetLanguage: string,
        sourceLanguage = 'en',
    ): Promise<string> {
        console.log("texttexttexttexttexttexttext",text)
        if (!text?.trim()) {
            return '';
        }

        try {
            const payload = {
                text: text,
                sourceLanguage: sourceLanguage,
                targetLanguage: targetLanguage,
            }

            const res = await fetch("http://localhost:3002/api/translate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            console.log("translatedtranslatedtranslateddatadatadatadatadatadatadata",data)

            return `[${targetLanguage}] ${text}`;
        } catch (error: any) {
            this.logger.error(
                `Translation failed: ${error}`,
            );

            return text;
        }
    }

    async translateBatch(
        texts: string[],
        targetLanguage: string,
        sourceLanguage = 'en',
    ): Promise<string[]> {
        const results: string[] = [];

        for (const text of texts) {
            const translated = await this.translate(
                text,
                targetLanguage,
                sourceLanguage,
            );

            results.push(translated);
        }

        return results;
    }
}