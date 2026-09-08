import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HabitManagePanel from '@/components/activity/HabitManagePanel';

const members = [
  { user_id: 'u1', role: 'parent', name: 'Parent', email: 'p@x.com' },
  { user_id: 'u2', role: 'child', name: 'Krish', email: 'k@x.com' },
];

const HABIT = {
  id: 'h1',
  userId: 'u2',
  title: 'Meditate',
  weeklyTarget: 5,
  pointsValue: 10,
  enabled: true,
  createdAt: '',
  updatedAt: '',
  weekCompletions: 0,
  completedToday: false,
  weekStreak: 0,
};

function setup(over: { familyHabits?: unknown[] } = {}) {
  const createHabit = vi.fn().mockResolvedValue(undefined);
  const updateHabit = vi.fn().mockResolvedValue(undefined);
  const onLoad = vi.fn();
  render(
    <HabitManagePanel
      familyHabits={(over.familyHabits ?? [HABIT]) as never}
      members={members as never}
      selfId="u1"
      onLoad={onLoad}
      createHabit={createHabit}
      updateHabit={updateHabit}
    />,
  );
  return { createHabit, updateHabit, onLoad };
}

beforeEach(() => vi.clearAllMocks());

describe('HabitManagePanel', () => {
  it('loads the family list on mount', () => {
    const { onLoad } = setup();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('creates a habit for another member with a weekly target', async () => {
    const { createHabit } = setup();
    await userEvent.type(screen.getByLabelText('Habit name'), 'Pull-ups');
    await userEvent.selectOptions(screen.getByLabelText('Assign to'), 'u2');
    await userEvent.selectOptions(screen.getByLabelText('Days per week'), '3');
    await userEvent.click(screen.getByRole('button', { name: /add habit/i }));

    await waitFor(() =>
      expect(createHabit).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Pull-ups', weeklyTarget: 3, assigneeId: 'u2' }),
      ),
    );
  });

  it('sends assigneeId undefined for a self habit', async () => {
    const { createHabit } = setup();
    await userEvent.type(screen.getByLabelText('Habit name'), 'Water');
    await userEvent.click(screen.getByRole('button', { name: /add habit/i }));
    await waitFor(() =>
      expect(createHabit).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Water', assigneeId: undefined }),
      ),
    );
  });

  it('toggles a habit enabled/disabled', async () => {
    const { updateHabit } = setup();
    await userEvent.click(screen.getByRole('button', { name: /disable/i }));
    expect(updateHabit).toHaveBeenCalledWith('h1', { enabled: false });
  });

  it('edits a habit inline', async () => {
    const { updateHabit } = setup();
    await userEvent.click(screen.getByRole('button', { name: /edit meditate/i }));
    const nameInput = screen.getAllByLabelText('Habit name')[1];
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Breathe');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(updateHabit).toHaveBeenCalledWith('h1', expect.objectContaining({ title: 'Breathe' }));
  });

  it('shows an error when create fails', async () => {
    const createHabit = vi.fn().mockRejectedValue(new Error('not in family'));
    render(
      <HabitManagePanel
        familyHabits={[] as never}
        members={members as never}
        selfId="u1"
        onLoad={vi.fn()}
        createHabit={createHabit}
        updateHabit={vi.fn()}
      />,
    );
    await userEvent.type(screen.getByLabelText('Habit name'), 'Read');
    await userEvent.click(screen.getByRole('button', { name: /add habit/i }));
    expect(await screen.findByText(/not in family/i)).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    setup({ familyHabits: [] });
    expect(screen.getByText(/no habits yet/i)).toBeInTheDocument();
  });
});
