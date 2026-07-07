"use strict";
/**
 * Merriam-Webster Dictionary API
 * Provides word definitions, synonyms, and pronunciation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWordDefinition = getWordDefinition;
exports.getWordOfTheDay = getWordOfTheDay;
exports.searchWordsByPrefix = searchWordsByPrefix;
const cache = __importStar(require("../database/cache"));
const MW_API_KEY = process.env.MERRIAM_WEBSTER_API_KEY || 'demo';
const MW_BASE_URL = 'https://www.merriam-webster.com/api/player/v1/config/lookup';
/**
 * Get word definition from Merriam-Webster
 */
async function getWordDefinition(word) {
    if (!word || word.length === 0) {
        return null;
    }
    const cacheKey = `word:${word.toLowerCase()}`;
    // Try cache first
    const cached = await cache.get(cacheKey);
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
        const data = await response.json();
        if (!data || !data.results || data.results.length === 0) {
            return null;
        }
        const result = data.results[0];
        const wordResponse = {
            word: result.word || word,
            definitions: extractDefinitions(result),
            pronunciation: result.pronunciations?.[0]?.mw || undefined,
            audioUrl: extractAudioUrl(result)
        };
        // Cache for 7 days (word definitions don't change)
        await cache.set(cacheKey, wordResponse, 604800);
        return wordResponse;
    }
    catch (error) {
        console.error(`Failed to fetch definition for "${word}":`, error);
        return null;
    }
}
/**
 * Extract definitions from API response
 */
function extractDefinitions(result) {
    const definitions = [];
    if (!result.shortDefinitions || result.shortDefinitions.length === 0) {
        return definitions;
    }
    const definitions_array = result.def?.[0]?.sseq || [];
    result.shortDefinitions.forEach((def, index) => {
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
function extractExample(result, index) {
    try {
        const example = result.def?.[0]?.sseq?.[index]?.[0]?.[1]?.vis?.[0]?.t;
        if (example) {
            return example.replace(/<[^>]*>/g, ''); // Remove XML tags
        }
    }
    catch (e) {
        // Ignore parse errors
    }
    return undefined;
}
/**
 * Extract related word
 */
function extractSynonym(result) {
    try {
        const synonyms = result.def?.[0]?.sseq?.[0]?.[0]?.[1]?.sim;
        if (synonyms && synonyms.length > 0) {
            return synonyms[0];
        }
    }
    catch (e) {
        // Ignore parse errors
    }
    return undefined;
}
/**
 * Extract audio URL
 */
function extractAudioUrl(result) {
    try {
        const audio = result.hwi?.hw?.prs?.[0]?.sound?.audio;
        if (audio) {
            // Construct full audio URL
            const subdirectory = audio.substring(0, 3);
            return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdirectory}/${audio}.mp3`;
        }
    }
    catch (e) {
        // Ignore parse errors
    }
    return undefined;
}
/**
 * Get word of the day
 */
async function getWordOfTheDay() {
    const cacheKey = 'word:of:the:day';
    // Cache for 24 hours
    const cached = await cache.get(cacheKey);
    if (cached) {
        return cached;
    }
    try {
        const response = await fetch(`https://www.merriam-webster.com/api/player/v1/config/word?key=${MW_API_KEY}`);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        if (!data || !data.results || data.results.length === 0) {
            return null;
        }
        const result = data.results[0];
        const wordResponse = {
            word: result.word || 'unknown',
            definitions: extractDefinitions(result),
            pronunciation: result.pronunciations?.[0]?.mw || undefined,
            audioUrl: extractAudioUrl(result)
        };
        await cache.set(cacheKey, wordResponse, 86400); // 24 hours
        return wordResponse;
    }
    catch (error) {
        console.error('Failed to fetch word of the day:', error);
        return null;
    }
}
/**
 * Search words by prefix
 */
async function searchWordsByPrefix(prefix, limit = 10) {
    if (!prefix || prefix.length < 2) {
        return [];
    }
    const cacheKey = `words:prefix:${prefix.toLowerCase()}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
        return cached;
    }
    try {
        const response = await fetch(`https://www.merriam-webster.com/api/player/v1/config/search?word=${encodeURIComponent(prefix)}*&key=${MW_API_KEY}`);
        if (!response.ok) {
            return [];
        }
        const data = await response.json();
        if (!data || !data.results || data.results.length === 0) {
            return [];
        }
        const words = data.results.slice(0, limit).map((r) => r.word);
        await cache.set(cacheKey, words, 86400); // Cache 24 hours
        return words;
    }
    catch (error) {
        console.error('Failed to search words by prefix:', error);
        return [];
    }
}
exports.default = {
    getWordDefinition,
    getWordOfTheDay,
    searchWordsByPrefix
};
//# sourceMappingURL=merriam-webster.js.map