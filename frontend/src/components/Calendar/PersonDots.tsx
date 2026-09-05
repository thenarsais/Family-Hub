import type { components } from '@/types/api-generated';
import type { EventAssignment } from '@hooks/useCalendar';
import { resolveMemberColor, memberDotStyle } from '@/data/familyColors';

type FamilyMember = components['schemas']['FamilyMember'];

interface Props {
  /** Assignments for one event (from useCalendar's eventPeople map). */
  people: EventAssignment[] | undefined;
  /** The family roster — used to resolve each member's colour + name. */
  members: FamilyMember[];
  /** Slightly larger dots for the detail modal / schedule rows. */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * FR-153: a row of coloured dots after an event title. Going dots come first
 * and are solid; Maybe dots follow at 45% opacity. Renders nothing when the
 * event has no assignments.
 */
export function PersonDots({ people, members, size = 'sm', className }: Props) {
  if (!people || people.length === 0) return null;

  const dim = size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2';

  const resolved = people
    .map((p) => {
      const idx = members.findIndex((m) => m.id === p.familyMemberId);
      if (idx === -1) return null;
      const member = members[idx];
      const color = resolveMemberColor(member.color, idx);
      const name = member.name || member.email || 'Member';
      return { key: p.familyMemberId, role: p.role, hex: color.hex, name };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => (a.role === b.role ? 0 : a.role === 'going' ? -1 : 1));

  if (resolved.length === 0) return null;

  return (
    <span className={`inline-flex items-center gap-1 align-middle ${className ?? ''}`}>
      {resolved.map((r) => (
        <span
          key={r.key}
          className={`${dim} rounded-full shrink-0`}
          style={memberDotStyle(r.hex, r.role)}
          title={`${r.name} — ${r.role === 'going' ? 'Going' : 'Maybe'}`}
        />
      ))}
    </span>
  );
}

export default PersonDots;
