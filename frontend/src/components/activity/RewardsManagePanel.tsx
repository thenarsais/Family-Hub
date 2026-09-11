import { useEffect, useState, type FormEvent } from 'react';
import { Pencil } from 'lucide-react';
import type {
  LibraryItemUpdate,
  NewLibraryItem,
  RewardEarned,
  RewardLibraryItem,
  RewardSettingsWithMember,
} from '@hooks/useRewards';
import type { components } from '@/types/api-generated';

type FamilyMember = components['schemas']['FamilyMember'];

interface Props {
  familySettings: RewardSettingsWithMember[];
  familyEarned: RewardEarned[];
  library: RewardLibraryItem[];
  members: FamilyMember[];
  onLoad: () => void;
  updateSettings: (userId: string, weeklyGoal: number) => Promise<void>;
  addLibraryItem: (data: NewLibraryItem) => Promise<void>;
  updateLibraryItem: (id: string, updates: LibraryItemUpdate) => Promise<void>;
  fulfillReward: (rewardId: string, libraryItemId: string, note?: string) => Promise<void>;
}

const MILESTONE_LABEL: Record<string, string> = {
  weekly: 'Weekly goal',
  bronze: '🥉 Bronze',
  silver: '🥈 Silver',
  gold: '🥇 Gold',
};

export default function RewardsManagePanel({
  familySettings,
  familyEarned,
  library,
  members,
  onLoad,
  updateSettings,
  addLibraryItem,
  updateLibraryItem,
  fulfillReward,
}: Props) {
  useEffect(() => {
    onLoad(); // once, when the panel mounts
  }, []);

  const nameFor = (userId: string) => {
    const m = members.find((x) => x.user_id === userId);
    return m?.name || m?.email || 'Unknown';
  };

  const pending = familyEarned.filter((r) => !r.fulfilledAt);
  const activeLibrary = library.filter((i) => i.active);

  return (
    <div className="mt-4 border-t border-rule pt-4 space-y-6">
      <WeeklyGoals familySettings={familySettings} onSave={updateSettings} />
      <RewardLibrary library={library} onAdd={addLibraryItem} onUpdate={updateLibraryItem} />
      <PendingFulfillment
        pending={pending}
        activeLibrary={activeLibrary}
        nameFor={nameFor}
        onFulfill={fulfillReward}
      />
    </div>
  );
}

function WeeklyGoals({
  familySettings,
  onSave,
}: {
  familySettings: RewardSettingsWithMember[];
  onSave: (userId: string, weeklyGoal: number) => Promise<void>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-2">Weekly goals</h3>
      {familySettings.length === 0 ? (
        <p className="text-sm text-ink-3">No family members yet.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {familySettings.map((m) => (
            <GoalRow key={m.userId} member={m} onSave={onSave} />
          ))}
        </ul>
      )}
    </div>
  );
}

