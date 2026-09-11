import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import type { KungFuProfileUpdate, KungFuProfileWithMember } from '@hooks/useKungFu';

interface Props {
  familyProfiles: KungFuProfileWithMember[];
  onLoad: () => void;
  updateProfile: (userId: string, updates: KungFuProfileUpdate) => Promise<void>;
}

export default function KungFuManagePanel({ familyProfiles, onLoad, updateProfile }: Props) {
  useEffect(() => {
    onLoad(); // once, when the panel mounts
  }, []);

  return (
    <div className="mt-4 border-t border-rule pt-4 space-y-2">
      <h3 className="text-sm font-semibold text-ink">Kung Fu profiles</h3>
      {familyProfiles.length === 0 ? (
        <p className="text-sm text-ink-3">No family members yet.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {familyProfiles.map((m) => (
            <EditProfileRow key={m.userId} member={m} onSave={updateProfile} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EditProfileRow({
  member,
  onSave,
}: {
  member: KungFuProfileWithMember;
  onSave: (userId: string, updates: KungFuProfileUpdate) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [belt, setBelt] = useState(member.belt ?? '');
  const [beltSince, setBeltSince] = useState(member.beltSince ?? '');
  const [pointsPerClass, setPointsPerClass] = useState(member.pointsPerClass);
  const [pointsPerPractice, setPointsPerPractice] = useState(member.pointsPerPractice);

  if (!open) {
    return (
      <li className="flex items-center gap-3 py-2 text-sm">
        <span className="flex-1 text-ink">
          {member.name ?? 'Unknown'}
          <span className="text-ink-3">
            {' · '}
            {member.belt ?? 'no belt'} · +{member.pointsPerClass}/class · +
            {member.pointsPerPractice}/practice
          </span>
        </span>
        <button
          aria-label={`Edit ${member.name ?? 'member'}'s kung fu profile`}
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
    await onSave(member.userId, {
      belt: belt.trim() || null,
      beltSince: beltSince || null,
      pointsPerClass,
      pointsPerPractice,
    }).catch((e) => console.error('Failed to save kung fu profile:', e));
    setOpen(false);
  };

  return (
    <li className="flex flex-wrap items-center gap-2 py-2 text-sm">
      <span className="flex-1 text-ink">{member.name ?? 'Unknown'}</span>
      <input
        className="input py-1 w-32 text-sm"
        value={belt}
        onChange={(e) => setBelt(e.target.value)}
        placeholder="Belt"
        aria-label={`${member.name ?? 'member'} belt`}
      />
      <input
        className="input py-1 w-36 text-sm"
        type="date"
        value={beltSince}
        onChange={(e) => setBeltSince(e.target.value)}
        aria-label={`${member.name ?? 'member'} belt since`}
      />
      <input
        className="input py-1 w-16 text-sm"
        type="number"
        min={1}
        value={pointsPerClass}
        onChange={(e) => setPointsPerClass(Math.max(1, Number(e.target.value) || 1))}
        aria-label={`${member.name ?? 'member'} points per class`}
      />
      <span className="text-ink-3">/class</span>
      <input
        className="input py-1 w-16 text-sm"
        type="number"
        min={1}
        value={pointsPerPractice}
        onChange={(e) => setPointsPerPractice(Math.max(1, Number(e.target.value) || 1))}
        aria-label={`${member.name ?? 'member'} points per practice`}
      />
      <span className="text-ink-3">/practice</span>
      <button className="btn btn-primary btn-small" onClick={save}>
        Save
      </button>
      <button className="btn btn-secondary btn-small" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </li>
  );
}
