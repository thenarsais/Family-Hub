import { getWordDefinition, getWordOfTheDay, searchWordsByPrefix } from '../../services/merriam-webster';
import * as cache from '../../database/cache';

jest.mock('../../database/cache');

describe('MerriamWebsterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cache.get as jest.Mock).mockResolvedValue(null);
    (cache.set as jest.Mock).mockResolvedValue(undefined);
    global.fetch = jest.fn();
  });

  describe('getWordDefinition', () => {
    it('should return null for an empty word', async () => {
      const result = await getWordDefinition('');
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return the cached value when present', async () => {
      const cached = { word: 'cat', definitions: [] };
      (cache.get as jest.Mock).mockResolvedValueOnce(cached);

      const result = await getWordDefinition('cat');

      expect(result).toEqual(cached);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch, parse, and cache a definition on a cache miss', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              word: 'cat',
              fl: 'noun; informal',
              shortDefinitions: ['a small domesticated animal', 'a big cat'],
              pronunciations: [{ mw: 'kat' }],
              hwi: { hw: { prs: [{ sound: { audio: 'cat001' } }] } },
              def: [
                {
                  sseq: [
                    [[null, { vis: [{ t: 'The <it>cat</it> sat.' }], sim: ['feline'] }]],
                  ],
                },
              ],
            },
          ],
        }),
      });

      const result = await getWordDefinition('cat');

      expect(result?.word).toBe('cat');
      expect(result?.pronunciation).toBe('kat');
      expect(result?.audioUrl).toBe('https://media.merriam-webster.com/audio/prons/en/us/mp3/cat/cat001.mp3');
      expect(result?.definitions).toHaveLength(2);
      expect(result?.definitions[0]).toEqual({
        word: 'cat',
        partOfSpeech: 'noun',
        definition: 'a small domesticated animal',
        example: 'The cat sat.',
        synonym: 'feline',
      });
      expect(cache.set).toHaveBeenCalledWith('word:cat', result, 604800);
    });

    it('should return null when the response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, statusText: 'Not Found' });

      const result = await getWordDefinition('zzzz');

      expect(result).toBeNull();
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('should return null when there are no results', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) });

      const result = await getWordDefinition('zzzz');

      expect(result).toBeNull();
    });

    it('should return null when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

      const result = await getWordDefinition('cat');

      expect(result).toBeNull();
    });
  });

  describe('getWordOfTheDay', () => {
    it('should return the cached value when present', async () => {
      const cached = { word: 'serendipity', definitions: [] };
      (cache.get as jest.Mock).mockResolvedValueOnce(cached);

      const result = await getWordOfTheDay();

      expect(result).toEqual(cached);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch and cache the word of the day for 24 hours', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ word: 'serendipity', shortDefinitions: ['a fortunate discovery'] }],
        }),
      });

      const result = await getWordOfTheDay();

      expect(result?.word).toBe('serendipity');
      expect(cache.set).toHaveBeenCalledWith('word:of:the:day', result, 86400);
    });

    it('should default to "unknown" when the result has no word', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ shortDefinitions: [] }] }),
      });

      const result = await getWordOfTheDay();

      expect(result?.word).toBe('unknown');
    });

    it('should return null when the response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

      const result = await getWordOfTheDay();

      expect(result).toBeNull();
    });

    it('should return null when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

      const result = await getWordOfTheDay();

      expect(result).toBeNull();
    });
  });

  describe('searchWordsByPrefix', () => {
    it('should return an empty array for a prefix shorter than 2 characters', async () => {
      const result = await searchWordsByPrefix('a');
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return the cached value when present', async () => {
      (cache.get as jest.Mock).mockResolvedValueOnce(['cat', 'catalog']);

      const result = await searchWordsByPrefix('cat');

      expect(result).toEqual(['cat', 'catalog']);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch, limit, and cache matching words', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ word: 'cat' }, { word: 'catalog' }, { word: 'catastrophe' }],
        }),
      });

      const result = await searchWordsByPrefix('cat', 2);

      expect(result).toEqual(['cat', 'catalog']);
      expect(cache.set).toHaveBeenCalledWith('words:prefix:cat', ['cat', 'catalog'], 86400);
    });

    it('should return an empty array when the response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

      const result = await searchWordsByPrefix('cat');

      expect(result).toEqual([]);
    });

    it('should return an empty array when there are no results', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) });

      const result = await searchWordsByPrefix('cat');

      expect(result).toEqual([]);
    });

    it('should return an empty array when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

      const result = await searchWordsByPrefix('cat');

      expect(result).toEqual([]);
    });
  });
});