function GoalRow({
  member,
  onSave,
}: {
  member: RewardSettingsWithMember;
  onSave: (userId: string, weeklyGoal: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(member.weeklyGoal);

  if (!open) {
    return (
      <li className="flex items-center gap-3 py-2 text-sm">
        <span className="flex-1 text-ink">
          {member.name ?? 'Unknown'}
          <span className="text-ink-3"> · {member.weeklyGoal} pts/week</span>
        </span>
        <button
          aria-label={`Edit ${member.name ?? 'member'}'s weekly goal`}
          title="Edit"
          className="p-1.5 text-ink-3 hover:text-accent"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </button>
      </li>
    );
  }

  const save = async () => {
    await onSave(member.userId, weeklyGoal).catch((e) =>
      console.error('Failed to save weekly goal:', e),
    );
    setOpen(false);
  };

  return (
    <li className="flex items-center gap-2 py-2 text-sm">
      <span className="flex-1 text-ink">{member.name ?? 'Unknown'}</span>
      <input
        className="input py-1 w-20 text-sm"
        type="number"
        min={1}
        value={weeklyGoal}
        onChange={(e) => setWeeklyGoal(Math.max(1, Number(e.target.value) || 1))}
        aria-label={`${member.name ?? 'member'} weekly goal`}
      />
      <span className="text-ink-3">pts/week</span>
      <button className="btn btn-primary btn-small" onClick={save}>
        Save
      </button>
      <button className="btn btn-secondary btn-small" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </li>
  );
}

function RewardLibrary({
  library,
  onAdd,
  onUpdate,
}: {
  library: RewardLibraryItem[];
  onAdd: (data: NewLibraryItem) => Promise<void>;
  onUpdate: (id: string, updates: LibraryItemUpdate) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await onAdd({
        title: t,
        description: description.trim() || undefined,
        cashAmount: cashAmount ? Number(cashAmount) : undefined,
      });
      setTitle('');
      setDescription('');
      setCashAmount('');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not add the reward');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-2">Reward library</h3>
      <form onSubmit={add} className="grid gap-2 sm:grid-cols-4 mb-3">
        <input
          className="input sm:col-span-2"
          placeholder="Reward title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          aria-label="Reward title"
        />
        <input
          className="input"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Reward description"
        />
        <input
          className="input"
          type="number"
          min={0.01}
          step="0.01"
          placeholder="$ (optional)"
          value={cashAmount}
          onChange={(e) => setCashAmount(e.target.value)}
          aria-label="Cash amount"
        />
        <button
          type="submit"
          className="btn btn-primary btn-small sm:col-span-4 justify-self-start"
          disabled={busy || !title.trim()}
        >
          {busy ? 'Adding…' : 'Add reward'}
        </button>
      </form>
      {err && <p className="text-sm text-alert bg-alert/10 rounded p-2 mb-2">{err}</p>}

      {library.length === 0 ? (
        <p className="text-sm text-ink-3">No rewards yet.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {library.map((item) => (
            <LibraryRow key={item.id} item={item} onUpdate={onUpdate} />
          ))}
        </ul>
      )}
    </div>
  );
}

function LibraryRow({
  item,
  onUpdate,
}: {
  item: RewardLibraryItem;
  onUpdate: (id: string, updates: LibraryItemUpdate) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? '');
  const [cashAmount, setCashAmount] = useState(item.cashAmount != null ? String(item.cashAmount) : '');

  const toggleActive = () =>
    onUpdate(item.id, { active: !item.active }).catch((e) =>
      console.error('Failed to toggle reward:', e),
    );

  if (!open) {
    return (
      <li className={`flex items-center gap-3 py-2 text-sm ${item.active ? '' : 'opacity-50'}`}>
        <span className={`flex-1 ${item.active ? 'text-ink' : 'text-ink-3 line-through'}`}>
          {item.title}
          {item.cashAmount != null && <span className="text-ink-3"> · ${item.cashAmount}</span>}
        </span>
        <button
          aria-label={`Edit ${item.title}`}
          title="Edit"
          className="p-1.5 text-ink-3 hover:text-accent"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button className="btn btn-secondary btn-small" onClick={toggleActive}>
          {item.active ? 'Retire' : 'Reactivate'}
        </button>
      </li>
    );
  }

  const save = async () => {
    await onUpdate(item.id, {
      title: title.trim() || item.title,
      description: description.trim() || null,
      cashAmount: cashAmount ? Number(cashAmount) : null,
    }).catch((e) => console.error('Failed to save reward:', e));
    setOpen(false);
  };

  return (
    <li className="flex flex-wrap items-center gap-2 py-2 text-sm">
      <input
        className="input py-1 w-32 text-sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Reward title"
      />
      <input
        className="input py-1 w-32 text-sm"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        aria-label="Reward description"
      />
      <input
        className="input py-1 w-20 text-sm"
        type="number"
        min={0.01}
        step="0.01"
        value={cashAmount}
        onChange={(e) => setCashAmount(e.target.value)}
        placeholder="$"
        aria-label="Cash amount"
      />
      <button className="btn btn-primary btn-small" onClick={save}>
        Save
      </button>
      <button className="btn btn-secondary btn-small" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </li>
  );
}

function PendingFulfillment({
  pending,
  activeLibrary,
  nameFor,
  onFulfill,
}: {
  pending: RewardEarned[];
  activeLibrary: RewardLibraryItem[];
  nameFor: (userId: string) => string;
  onFulfill: (rewardId: string, libraryItemId: string, note?: string) => Promise<void>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-2">
        Pending fulfillment <span className="text-ink-3 font-normal">({pending.length})</span>
      </h3>
      {pending.length === 0 ? (
        <p className="text-sm text-ink-3">Nothing pending right now.</p>
      ) : (
        <ul className="space-y-2">
          {pending.map((r) => (
            <FulfillRow
              key={r.id}
              reward={r}
              memberName={nameFor(r.userId)}
              activeLibrary={activeLibrary}
              onFulfill={onFulfill}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FulfillRow({
  reward,
  memberName,
  activeLibrary,
  onFulfill,
}: {
  reward: RewardEarned;
  memberName: string;
  activeLibrary: RewardLibraryItem[];
  onFulfill: (rewardId: string, libraryItemId: string, note?: string) => Promise<void>;
}) {
  const [libraryItemId, setLibraryItemId] = useState(activeLibrary[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const fulfill = async () => {
    if (!libraryItemId || busy) return;
    setBusy(true);
    try {
      await onFulfill(reward.id, libraryItemId, note.trim() || undefined);
    } catch (e) {
      console.error('Failed to fulfill reward:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl border border-rule bg-raised px-4 py-3 text-sm">
      <span className="flex-1 text-ink">
        {memberName} · {MILESTONE_LABEL[reward.milestoneType] ?? reward.milestoneType}
      </span>
      <select
        className="input py-1 text-sm"
        value={libraryItemId}
        onChange={(e) => setLibraryItemId(e.target.value)}
        aria-label={`Reward for ${memberName}`}
      >
        {activeLibrary.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      <input
        className="input py-1 w-32 text-sm"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        aria-label={`Fulfillment note for ${memberName}`}
      />
      <button className="btn btn-primary btn-small" onClick={fulfill} disabled={busy || !libraryItemId}>
        Fulfill
      </button>
    </li>
  );
}
