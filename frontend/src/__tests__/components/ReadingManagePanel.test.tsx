import { vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingManagePanel from '@/components/activity/ReadingManagePanel';

const FAMILY_GOALS = [
  { userId: 'u1', name: 'Krish', dailyMinutes: 20, weeklyMinutes: 100, pointsValue: 10 },
  { userId: 'u2', name: 'Karishma', dailyMinutes: 15, weeklyMinutes: 75, pointsValue: 5 },
];

function setup(over: { familyGoals?: unknown[] } = {}) {
  const updateGoals = vi.fn().mockResolvedValue(undefined);
  const onLoad = vi.fn();
  render(
    <ReadingManagePanel
      familyGoals={(over.familyGoals ?? FAMILY_GOALS) as never}
      onLoad={onLoad}
      updateGoals={updateGoals}
    />,
  );
  return { updateGoals, onLoad };
}

beforeEach(() => vi.clearAllMocks());

describe('ReadingManagePanel', () => {
  it('loads the family list on mount', () => {
    const { onLoad } = setup();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('lists each member with their current goals', () => {
    setup();
    expect(screen.getByText(/20 min\/day · 100 min\/week · \+10 pts/)).toBeInTheDocument();
    expect(screen.getByText(/15 min\/day · 75 min\/week · \+5 pts/)).toBeInTheDocument();
  });

  it('edits a member\'s goals inline', async () => {
    const { updateGoals } = setup();
    await userEvent.click(screen.getByRole('button', { name: /edit krish's reading goals/i }));
    fireEvent.change(screen.getByLabelText('Krish daily minutes goal'), { target: { value: '30' } });
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(updateGoals).toHaveBeenCalledWith('u1', {
      dailyMinutes: 30,
      weeklyMinutes: 100,
      pointsValue: 10,
    });
  });

  it('cancels an inline edit without saving', async () => {
    const { updateGoals } = setup();
    await userEvent.click(screen.getByRole('button', { name: /edit krish's reading goals/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(updateGoals).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
  });

  it('renders the empty state with no family members', () => {
    setup({ familyGoals: [] });
    expect(screen.getByText(/no family members yet/i)).toBeInTheDocument();
  });
});
