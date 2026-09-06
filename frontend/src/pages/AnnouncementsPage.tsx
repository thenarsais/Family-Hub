import { useState, type FormEvent } from 'react';
import { Pin, PinOff, Pencil, Trash2 } from 'lucide-react';
import { useAnnouncements } from '@hooks/useAnnouncements';
import { useFamily } from '@hooks/useFamily';
import { useAuth } from '@hooks/useAuth';

function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const TYPES = [
  { value: 'general', label: 'General' },
  { value: 'status', label: 'Status (tagged)' },
];

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { family, members } = useFamily();
  const { announcements, loading, error, createAnnouncement, updateAnnouncement, deleteAnnouncement } =
    useAnnouncements();

  const caller = members.find((m) => m.user_id === user?.id);
  const canManage = caller ? ['admin', 'parent'].includes(caller.role) : false;

  // create form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [pin, setPin] = useState(true);
  const [type, setType] = useState('general');
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  // inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const m = message.trim();
    if (!m || !family?.id || busy) return;
    setBusy(true);
    setFormErr(null);
    try {
      await createAnnouncement(family.id, t || m.slice(0, 60), m, {
        is_pinned: pin,
        announcement_type: type,
      });
      setTitle('');
      setMessage('');
      setPin(true);
      setType('general');
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Could not post the announcement');
    } finally {
      setBusy(false);
    }
  };

  const beginEdit = (id: string, t: string, m: string) => {
    setEditingId(id);
    setEditTitle(t);
    setEditMessage(m);
  };

  const saveEdit = async (id: string) => {
    await updateAnnouncement(id, { title: editTitle.trim(), message: editMessage.trim() }).catch(
      (err) => console.error('Failed to save announcement:', err),
    );
    setEditingId(null);
  };

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink">Announcements</h1>
        <p className="text-ink-2 text-sm mt-1">
          Messages for the whole house. Pinned ones show in the band on the dashboard.
        </p>
      </header>

      {canManage && (
        <form onSubmit={create} className="card space-y-3">
          <h2 className="font-display text-lg font-bold text-ink">New announcement</h2>
          <div>
            <label className="label" htmlFor="a-title">Title <span className="text-ink-3 font-normal">(optional)</span></label>
            <input
              id="a-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
            />
          </div>
          <div>
            <label className="label" htmlFor="a-message">Message</label>
            <textarea
              id="a-message"
              className="input min-h-[72px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-ink-2">
              <input type="checkbox" checked={pin} onChange={(e) => setPin(e.target.checked)} />
              Pin to the band
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-2">
              Type
              <select className="input py-1 w-auto text-sm" value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn-primary btn-small ml-auto" disabled={busy || !message.trim()}>
              {busy ? 'Posting…' : 'Post'}
            </button>
          </div>
          {formErr && <p className="text-sm text-alert bg-alert/10 rounded p-2">{formErr}</p>}
        </form>
      )}

      <section className="card">
        <h2 className="font-display text-lg font-bold text-ink mb-3">
          All announcements <span className="text-ink-3 text-sm font-normal">({announcements.length})</span>
        </h2>

        {loading ? (
          <div className="py-6 flex justify-center" role="status" aria-label="Loading">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
          </div>
        ) : error ? (
          <p className="text-sm text-alert">{error}</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-ink-3">Nothing posted yet.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {announcements.map((a) => (
              <li key={a.id} className="py-3">
                {editingId === a.id ? (
                  <div className="space-y-2">
                    <input
                      className="input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                    />
                    <textarea
                      className="input min-h-[60px]"
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button className="btn btn-primary btn-small" onClick={() => saveEdit(a.id)} disabled={!editMessage.trim()}>
                        Save
                      </button>
                      <button className="btn btn-secondary btn-small" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-ink">{a.title || a.message}</span>
                        {a.is_pinned && <span className="badge badge-primary">Pinned</span>}
                        {a.announcement_type === 'status' && (
                          <span className="badge border border-warn/50 text-warn">Status</span>
                        )}
                        <span className="text-xs text-ink-3">{relativeTime(a.created_at)}</span>
                      </div>
                      {a.title && a.message !== a.title && (
                        <p className="text-sm text-ink-2 mt-1">{a.message}</p>
                      )}
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          aria-label={a.is_pinned ? 'Unpin' : 'Pin'}
                          title={a.is_pinned ? 'Unpin' : 'Pin'}
                          className="p-1.5 text-ink-3 hover:text-accent"
                          onClick={() =>
                            updateAnnouncement(a.id, { is_pinned: !a.is_pinned }).catch((err) =>
                              console.error('Failed to toggle pin:', err),
                            )
                          }
                        >
                          {a.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </button>
                        <button
                          aria-label="Edit"
                          title="Edit"
                          className="p-1.5 text-ink-3 hover:text-accent"
                          onClick={() => beginEdit(a.id, a.title ?? '', a.message ?? '')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          aria-label="Delete"
                          title="Delete"
                          className="p-1.5 text-ink-3 hover:text-alert"
                          onClick={() =>
                            deleteAnnouncement(a.id).catch((err) =>
                              console.error('Failed to delete announcement:', err),
                            )
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
