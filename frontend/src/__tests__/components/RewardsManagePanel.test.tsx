import { vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RewardsManagePanel from '@/components/activity/RewardsManagePanel';

const FAMILY_SETTINGS = [{ userId: 'u1', name: 'Krish', weeklyGoal: 50 }];
const LIBRARY = [
  { id: 'lib-1', title: '$5 allowance', description: null, cashAmount: 5, active: true },
  { id: 'lib-2', title: 'Retired reward', description: null, cashAmount: null, active: false },
];
const PENDING = [
  {
    id: 'r1', userId: 'u1', milestoneType: 'weekly', periodKey: '2026-09-07',
    earnedAt: 'x', fulfilledAt: null, libraryItem: null, fulfillmentNote: null,
  },
];
const MEMBERS = [{ user_id: 'u1', name: 'Krish', email: 'k@x.com', role: 'child' }];

function setup(over: Record<string, unknown> = {}) {
  const fns = {
    onLoad: vi.fn(),
    updateSettings: vi.fn().mockResolvedValue(undefined),
    addLibraryItem: vi.fn().mockResolvedValue(undefined),
    updateLibraryItem: vi.fn().mockResolvedValue(undefined),
    fulfillReward: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <RewardsManagePanel
      familySettings={FAMILY_SETTINGS as never}
      familyEarned={PENDING as never}
      library={LIBRARY as never}
      members={MEMBERS as never}
      {...fns}
      {...over}
    />,
  );
  return fns;
}

beforeEach(() => vi.clearAllMocks());

describe('RewardsManagePanel', () => {
  it('loads family data on mount', () => {
    const { onLoad } = setup();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it("edits a member's weekly goal inline", async () => {
    const { updateSettings } = setup();
    await userEvent.click(screen.getByRole('button', { name: /edit krish's weekly goal/i }));
    fireEvent.change(screen.getByLabelText('Krish weekly goal'), { target: { value: '75' } });
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(updateSettings).toHaveBeenCalledWith('u1', 75);
  });

  it('adds a new library item', async () => {
    const { addLibraryItem } = setup();
    await userEvent.type(screen.getByLabelText('Reward title'), 'New reward');
    await userEvent.click(screen.getByRole('button', { name: /add reward/i }));
    expect(addLibraryItem).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New reward' }),
    );
  });

  it('retires an active library item', async () => {
    const { updateLibraryItem } = setup();
    const retireButtons = screen.getAllByRole('button', { name: /retire|reactivate/i });
    await userEvent.click(retireButtons[0]); // $5 allowance is active -> "Retire"
    expect(updateLibraryItem).toHaveBeenCalledWith('lib-1', { active: false });
  });

  it('fulfills a pending reward with a chosen library item', async () => {
    const { fulfillReward } = setup();
    await userEvent.click(screen.getByRole('button', { name: /^fulfill$/i }));
    expect(fulfillReward).toHaveBeenCalledWith('r1', 'lib-1', undefined);
  });

  it('shows empty states', () => {
    setup({ familySettings: [], library: [], familyEarned: [] });
    expect(screen.getByText(/no family members yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no rewards yet/i)).toBeInTheDocument();
    expect(screen.getByText(/nothing pending right now/i)).toBeInTheDocument();
  });
});
