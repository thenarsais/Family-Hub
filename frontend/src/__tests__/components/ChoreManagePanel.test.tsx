import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChoreManagePanel from '@/components/activity/ChoreManagePanel';

const members = [
  { user_id: 'u1', role: 'parent', name: 'Parent', email: 'p@x.com' },
  { user_id: 'u2', role: 'child', name: 'Krish', email: 'k@x.com' },
];

const CHORE = {
  id: 'c1',
  userId: 'u2',
  name: 'Trash',
  timeSlot: 'morning' as const,
  pointsValue: 10,
  enabled: true,
  createdAt: '',
  updatedAt: '',
  completedToday: false,
};

function setup(over: { familyChores?: unknown[] } = {}) {
  const createChore = vi.fn().mockResolvedValue(undefined);
  const updateChore = vi.fn().mockResolvedValue(undefined);
  const onLoad = vi.fn();
  render(
    <ChoreManagePanel
      familyChores={(over.familyChores ?? [CHORE]) as never}
      members={members as never}
      selfId="u1"
      onLoad={onLoad}
      createChore={createChore}
      updateChore={updateChore}
    />,
  );
  return { createChore, updateChore, onLoad };
}

beforeEach(() => vi.clearAllMocks());

describe('ChoreManagePanel', () => {
  it('loads the family list on mount', () => {
    const { onLoad } = setup();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('creates a chore for another family member', async () => {
    const { createChore } = setup();
    await userEvent.type(screen.getByLabelText('Chore name'), 'Dishes');
    await userEvent.selectOptions(screen.getByLabelText('Assign to'), 'u2');
    await userEvent.selectOptions(screen.getByLabelText('Time of day'), 'evening');
    await userEvent.click(screen.getByRole('button', { name: /add chore/i }));

    await waitFor(() =>
      expect(createChore).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Dishes', timeSlot: 'evening', assigneeId: 'u2' }),
      ),
    );
  });

  it('sends assigneeId undefined when the chore is for self', async () => {
    const { createChore } = setup();
    await userEvent.type(screen.getByLabelText('Chore name'), 'Laundry');
    await userEvent.click(screen.getByRole('button', { name: /add chore/i }));
    await waitFor(() =>
      expect(createChore).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Laundry', assigneeId: undefined }),
      ),
    );
  });

  it('toggles a chore enabled/disabled', async () => {
    const { updateChore } = setup();
    await userEvent.click(screen.getByRole('button', { name: /disable/i }));
    expect(updateChore).toHaveBeenCalledWith('c1', { enabled: false });
  });

  it('edits a chore inline', async () => {
    const { updateChore } = setup();
    await userEvent.click(screen.getByRole('button', { name: /edit trash/i }));
    const nameInput = screen.getAllByLabelText('Chore name')[1];
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Take out trash');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(updateChore).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ name: 'Take out trash' }),
    );
  });

  it('cancels an inline edit without saving', async () => {
    const { updateChore } = setup();
    await userEvent.click(screen.getByRole('button', { name: /edit trash/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(updateChore).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
  });

  it('keeps the existing name when the edit field is emptied', async () => {
    const { updateChore } = setup();
    await userEvent.click(screen.getByRole('button', { name: /edit trash/i }));
    await userEvent.clear(screen.getAllByLabelText('Chore name')[1]);
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(updateChore).toHaveBeenCalledWith('c1', expect.objectContaining({ name: 'Trash' }));
  });

  it('shows an error when the create call fails', async () => {
    const createChore = vi.fn().mockRejectedValue(new Error('assignee not in family'));
    render(
      <ChoreManagePanel
        familyChores={[] as never}
        members={members as never}
        selfId="u1"
        onLoad={vi.fn()}
        createChore={createChore}
        updateChore={vi.fn()}
      />,
    );
    await userEvent.type(screen.getByLabelText('Chore name'), 'Mop');
    await userEvent.click(screen.getByRole('button', { name: /add chore/i }));
    expect(await screen.findByText(/assignee not in family/i)).toBeInTheDocument();
  });

  it('renders the empty state with no chores', () => {
    setup({ familyChores: [] });
    expect(screen.getByText(/no chores yet/i)).toBeInTheDocument();
  });
});
