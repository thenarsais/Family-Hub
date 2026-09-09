import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pin, Plus, X } from 'lucide-react';
import { useAnnouncements } from '@hooks/useAnnouncements';
import { ANNOUNCEMENT_TEMPLATES } from '@/data/announcementTemplates';

/**
 * Announcements band (FR-016 / FR-134) — the priority strip directly under the
 * top bar: the things everyone in the house should see. Pinned announcements
 * lead; if none are pinned it falls back to the most recent few. Parents get
 * quick-post preset chips + a free-text compose, and can dismiss (✕) any item.
 * A 'status'-type announcement (FR-062 half) shows a small STATUS tag.
 * Renders nothing when there is nothing to show and the viewer cannot post.
 */
export function AnnouncementsBand({
  canPost = false,
  familyId,
}: {
  canPost?: boolean;
  familyId?: string;
}) {
  const { announcements, createAnnouncement, deleteAnnouncement } = useAnnouncements();
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const pinned = announcements.filter((a) => a.is_pinned);
  const shown = (pinned.length > 0 ? pinned : announcements).slice(0, 4);

  if (shown.length === 0 && !canPost) return null;

  const post = async (title: string, message: string, type: string) => {
    if (!familyId || busy) return;
    setBusy(true);
    try {
      await createAnnouncement(familyId, title, message, {
        is_pinned: true,
        announcement_type: type,
      });
      setText('');
      setComposing(false);
    } catch {
      /* surfaced by the hook's console.error; keep the band usable */
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    void post(body.slice(0, 60), body, 'general');
  };

  const dismiss = (id: string) => {
    deleteAnnouncement(id).catch(() => {
      /* hook logs it; band stays usable */
    });
  };

  return (
    <div className="border-l-4 border-l-accent px-4 sm:px-6 py-2.5">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 shrink-0 text-[0.7rem] font-bold uppercase tracking-wider text-accent">
          <Pin className="w-3.5 h-3.5" aria-hidden="true" />
          Announcements
        </span>

        <div className="flex-1 min-w-0 flex items-center gap-2 text-sm font-medium text-ink overflow-hidden">
          {shown.length > 0 ? (
            shown.map((a, i) => (
              <span key={a.id} className="flex items-center gap-1 min-w-0">
                {i > 0 && <span className="text-rule-2" aria-hidden="true">·</span>}
                {a.announcement_type === 'status' && (
                  <span className="shrink-0 text-[0.6rem] font-bold uppercase tracking-wider text-warn border border-warn/50 rounded px-1">
                    status
                  </span>
                )}
                <span className="truncate">{a.title || a.message}</span>
                {canPost && (
                  <button
                    type="button"
                    aria-label={`Dismiss "${a.title || a.message}"`}
                    onClick={() => dismiss(a.id)}
                    className="shrink-0 p-0.5 text-ink-3 hover:text-alert"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
              </span>
            ))
          ) : (
            <span className="text-ink-3">No announcements yet</span>
          )}
        </div>

        {canPost && (
          <Link
            to="/announcements"
            className="shrink-0 text-xs font-semibold text-ink-3 hover:text-accent"
          >
            Manage
          </Link>
        )}
      </div>

      {canPost && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {composing ? (
            <form
              className="flex items-center gap-2 flex-1 min-w-0"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
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
              {ANNOUNCEMENT_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  disabled={busy}
                  onClick={() => void post(t.title, t.message, t.type)}
                  className="text-xs rounded-full border border-rule-2 bg-paper px-2.5 py-1 text-ink-2 hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  {t.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setComposing(true)}
                className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-strong px-1"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Write…
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AnnouncementsBand;
