export interface TranslationProvider {
    translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string>;
    batchTranslate(texts: string[], targetLanguage: string, sourceLanguage?: string): Promise<string[]>;
    getSupportedLanguages(): Promise<Array<{ code: string; name: string }>>;
}