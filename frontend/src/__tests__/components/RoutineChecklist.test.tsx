import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoutineChecklist from '@/components/kids/RoutineChecklist';

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

describe('RoutineChecklist', () => {
  it('renders the title and each routine tile', () => {
    render(
      <RoutineChecklist title="Morning" emoji="🌅" routines={[R() as never]} onToggle={vi.fn()} />,
    );
    expect(screen.getByRole('heading', { name: /morning/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /brush teeth/i })).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    render(<RoutineChecklist title="Evening" emoji="🌙" routines={[]} onToggle={vi.fn()} />);
    expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument();
  });

  it('taps an undone tile → onToggle(id, true)', async () => {
    const onToggle = vi.fn().mockResolvedValue(undefined);
    render(<RoutineChecklist title="Morning" emoji="🌅" routines={[R() as never]} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button', { name: /brush teeth/i }));
    expect(onToggle).toHaveBeenCalledWith('r1', true);
  });

  it('taps a done tile → onToggle(id, false), and marks it pressed', async () => {
    const onToggle = vi.fn().mockResolvedValue(undefined);
    render(
      <RoutineChecklist
        title="Morning"
        emoji="🌅"
        routines={[R({ doneToday: true }) as never]}
        onToggle={onToggle}
      />,
    );
    const btn = screen.getByRole('button', { name: /brush teeth/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith('r1', false);
  });

  it('swallows an error from onToggle', async () => {
    const onToggle = vi.fn().mockRejectedValue(new Error('nope'));
    render(<RoutineChecklist title="Morning" emoji="🌅" routines={[R() as never]} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button', { name: /brush teeth/i }));
    expect(onToggle).toHaveBeenCalled();
  });
});
