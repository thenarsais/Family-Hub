import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { apiClient } from '@services/api';

function readMehndiOn(): boolean {
  if (typeof document === 'undefined') return true;
  return document.documentElement.dataset.mehndi !== 'off';
}

export default function ProfilePage() {
  const { user, logout, loadCurrentUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<string | null>(null);

  const [mehndiOn, setMehndiOn] = useState(readMehndiOn);
  const [layoutMsg, setLayoutMsg] = useState<string | null>(null);

  // Re-sync the input if the canonical name changes (e.g. after a save reloads
  // the user). Adjusting state during render is the React-endorsed pattern here.
  const lastName = useRef(user?.name);
  if (user?.name !== lastName.current) {
    lastName.current = user?.name;
    setName(user?.name ?? '');
  }

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    const next = name.trim();
    if (!next || !user?.id || savingName || next === user.name) return;
    setSavingName(true);
    setNameMsg(null);
    setNameErr(null);
    try {
      await apiClient.updateUser(user.id, { name: next });
      await loadCurrentUser();
      setNameMsg('Saved');
    } catch (err) {
      setNameErr(err instanceof Error ? err.message : 'Could not save your name');
    } finally {
      setSavingName(false);
    }
  };

  const toggleMehndi = (on: boolean) => {
    setMehndiOn(on);
    try {
      if (on) {
        delete document.documentElement.dataset.mehndi;
        localStorage.removeItem('fh:mehndi');
      } else {
        document.documentElement.dataset.mehndi = 'off';
        localStorage.setItem('fh:mehndi', 'off');
      }
    } catch {
      /* storage disabled — the attribute change still applies for this session */
    }
  };

  const resetCardLayout = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('fh:cardOrder:'))
        .forEach((k) => localStorage.removeItem(k));
      setLayoutMsg('Card layout reset — reload the dashboard to see the default order.');
    } catch {
      setLayoutMsg('Could not reset — storage is unavailable.');
    }
  };

  const signOut = async () => {
    await logout();
    navigate('/login');
  };

  const joined = user?.created_at ? new Date(user.created_at) : null;

  return (
    <div className="container py-8 space-y-8 max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-ink">Your profile</h1>

      {/* Identity */}
      <section className="card">
        <form onSubmit={saveName} className="space-y-4">
          <div>
            <label className="label" htmlFor="pr-name">
              Display name
            </label>
            <div className="flex gap-2">
              <input
                id="pr-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-primary shrink-0"
                disabled={savingName || !name.trim() || name.trim() === user?.name}
              >
                {savingName ? 'Saving…' : 'Save'}
              </button>
            </div>
            {nameMsg && <p className="text-sm text-ok mt-1">{nameMsg}</p>}
            {nameErr && <p className="text-sm text-alert mt-1">{nameErr}</p>}
          </div>
        </form>

        <dl className="mt-4 pt-4 border-t border-rule grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-ink-3">Email</dt>
          <dd className="text-ink">{user?.email}</dd>
          <dt className="text-ink-3">Role</dt>
          <dd className="text-ink capitalize">{user?.role}</dd>
          {joined && (
            <>
              <dt className="text-ink-3">Member since</dt>
              <dd className="text-ink">{joined.toLocaleDateString()}</dd>
            </>
          )}
        </dl>
      </section>

      {/* Appearance */}
      <section className="card">
        <h2 className="font-display text-xl font-bold text-ink mb-4">Appearance</h2>
        <label className="flex items-center justify-between gap-4 text-sm">
          <span className="text-ink">
            Mehndi border
            <span className="block text-ink-3 font-normal">
              The henna band along the top and bottom of the screen.
            </span>
          </span>
          <input
            type="checkbox"
            className="w-4 h-4 accent-accent shrink-0"
            checked={mehndiOn}
            onChange={(e) => toggleMehndi(e.target.checked)}
          />
        </label>
      </section>

      {/* Dashboard */}
      <section className="card">
        <h2 className="font-display text-xl font-bold text-ink mb-2">Dashboard</h2>
        <p className="text-sm text-ink-2 mb-3">
          Put the dashboard cards back in their original order and sizes.
        </p>
        <button type="button" className="btn btn-secondary" onClick={resetCardLayout}>
          Reset card layout
        </button>
        {layoutMsg && <p className="text-sm text-ink-2 mt-2">{layoutMsg}</p>}
      </section>

      <button type="button" className="btn btn-secondary" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}
