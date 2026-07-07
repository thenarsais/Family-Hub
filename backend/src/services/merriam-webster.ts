/**
 * Merriam-Webster Dictionary API
 * Provides word definitions, synonyms, and pronunciation
 */

import * as cache from '../database/cache';

const MW_API_KEY = process.env.MERRIAM_WEBSTER_API_KEY || 'demo';
const MW_BASE_URL = 'https://www.merriam-webster.com/api/player/v1/config/lookup';

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
export async function getWordDefinition(word: string): Promise<WordResponse | null> {
  if (!word || word.length === 0) {
    return null;
  }

  const cacheKey = `word:${word.toLowerCase()}`;

  // Try cache first
  const cached = await cache.get<WordResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Call Merriam-Webster API
    const response = await fetch(`${MW_BASE_URL}?word=${encodeURIComponent(word)}&key=${MW_API_KEY}`);

    if (!response.ok) {
      console.warn(`MW API error for word "${word}": ${response.statusText}`);
      return null;
    }

    const data: any = await response.json();

    if (!data || !data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];

    const wordResponse: WordResponse = {
      word: result.word || word,
      definitions: extractDefinitions(result),
      pronunciation: result.pronunciations?.[0]?.mw || undefined,
      audioUrl: extractAudioUrl(result)
    };

    // Cache for 7 days (word definitions don't change)
    await cache.set(cacheKey, wordResponse, 604800);

    return wordResponse;
  } catch (error) {
    console.error(`Failed to fetch definition for "${word}":`, error);
    return null;
  }
}

/**
 * Extract definitions from API response
 */
function extractDefinitions(result: any): WordDefinition[] {
  const definitions: WordDefinition[] = [];

  if (!result.shortDefinitions || result.shortDefinitions.length === 0) {
    return definitions;
  }

  const definitions_array = result.def?.[0]?.sseq || [];

  result.shortDefinitions.forEach((def: string, index: number) => {
    // Get part of speech
    const posParts = result.fl?.split(';') || [];
    const partOfSpeech = posParts[0]?.trim() || 'noun';

    definitions.push({
      word: result.word,
      partOfSpeech,
      definition: def,
      example: extractExample(result, index),
      synonym: extractSynonym(result)
    });
  });

  return definitions.slice(0, 5); // Return first 5 definitions
}

/**
 * Extract example sentence
 */
function extractExample(result: any, index: number): string | undefined {
  try {
    const example = result.def?.[0]?.sseq?.[index]?.[0]?.[1]?.vis?.[0]?.t;
    if (example) {
      return example.replace(/<[^>]*>/g, ''); // Remove XML tags
    }
  } catch (e) {
    // Ignore parse errors
  }
  return undefined;
}

/**
 * Extract related word
 */
function extractSynonym(result: any): string | undefined {
  try {
    const synonyms = result.def?.[0]?.sseq?.[0]?.[0]?.[1]?.sim;
    if (synonyms && synonyms.length > 0) {
      return synonyms[0];
    }
  } catch (e) {
    // Ignore parse errors
  }
  return undefined;
}

/**
 * Extract audio URL
 */
function extractAudioUrl(result: any): string | undefined {
  try {
    const audio = result.hwi?.hw?.prs?.[0]?.sound?.audio;
    if (audio) {
      // Construct full audio URL
      const subdirectory = audio.substring(0, 3);
      return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdirectory}/${audio}.mp3`;
    }
  } catch (e) {
    // Ignore parse errors
  }
  return undefined;
}

/**
 * Get word of the day
 */
export async function getWordOfTheDay(): Promise<WordResponse | null> {
  const cacheKey = 'word:of:the:day';

  // Cache for 24 hours
  const cached = await cache.get<WordResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `https://www.merriam-webster.com/api/player/v1/config/word?key=${MW_API_KEY}`
    );

    if (!response.ok) {
      return null;
    }

    const data: any = await response.json();

    if (!data || !data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];

    const wordResponse: WordResponse = {
      word: result.word || 'unknown',
      definitions: extractDefinitions(result),
      pronunciation: result.pronunciations?.[0]?.mw || undefined,
      audioUrl: extractAudioUrl(result)
    };

    await cache.set(cacheKey, wordResponse, 86400); // 24 hours

    return wordResponse;
  } catch (error) {
    console.error('Failed to fetch word of the day:', error);
    return null;
  }
}

/**
 * Search words by prefix
 */
export async function searchWordsByPrefix(prefix: string, limit: number = 10): Promise<string[]> {
  if (!prefix || prefix.length < 2) {
    return [];
  }

  const cacheKey = `words:prefix:${prefix.toLowerCase()}`;

  const cached = await cache.get<string[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `https://www.merriam-webster.com/api/player/v1/config/search?word=${encodeURIComponent(prefix)}*&key=${MW_API_KEY}`
    );

    if (!response.ok) {
      return [];
    }

    const data: any = await response.json();

    if (!data || !data.results || data.results.length === 0) {
      return [];
    }

    const words = data.results.slice(0, limit).map((r: any) => r.word);

    await cache.set(cacheKey, words, 86400); // Cache 24 hours

    return words;
  } catch (error) {
    console.error('Failed to search words by prefix:', error);
    return [];
  }
}

export default {
  getWordDefinition,
  getWordOfTheDay,
  searchWordsByPrefix
};
