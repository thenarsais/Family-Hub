import type { components } from '@/types/api-generated';
import type { EventAssignment } from '@hooks/useCalendar';
import { resolveMemberColor } from '@/data/familyColors';

type FamilyMember = components['schemas']['FamilyMember'];

interface Props {
  members: FamilyMember[];
  value: EventAssignment[];
  onChange: (next: EventAssignment[]) => void;
  disabled?: boolean;
}

type State = 'none' | 'going' | 'maybe';
const STATES: { key: State; label: string }[] = [
  { key: 'none', label: '—' },
  { key: 'going', label: 'Going' },
  { key: 'maybe', label: 'Maybe' },
];

/**
 * FR-153: "Who's this for?" — one row per family member, each a three-way
 * toggle between not-involved / Going / Maybe. Used by both the event form and
 * the event detail modal.
 */
export function PersonPicker({ members, value, onChange, disabled }: Props) {
  const stateFor = (memberId: string): State =>
    value.find((v) => v.familyMemberId === memberId)?.role ?? 'none';

  const set = (memberId: string, next: State) => {
    const without = value.filter((v) => v.familyMemberId !== memberId);
    onChange(next === 'none' ? without : [...without, { familyMemberId: memberId, role: next }]);
  };

  if (members.length === 0) {
    return <p className="text-sm text-ink-3">Add family members to assign them to events.</p>;
  }

  return (
    <ul className="space-y-2">
      {members.map((m, i) => {
        const color = resolveMemberColor(m.color, i);
        const current = stateFor(m.id);
        const name = m.name || m.email || 'Member';
        return (
          <li key={m.id} className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: color.hex }}
            />
            <span className="flex-1 min-w-0 text-sm text-ink truncate">{name}</span>
            <span
              className="inline-flex rounded-lg border border-rule overflow-hidden"
              role="group"
              aria-label={`Attendance for ${name}`}
            >
              {STATES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  disabled={disabled}
                  aria-pressed={current === s.key}
                  onClick={() => set(m.id, s.key)}
                  className={`px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
                    current === s.key
                      ? 'bg-accent text-white'
                      : 'bg-paper text-ink-2 hover:bg-accent-soft'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default PersonPicker;
