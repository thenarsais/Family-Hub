import { useMemo, useState, type FormEvent } from 'react';
import { UserPlus, Mail, Trash2, ChevronDown } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { useFamily } from '@hooks/useFamily';
import { colorForIndex } from '@/data/familyColors';
import type { components } from '@/types/api-generated';

type Role = components['schemas']['FamilyMember']['role'];
const ROLES: Role[] = ['admin', 'parent', 'guardian', 'child'];

function Spinner() {
  return (
    <div className="py-10 flex justify-center" role="status" aria-label="Loading">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
    </div>
  );
}

function CreateFamilyForm({
  onCreate,
}: {
  onCreate: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await onCreate(name.trim(), description.trim());
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not create the family');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card max-w-lg">
      <h2 className="font-display text-xl font-bold text-ink mb-1">Create your family</h2>
      <p className="text-sm text-ink-2 mb-4">
        This is the household everything on the hub belongs to. You'll be its admin.
      </p>
      {err && (
        <p className="bg-alert/10 border border-alert/40 text-alert text-sm rounded px-3 py-2 mb-4">
          {err}
        </p>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="fam-name">
            Family name
          </label>
          <input
            id="fam-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="The Narsais"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="fam-desc">
            Description <span className="text-ink-3 font-normal">(optional)</span>
          </label>
          <input
            id="fam-desc"
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Home base"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>
          {busy ? 'Creating…' : 'Create family'}
        </button>
      </form>
    </div>
  );
}

export default function FamilyPage() {
  const { user } = useAuth();
  const {
    family,
    members,
    settings,
    loading,
    error,
    createFamily,
    addChild,
    inviteMember,
    updateMemberRole,
    removeMember,
    updateSettings,
  } = useFamily();

  const caller = members.find((m) => m.user_id === user?.id);
  const canManage = caller ? ['admin', 'parent'].includes(caller.role) : false;
  const isAdmin = caller?.role === 'admin';

  // invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('parent');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteErr, setInviteErr] = useState<string | null>(null);

  // add child
  const [childOpen, setChildOpen] = useState(false);
  const [childName, setChildName] = useState('');
  const [childEmail, setChildEmail] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [childYear, setChildYear] = useState('');
  const [childBusy, setChildBusy] = useState(false);
  const [childErr, setChildErr] = useState<string | null>(null);

  const orderedMembers = useMemo(
    () =>
      [...members].sort(
        (a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || (a.joined_at ?? '').localeCompare(b.joined_at ?? ''),
      ),
    [members],
  );

  if (loading) return <div className="container py-8"><Spinner /></div>;

  if (!family) {
    return (
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold text-ink mb-6">Family</h1>
        <CreateFamilyForm onCreate={(name, description) => createFamily({ name, description }).then(() => undefined)} />
      </div>
    );
  }

  const submitInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || inviteBusy) return;
    setInviteBusy(true);
    setInviteErr(null);
    setInviteToken(null);
    try {
      const token = await inviteMember(inviteEmail.trim(), inviteRole);
      setInviteToken(token || '(invitation sent)');
      setInviteEmail('');
    } catch (e2) {
      setInviteErr(e2 instanceof Error ? e2.message : 'Could not send the invitation');
    } finally {
      setInviteBusy(false);
    }
  };

  const submitChild = async (e: FormEvent) => {
    e.preventDefault();
    const year = Number(childYear);
    if (!childName.trim() || !childEmail.trim() || !childPassword || !year || childBusy) return;
    setChildBusy(true);
    setChildErr(null);
    try {
      await addChild({
        name: childName.trim(),
        email: childEmail.trim(),
        password: childPassword,
        birth_year: year,
      });
      setChildName('');
      setChildEmail('');
      setChildPassword('');
      setChildYear('');
      setChildOpen(false);
    } catch (e2) {
      setChildErr(e2 instanceof Error ? e2.message : 'Could not add the child');
    } finally {
      setChildBusy(false);
    }
  };

  const toggleSetting = (key: string, value: boolean) => {
    void updateSettings({ [key]: value });
  };

  return (
    <div className="container py-8 space-y-8 max-w-3xl">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink">{family.name}</h1>
        {family.description && <p className="text-ink-2 mt-1">{family.description}</p>}
      </header>

      {error && (
        <p className="bg-alert/10 border border-alert/40 text-alert text-sm rounded px-3 py-2">
          {error}
        </p>
      )}

      {/* Members */}
      <section className="card">
        <h2 className="font-display text-xl font-bold text-ink mb-4">
          Members <span className="text-ink-3 text-sm font-normal">({members.length})</span>
        </h2>
        <ul className="divide-y divide-rule">
          {orderedMembers.map((m, i) => {
            const c = colorForIndex(i);
            const isSelf = m.user_id === user?.id;
            return (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.hex }}
                  title={`${c.label} — set in calendar settings`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink truncate">
                    {m.name || m.email || m.user_id}
                    {isSelf && <span className="text-ink-3 font-normal"> · you</span>}
                  </p>
                  {m.email && m.name && <p className="text-xs text-ink-3 truncate">{m.email}</p>}
                </div>

                {isAdmin && !isSelf ? (
                  <select
                    className="input py-1 w-auto text-sm"
                    value={m.role}
                    onChange={(e) => void updateMemberRole(m.user_id, e.target.value as Role)}
                    aria-label={`Role for ${m.name || m.email || 'member'}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="badge badge-primary capitalize">{m.role}</span>
                )}

                {isAdmin && !isSelf && (
                  <button
                    type="button"
                    onClick={() => void removeMember(m.user_id)}
                    aria-label={`Remove ${m.name || m.email || 'member'}`}
                    className="p-1 text-ink-3 hover:text-alert"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Invite */}
      {canManage && (
        <section className="card">
          <h2 className="font-display text-xl font-bold text-ink mb-1 flex items-center gap-2">
            <Mail className="w-5 h-5 text-accent" aria-hidden="true" /> Invite someone
          </h2>
          <p className="text-sm text-ink-2 mb-4">
            Sends an invitation link they can use to join with their own login.
          </p>
          {inviteErr && (
            <p className="bg-alert/10 border border-alert/40 text-alert text-sm rounded px-3 py-2 mb-3">
              {inviteErr}
            </p>
          )}
          {inviteToken && (
            <p className="bg-accent-soft border border-accent/30 text-accent-strong text-sm rounded px-3 py-2 mb-3 break-all">
              Invitation created: <code>{inviteToken}</code>
            </p>
          )}
          <form onSubmit={submitInvite} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[12rem]">
              <label className="label" htmlFor="inv-email">
                Email
              </label>
              <input
                id="inv-email"
                type="email"
                className="input"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="grandpa@example.com"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="inv-role">
                Role
              </label>
              <select
                id="inv-role"
                className="input w-auto"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
              >
                {ROLES.filter((r) => r !== 'admin').map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={inviteBusy || !inviteEmail.trim()}>
              {inviteBusy ? 'Sending…' : 'Send invite'}
            </button>
          </form>

          {/* Add a child account */}
          <div className="mt-6 border-t border-rule pt-4">
            <button
              type="button"
              onClick={() => setChildOpen((o) => !o)}
              aria-expanded={childOpen}
              className="flex items-center gap-2 text-sm font-semibold text-accent"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              Add a child account
              <ChevronDown className={`w-4 h-4 transition-transform ${childOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {childOpen && (
              <form onSubmit={submitChild} className="mt-3 grid gap-3 sm:grid-cols-2">
                {childErr && (
                  <p className="sm:col-span-2 bg-alert/10 border border-alert/40 text-alert text-sm rounded px-3 py-2">
                    {childErr}
                  </p>
                )}
                <div>
                  <label className="label" htmlFor="ch-name">Name</label>
                  <input id="ch-name" className="input" value={childName} onChange={(e) => setChildName(e.target.value)} required />
                </div>
                <div>
                  <label className="label" htmlFor="ch-year">Birth year</label>
                  <input
                    id="ch-year"
                    className="input"
                    inputMode="numeric"
                    value={childYear}
                    onChange={(e) => setChildYear(e.target.value)}
                    placeholder="2016"
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="ch-email">Login email</label>
                  <input id="ch-email" type="email" className="input" value={childEmail} onChange={(e) => setChildEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="label" htmlFor="ch-pass">Temporary password</label>
                  <input id="ch-pass" type="password" className="input" value={childPassword} onChange={(e) => setChildPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary sm:col-span-2 sm:w-auto" disabled={childBusy}>
                  {childBusy ? 'Adding…' : 'Add child'}
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* Settings */}
      {canManage && settings && (
        <section className="card">
          <h2 className="font-display text-xl font-bold text-ink mb-4">Family settings</h2>
          <div className="space-y-3">
            {(
              [
                ['notifications_enabled', 'Notifications'],
                ['points_system_enabled', 'Points system'],
                ['badges_system_enabled', 'Badges'],
                ['leaderboard_enabled', 'Leaderboard'],
                ['bedtime_enabled', 'Bedtime / night mode'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-ink">{label}</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-accent"
                  checked={Boolean(settings[key])}
                  onChange={(e) => toggleSetting(key, e.target.checked)}
                />
              </label>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
