import { vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoutineManagePanel from '@/components/kids/RoutineManagePanel';

const R = (over = {}) => ({
  id: 'r1',
  userId: 'kid-1',
  slot: 'morning',
  label: 'Brush teeth',
  emoji: '🪥',
  sortOrder: 0,
  enabled: true,
  doneToday: false,
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe('RoutineManagePanel', () => {
  it('adds a step with the entered label, emoji and slot', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<RoutineManagePanel routines={[]} onCreate={onCreate} onUpdate={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Step name'), 'Wash face');
    await userEvent.type(screen.getByLabelText('Emoji'), '🧼');
    await userEvent.selectOptions(screen.getByLabelText('Time of day'), 'evening');
    await userEvent.click(screen.getByRole('button', { name: /add step/i }));

    expect(onCreate).toHaveBeenCalledWith({
      slot: 'evening',
      label: 'Wash face',
      emoji: '🧼',
      sortOrder: 0,
    });
  });

  it('does not submit a blank step', async () => {
    const onCreate = vi.fn();
    render(<RoutineManagePanel routines={[]} onCreate={onCreate} onUpdate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add step/i })).toBeDisabled();
  });

  it('lists existing steps and hides one', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<RoutineManagePanel routines={[R() as never]} onCreate={vi.fn()} onUpdate={onUpdate} />);

    expect(screen.getByText(/brush teeth/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Hide' }));
    expect(onUpdate).toHaveBeenCalledWith('r1', { enabled: false });
  });

  it('shows a hidden step and can re-show it', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <RoutineManagePanel
        routines={[R({ enabled: false }) as never]}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(onUpdate).toHaveBeenCalledWith('r1', { enabled: true });
  });

  it('edits a step inline', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<RoutineManagePanel routines={[R() as never]} onCreate={vi.fn()} onUpdate={onUpdate} />);

    await userEvent.click(screen.getByRole('button', { name: /edit brush teeth/i }));
    const row = screen.getByRole('listitem');
    const label = within(row).getByLabelText('Step name');
    await userEvent.clear(label);
    await userEvent.type(label, 'Floss');
    await userEvent.click(within(row).getByRole('button', { name: 'Save' }));

    expect(onUpdate).toHaveBeenCalledWith('r1', { label: 'Floss', emoji: '🪥', slot: 'morning' });
  });

  it('cancels an inline edit without calling onUpdate', async () => {
    const onUpdate = vi.fn();
    render(<RoutineManagePanel routines={[R() as never]} onCreate={vi.fn()} onUpdate={onUpdate} />);
    await userEvent.click(screen.getByRole('button', { name: /edit brush teeth/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('surfaces a create error', async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error('server said no'));
    render(<RoutineManagePanel routines={[]} onCreate={onCreate} onUpdate={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Step name'), 'Wash face');
    await userEvent.type(screen.getByLabelText('Emoji'), '🧼');
    await userEvent.click(screen.getByRole('button', { name: /add step/i }));
    expect(await screen.findByText('server said no')).toBeInTheDocument();
  });

  it('shows the empty-list note', () => {
    render(<RoutineManagePanel routines={[]} onCreate={vi.fn()} onUpdate={vi.fn()} />);
    expect(screen.getByText(/no steps yet/i)).toBeInTheDocument();
  });
});
