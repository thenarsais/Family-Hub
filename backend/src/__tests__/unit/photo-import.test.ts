import axios from 'axios';
import {
  isPhotoImportConfigured,
  extractEventsFromPhoto,
  PhotoImportError,
} from '../../services/photo-import';

jest.mock('axios');
const mockPost = axios.post as jest.Mock;

const ORIGINAL_KEY = process.env.GEMINI_API_KEY;
const ORIGINAL_MODEL = process.env.GEMINI_MODEL;

function geminiResponse(text: string) {
  return { data: { candidates: [{ content: { parts: [{ text }] } }] } };
}

describe('photo-import service (FR-147)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.GEMINI_MODEL;
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = ORIGINAL_KEY;
    process.env.GEMINI_MODEL = ORIGINAL_MODEL;
  });

  describe('isPhotoImportConfigured', () => {
    it('is false without a key', () => {
      delete process.env.GEMINI_API_KEY;
      expect(isPhotoImportConfigured()).toBe(false);
    });

    it('is true with a key', () => {
      expect(isPhotoImportConfigured()).toBe(true);
    });
  });

  describe('extractEventsFromPhoto', () => {
    it('no-ops with a 503 PhotoImportError when unconfigured', async () => {
      delete process.env.GEMINI_API_KEY;
      await expect(extractEventsFromPhoto('ZmFrZQ==', 'image/jpeg', '2026-09-15', 'America/Denver'))
        .rejects.toMatchObject({ status: 503 });
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('rejects an unsupported mime type before calling Gemini', async () => {
      await expect(extractEventsFromPhoto('ZmFrZQ==', 'application/pdf', '2026-09-15', 'America/Denver'))
        .rejects.toMatchObject({ status: 400 });
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('rejects an image over the size cap before calling Gemini', async () => {
      const huge = 'A'.repeat(9 * 1024 * 1024); // ~6.75MB decoded, over the 6MB cap
      await expect(extractEventsFromPhoto(huge, 'image/jpeg', '2026-09-15', 'America/Denver'))
        .rejects.toMatchObject({ status: 413 });
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('calls Gemini with the image + a structured-output prompt, returning sanitized drafts', async () => {
      mockPost.mockResolvedValueOnce(geminiResponse(JSON.stringify([
        { summary: 'Soccer practice', allDay: false, startDate: '2026-09-20', startTime: '16:00', location: 'Park' },
      ])));

      const result = await extractEventsFromPhoto('ZmFrZQ==', 'image/jpeg', '2026-09-15', 'America/Denver');

      expect(result).toEqual([
        {
          summary: 'Soccer practice', description: undefined, location: 'Park', allDay: false,
          startDate: '2026-09-20', startTime: '16:00', endDate: undefined, endTime: undefined,
        },
      ]);
      const [url, body, config] = mockPost.mock.calls[0];
      expect(url).toContain('gemini-2.5-flash');
      expect(body.contents[0].parts[1]).toEqual({ inline_data: { mime_type: 'image/jpeg', data: 'ZmFrZQ==' } });
      expect(config.params.key).toBe('test-key');
    });

    it('honours a GEMINI_MODEL override', async () => {
      process.env.GEMINI_MODEL = 'gemini-3.0-flash';
      mockPost.mockResolvedValueOnce(geminiResponse('[]'));

      await extractEventsFromPhoto('ZmFrZQ==', 'image/jpeg', '2026-09-15', 'America/Denver');

      expect(mockPost.mock.calls[0][0]).toContain('gemini-3.0-flash');
    });

    it('drops an event with no resolvable date instead of inventing one', async () => {
      mockPost.mockResolvedValueOnce(geminiResponse(JSON.stringify([
        { summary: 'Good one', allDay: true, startDate: '2026-09-20' },
        { summary: 'No date given', allDay: true, startDate: '' },
        { summary: '', allDay: true, startDate: '2026-09-21' },
      ])));

      const result = await extractEventsFromPhoto('ZmFrZQ==', 'image/jpeg', '2026-09-15', 'America/Denver');

      expect(result).toHaveLength(1);
      expect(result[0].summary).toBe('Good one');
    });

    it('caps the number of drafts returned', async () => {
      const many = Array.from({ length: 15 }, (_, i) => (
        { summary: `Event ${i}`, allDay: true, startDate: '2026-09-20' }
      ));
      mockPost.mockResolvedValueOnce(geminiResponse(JSON.stringify(many)));

      const result = await extractEventsFromPhoto('ZmFrZQ==', 'image/jpeg', '2026-09-15', 'America/Denver');

      expect(result).toHaveLength(10);
    });

    it('wraps a Gemini HTTP failure as a 502 PhotoImportError', async () => {
      mockPost.mockRejectedValueOnce({ response: { data: { error: { message: 'quota exceeded' } } } });

      await expect(extractEventsFromPhoto('ZmFrZQ==', 'image/jpeg', '2026-09-15', 'America/Denver'))
        .rejects.toMatchObject({ status: 502, message: expect.stringContaining('quota exceeded') });
    });

    it('rejects when Gemini returns no text content', async () => {
      mockPost.mockResolvedValueOnce({ data: { candidates: [] } });
      await expect(extractEventsFromPhoto('ZmFrZQ==', 'image/jpeg', '2026-09-15', 'America/Denver'))
        .rejects.toBeInstanceOf(PhotoImportError);
    });

    it('rejects malformed JSON from Gemini', async () => {
      mockPost.mockResolvedValueOnce(geminiResponse('not json'));
      await expect(extractEventsFromPhoto('ZmFrZQ==', 'image/jpeg', '2026-09-15', 'America/Denver'))
        .rejects.toMatchObject({ status: 502 });
    });

    it('rejects a non-array JSON response', async () => {
      mockPost.mockResolvedValueOnce(geminiResponse(JSON.stringify({ not: 'an array' })));
      await expect(extractEventsFromPhoto('ZmFrZQ==', 'image/jpeg', '2026-09-15', 'America/Denver'))
        .rejects.toMatchObject({ status: 502 });
    });
  });
});
