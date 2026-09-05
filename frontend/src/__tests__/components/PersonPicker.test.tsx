import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { PersonPicker } from '@/components/Calendar/PersonPicker';
import type { components } from '@/types/api-generated';
import type { EventAssignment } from '@/hooks/useCalendar';

type FamilyMember = components['schemas']['FamilyMember'];

const members = [
  { id: 'm1', family_id: 'f1', user_id: 'u1', role: 'parent', name: 'Anand', color: 'anand' },
  { id: 'm2', family_id: 'f1', user_id: 'u2', role: 'child', name: 'Krish', color: 'krish' },
] as FamilyMember[];

function setup(value: EventAssignment[] = []) {
  const onChange = vi.fn();
  render(<PersonPicker members={members} value={value} onChange={onChange} />);
  return { onChange };
}

describe('PersonPicker', () => {
  it('shows a hint when the roster is empty', () => {
    render(<PersonPicker members={[]} value={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/add family members/i)).toBeInTheDocument();
  });

  it('adds a member as Going', () => {
    const { onChange } = setup([]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Going' })[0]);
    expect(onChange).toHaveBeenCalledWith([{ familyMemberId: 'm1', role: 'going' }]);
  });

  it('switches an existing assignment from Going to Maybe', () => {
    const { onChange } = setup([{ familyMemberId: 'm1', role: 'going' }]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Maybe' })[0]);
    expect(onChange).toHaveBeenCalledWith([{ familyMemberId: 'm1', role: 'maybe' }]);
  });

  it('removes an assignment when "—" is chosen', () => {
    const { onChange } = setup([
      { familyMemberId: 'm1', role: 'going' },
      { familyMemberId: 'm2', role: 'maybe' },
    ]);
    fireEvent.click(screen.getAllByRole('button', { name: '—' })[0]);
    expect(onChange).toHaveBeenCalledWith([{ familyMemberId: 'm2', role: 'maybe' }]);
  });

  it('marks the current state with aria-pressed', () => {
    setup([{ familyMemberId: 'm2', role: 'going' }]);
    // m2 is the second row; its Going button should be pressed.
    const goingButtons = screen.getAllByRole('button', { name: 'Going' });
    expect(goingButtons[1]).toHaveAttribute('aria-pressed', 'true');
    expect(goingButtons[0]).toHaveAttribute('aria-pressed', 'false');
  });
});
