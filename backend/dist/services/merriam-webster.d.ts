/**
 * Merriam-Webster Dictionary API
 * Provides word definitions, synonyms, and pronunciation
 */
interface WordDefinition {
    word: string;
    partOfSpeech: string;
    definition: string;
    example?: string;
    synonym?: string;
}
interface WordResponse {
    word: string;
    definitions: WordDefinition[];
    pronunciation?: string;
    audioUrl?: string;
}
/**
 * Get word definition from Merriam-Webster
 */
export declare function getWordDefinition(word: string): Promise<WordResponse | null>;
/**
 * Get word of the day
 */
export declare function getWordOfTheDay(): Promise<WordResponse | null>;
/**
 * Search words by prefix
 */
export declare function searchWordsByPrefix(prefix: string, limit?: number): Promise<string[]>;
declare const _default: {
    getWordDefinition: typeof getWordDefinition;
    getWordOfTheDay: typeof getWordOfTheDay;
    searchWordsByPrefix: typeof searchWordsByPrefix;
};
export default _default;
//# sourceMappingURL=merriam-webster.d.ts.map