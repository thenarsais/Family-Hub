import axios from 'axios';

/**
 * FR-147 "Add from photo": one outbound vision-LLM call, no persistent job.
 * Provider = Gemini (free tier), per the project's standing $0-integration
 * preference (see FR-139/T-16). NEVER writes an event itself — callers must
 * route each returned draft through the existing FR-006 create path.
 */

export interface PhotoDraftEvent {
  summary: string;
  description?: string;
  location?: string;
  allDay: boolean;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
}

export class PhotoImportError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const ALLOWED_MIME_RE = /^image\/(jpeg|png|webp|heic|heif)$/;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_DRAFT_EVENTS = 10;

const RESPONSE_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      summary: { type: 'STRING' },
      description: { type: 'STRING' },
      location: { type: 'STRING' },
      allDay: { type: 'BOOLEAN' },
      startDate: { type: 'STRING' },
      startTime: { type: 'STRING' },
      endDate: { type: 'STRING' },
      endTime: { type: 'STRING' },
    },
    required: ['summary', 'allDay', 'startDate'],
  },
};

function buildPrompt(todayKey: string, timeZone: string): string {
  return [
    'You are reading a photo of a family flyer, invite, school notice, or schedule to extract calendar events.',
    `Today's date is ${todayKey} in the ${timeZone} timezone; resolve any relative or partial dates `
      + '("this Friday", "March 5", "next Tue 4pm") against that.',
    'Return a JSON array of the events found in the image. Each event object has:',
    '- summary (string, required): a short title',
    '- description (string, optional): extra detail worth keeping (address, what to bring, contact)',
    '- location (string, optional)',
    '- allDay (boolean, required): true if no specific time is given',
    '- startDate (string, required): "YYYY-MM-DD"',
    '- startTime (string, optional): "HH:MM" 24-hour, omit when allDay is true',
    '- endDate (string, optional): only if the event spans multiple days',
    '- endTime (string, optional): "HH:MM" 24-hour',
    'Only include events with a real, resolvable date — do not invent one if the image does not give or imply it; '
      + 'skip that event instead. If the image has no events at all, return an empty array. '
      + 'Return ONLY the JSON array, no other text.',
  ].join('\n');
}

function sanitizeDraft(raw: unknown): PhotoDraftEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const summary = typeof r.summary === 'string' ? r.summary.trim() : '';
  const startDate = typeof r.startDate === 'string' ? r.startDate : '';
  if (!summary || !DATE_RE.test(startDate)) return null;

  const allDay = r.allDay === true;
  const startTime = !allDay && typeof r.startTime === 'string' && TIME_RE.test(r.startTime) ? r.startTime : undefined;
  const endDate = typeof r.endDate === 'string' && DATE_RE.test(r.endDate) ? r.endDate : undefined;
  const endTime = typeof r.endTime === 'string' && TIME_RE.test(r.endTime) ? r.endTime : undefined;
  const description = typeof r.description === 'string' && r.description.trim() ? r.description.trim() : undefined;
  const location = typeof r.location === 'string' && r.location.trim() ? r.location.trim() : undefined;

  return { summary, description, location, allDay, startDate, startTime, endDate, endTime };
}

export function isPhotoImportConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export async function extractEventsFromPhoto(
  base64Image: string,
  mimeType: string,
  todayKey: string,
  timeZone: string,
): Promise<PhotoDraftEvent[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new PhotoImportError('Photo import is not configured (missing GEMINI_API_KEY)', 503);

  if (!ALLOWED_MIME_RE.test(mimeType)) {
    throw new PhotoImportError('Unsupported image type — use JPEG, PNG, WEBP, or HEIC', 400);
  }
  const approxBytes = Math.ceil((base64Image.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_BYTES) {
    throw new PhotoImportError('Image is too large (max 6MB) — try a closer crop or lower resolution', 413);
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  let data: unknown;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        contents: [{
          parts: [
            { text: buildPrompt(todayKey, timeZone) },
            { inline_data: { mime_type: mimeType, data: base64Image } },
          ],
        }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
      },
      { params: { key: apiKey }, timeout: 25000 },
    );
    data = response.data;
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
    const message = axiosErr.response?.data?.error?.message || axiosErr.message || 'unknown error';
    throw new PhotoImportError(`Gemini request failed: ${message}`, 502);
  }

  const text = (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
    ?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new PhotoImportError('Gemini returned no content', 502);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new PhotoImportError('Gemini returned malformed JSON', 502);
  }
  if (!Array.isArray(parsed)) throw new PhotoImportError('Gemini did not return a list of events', 502);

  return parsed.map(sanitizeDraft).filter((e): e is PhotoDraftEvent => e !== null).slice(0, MAX_DRAFT_EVENTS);
}
