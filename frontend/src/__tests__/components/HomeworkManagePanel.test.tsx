import { vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeworkManagePanel from '@/components/activity/HomeworkManagePanel';

const members = [
  { user_id: 'u1', role: 'parent', name: 'Parent', email: 'p@x.com' },
  { user_id: 'u2', role: 'child', name: 'Krish', email: 'k@x.com' },
];

const ITEM = {
  id: 'hw-1',
  userId: 'u2',
  title: 'Math p.12',
  subject: 'Math',
  dueDate: '2026-09-12',
  pointsValue: 10,
  completedAt: null,
  isOverdue: false,
  completed: false,
};

function setup(over: { familyItems?: unknown[] } = {}) {
  const createItem = vi.fn().mockResolvedValue(undefined);
  const updateItem = vi.fn().mockResolvedValue(undefined);
  const deleteItem = vi.fn().mockResolvedValue(undefined);
  const onLoad = vi.fn();
  render(
    <HomeworkManagePanel
      familyItems={(over.familyItems ?? [ITEM]) as never}
      members={members as never}
      selfId="u1"
      onLoad={onLoad}
      createItem={createItem}
      updateItem={updateItem}
      deleteItem={deleteItem}
    />,
  );
  return { createItem, updateItem, deleteItem, onLoad };
}

beforeEach(() => vi.clearAllMocks());

describe('HomeworkManagePanel', () => {
  it('loads the family list on mount', () => {
    const { onLoad } = setup();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('creates an item for another family member with a due date + points', async () => {
    const { createItem } = setup();
    await userEvent.type(screen.getByLabelText('Homework title'), 'Essay draft');
    await userEvent.selectOptions(screen.getByLabelText('Assign to'), 'u2');
    fireEvent.change(screen.getByLabelText('Points'), { target: { value: '25' } });
    await userEvent.click(screen.getByRole('button', { name: /add homework/i }));

    await waitFor(() =>
      expect(createItem).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Essay draft', assigneeId: 'u2', pointsValue: 25 }),
      ),
    );
  });

  it('sends assigneeId undefined when the item is for self', async () => {
    const { createItem } = setup();
    await userEvent.type(screen.getByLabelText('Homework title'), 'Reading log');
    await userEvent.click(screen.getByRole('button', { name: /add homework/i }));
    await waitFor(() =>
      expect(createItem).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Reading log', assigneeId: undefined }),
      ),
    );
  });

  it('deletes an item only after a confirm tap', async () => {
    const { deleteItem } = setup();
    await userEvent.click(screen.getByRole('button', { name: /^delete math p\.12$/i }));
    expect(deleteItem).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /confirm delete math p\.12/i }));
    expect(deleteItem).toHaveBeenCalledWith('hw-1');
  });

  it('edits an item inline', async () => {
    const { updateItem } = setup();
    await userEvent.click(screen.getByRole('button', { name: /edit math p\.12/i }));
    const titleInput = screen.getAllByLabelText('Homework title')[1];
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Math p.14');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(updateItem).toHaveBeenCalledWith(
      'hw-1',
      expect.objectContaining({ title: 'Math p.14' }),
    );
  });

  it('shows an error when the create call fails', async () => {
    const createItem = vi.fn().mockRejectedValue(new Error('assignee not in family'));
    render(
      <HomeworkManagePanel
        familyItems={[] as never}
        members={members as never}
        selfId="u1"
        onLoad={vi.fn()}
        createItem={createItem}
        updateItem={vi.fn()}
        deleteItem={vi.fn()}
      />,
    );
    await userEvent.type(screen.getByLabelText('Homework title'), 'Mop');
    await userEvent.click(screen.getByRole('button', { name: /add homework/i }));
    expect(await screen.findByText(/assignee not in family/i)).toBeInTheDocument();
  });

  it('renders the empty state with no items', () => {
    setup({ familyItems: [] });
    expect(screen.getByText(/no homework yet/i)).toBeInTheDocument();
  });
});
