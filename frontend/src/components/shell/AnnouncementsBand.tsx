import { useState } from 'react';
import { Pin, Plus, X } from 'lucide-react';
import { useAnnouncements } from '@hooks/useAnnouncements';

/**
 * Announcements band (FR-004) — the priority strip directly under the top bar:
 * the things everyone in the house should see. Pinned announcements lead; if
 * none are pinned it falls back to the most recent few. Parents get a minimal
 * inline compose here (full templates + the /announcements page are T-04).
 * Renders nothing when there is nothing to show and the viewer cannot post.
 */
export function AnnouncementsBand({
  canPost = false,
  familyId,
}: {
  canPost?: boolean;
  familyId?: string;
}) {
  const { announcements, createAnnouncement } = useAnnouncements();
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const pinned = announcements.filter((a) => a.is_pinned);
  const shown = (pinned.length > 0 ? pinned : announcements).slice(0, 4);

  if (shown.length === 0 && !canPost) return null;

  const submit = async () => {
    const body = text.trim();
    if (!body || !familyId || busy) return;
    setBusy(true);
    try {
      await createAnnouncement(familyId, body.slice(0, 60), body, { is_pinned: true });
      setText('');
      setComposing(false);
    } catch {
      /* surfaced by the hook's console.error; keep the band usable */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5 bg-raised border-b border-rule border-l-4 border-l-accent">
      <span className="flex items-center gap-1.5 shrink-0 text-[0.7rem] font-bold uppercase tracking-wider text-accent">
        <Pin className="w-3.5 h-3.5" aria-hidden="true" />
        Announcements
      </span>

      {composing ? (
        <form
          className="flex items-center gap-2 flex-1 min-w-0"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Something everyone should see…"
            className="flex-1 min-w-0 bg-paper border border-rule-2 rounded px-2 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="btn btn-primary btn-small disabled:opacity-50"
          >
            Post
          </button>
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => {
              setComposing(false);
              setText('');
            }}
            className="p-1 text-ink-3 hover:text-accent"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>
      ) : (
        <>
          <div className="flex-1 min-w-0 flex items-center gap-2 text-sm font-medium text-ink truncate">
            {shown.length > 0 ? (
              shown.map((a, i) => (
                <span key={a.id} className="truncate">
                  {i > 0 && <span className="text-rule-2 mr-2">·</span>}
                  {a.title || a.message}
                </span>
              ))
            ) : (
              <span className="text-ink-3">No announcements yet</span>
            )}
          </div>
          {canPost && (
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="shrink-0 flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-strong"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Post
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default AnnouncementsBand;
