import { useRef, useState } from 'react';
import { X, Loader2, Camera } from 'lucide-react';
import { apiClient, type ApiEnvelope } from '../../services/api';
import { useAuth } from '@hooks/useAuth';
import type { GoogleEventInput } from '@hooks/useCalendar';
import type { components } from '@/types/api-generated';

type PhotoDraftEvent = components['schemas']['PhotoDraftEvent'];
type DraftRow = PhotoDraftEvent & { include: boolean };

interface AddFromPhotoModalProps {
  onClose: () => void;
  createEvent: (input: GoogleEventInput) => Promise<unknown>;
}

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = dataUrl;
  });
}

// Downscales client-side so the payload comfortably fits the backend's
// per-route body-size cap and keeps the Gemini call cheap — a raw phone
// photo can be 5-10MB; a flyer's text is still plenty legible at 1600px.
async function downscaleToJpegBase64(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process that image');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const jpegDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64 = jpegDataUrl.split(',')[1];
  if (!base64) throw new Error('Could not process that image');
  return base64;
}

function toEventInput(draft: DraftRow): GoogleEventInput {
  return {
    summary: draft.summary,
    description: draft.description,
    location: draft.location,
    allDay: draft.allDay,
    startDate: draft.startDate,
    startTime: draft.allDay ? undefined : draft.startTime,
    endDate: draft.endDate,
    endTime: draft.allDay ? undefined : draft.endTime,
    timeZone: browserTimeZone(),
    attendees: [],
    sendInvites: false,
  };
}

function errorMessageOf(err: unknown, fallback: string): string {
  const withResponse = err as { response?: { data?: { message?: string } } };
  return withResponse?.response?.data?.message || (err instanceof Error ? err.message : fallback);
}

export function AddFromPhotoModal({ onClose, createEvent }: AddFromPhotoModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'pick' | 'loading' | 'review' | 'creating'>('pick');
  const [preview, setPreview] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setStep('loading');
    try {
      const base64 = await downscaleToJpegBase64(file);
      setPreview(`data:image/jpeg;base64,${base64}`);

      const response = await apiClient.post<ApiEnvelope<PhotoDraftEvent[]>>(
        '/api/calendar/photo-import',
        { image: base64, mimeType: 'image/jpeg' },
        { headers: { 'x-user-id': user?.id ?? '' } },
      );
      const found = response.data?.data ?? [];
      setDrafts(found.map((d) => ({ ...d, include: true })));
      setStep('review');
      if (found.length === 0) {
        setError("No events found in that photo — try a clearer, closer shot of the text.");
      }
    } catch (err) {
      setError(errorMessageOf(err, "Couldn't read that photo."));
      setStep('pick');
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handleFile(file);
  };

  const updateDraft = (index: number, patch: Partial<DraftRow>) => {
    setDrafts((cur) => cur.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const includedCount = drafts.filter((d) => d.include).length;

  const handleConfirm = async () => {
    const indices = drafts.map((d, i) => (d.include ? i : -1)).filter((i) => i >= 0);
    if (indices.length === 0) return;
    const targets = indices.map((i) => drafts[i]);
    setStep('creating');
    setError(null);

    const outcomes = await Promise.allSettled(targets.map((d) => createEvent(toEventInput(d))));
    const failedSummaries = targets
      .filter((_, pos) => outcomes[pos].status === 'rejected')
      .map((d) => d.summary);

    setDrafts((cur) => cur.map((d, i) => {
      const pos = indices.indexOf(i);
      if (pos === -1) return d;
      return outcomes[pos].status === 'fulfilled' ? { ...d, include: false } : d;
    }));

    if (failedSummaries.length === 0) {
      onClose();
    } else {
      setError(`Everything else was added. Couldn't add: ${failedSummaries.join(', ')} — try again or edit and retry.`);
      setStep('review');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-raised rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-rule">
          <h3 className="text-lg font-bold text-ink flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Add from photo
          </h3>
          <button type="button" onClick={onClose} className="text-ink-3 hover:text-accent" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === 'pick' && (
            <div className="text-center py-8">
              <p className="text-sm text-ink-2 mb-4">
                Snap a photo of a flyer, invite, or schedule and we'll pull out the events for you to review.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onPick}
                data-testid="add-from-photo-input"
              />
              <button
                type="button"
                className="btn btn-primary inline-flex items-center gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4" />
                Take or choose a photo
              </button>
            </div>
          )}

          {step === 'loading' && (
            <div className="text-center py-10">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-accent" />
              <p className="text-sm text-ink-2">Reading the photo…</p>
              {preview && (
                <img src={preview} alt="Uploaded" className="mt-4 max-h-48 mx-auto rounded-lg opacity-60" />
              )}
            </div>
          )}

          {(step === 'review' || step === 'creating') && (
            <>
              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                {preview && (
                  <img src={preview} alt="Uploaded" className="rounded-lg w-full h-auto object-cover max-h-48 sm:max-h-none" />
                )}
                <div className="space-y-3">
                  {drafts.map((draft, i) => (
                    <div key={i} className="border border-rule rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={draft.include}
                          onChange={(e) => updateDraft(i, { include: e.target.checked })}
                          aria-label={`Include ${draft.summary || 'this event'}`}
                          disabled={step === 'creating'}
                        />
                        <input
                          className="input flex-1"
                          value={draft.summary}
                          onChange={(e) => updateDraft(i, { summary: e.target.value })}
                          disabled={step === 'creating'}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pl-6">
                        <label className="flex items-center gap-1 text-xs text-ink-2">
                          <input
                            type="checkbox"
                            checked={draft.allDay}
                            onChange={(e) => updateDraft(i, { allDay: e.target.checked })}
                            disabled={step === 'creating'}
                          />
                          All day
                        </label>
                        <input
                          type="date"
                          className="input py-1 text-sm w-auto"
                          value={draft.startDate}
                          onChange={(e) => updateDraft(i, { startDate: e.target.value })}
                          disabled={step === 'creating'}
                        />
                        {!draft.allDay && (
                          <input
                            type="time"
                            className="input py-1 text-sm w-auto"
                            value={draft.startTime ?? ''}
                            onChange={(e) => updateDraft(i, { startTime: e.target.value })}
                            disabled={step === 'creating'}
                          />
                        )}
                      </div>
                      <input
                        className="input py-1 text-sm ml-6 w-[calc(100%-1.5rem)]"
                        placeholder="Location (optional)"
                        value={draft.location ?? ''}
                        onChange={(e) => updateDraft(i, { location: e.target.value })}
                        disabled={step === 'creating'}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-rule">
                <button type="button" className="btn btn-secondary flex-1" onClick={onClose} disabled={step === 'creating'}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-1"
                  onClick={handleConfirm}
                  disabled={step === 'creating' || includedCount === 0}
                >
                  {step === 'creating' ? 'Adding…' : `Add ${includedCount || ''} event${includedCount === 1 ? '' : 's'}`}
                </button>
              </div>
            </>
          )}

          {error && step !== 'loading' && (
            <p className="text-sm text-alert bg-alert/10 rounded p-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
