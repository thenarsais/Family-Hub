import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HabitsSection from '@/components/activity/HabitsSection';

const HABIT = {
  id: 'h1',
  userId: 'u1',
  title: 'Meditate',
  description: '10 minutes',
  weeklyTarget: 5,
  pointsValue: 10,
  enabled: true,
  createdAt: '',
  updatedAt: '',
  weekCompletions: 2,
  completedToday: false,
  weekStreak: 3,
};

beforeEach(() => vi.clearAllMocks());

describe('HabitsSection', () => {
  it('renders the empty state', () => {
    render(<HabitsSection habits={[]} onComplete={vi.fn()} onUndo={vi.fn()} />);
    expect(screen.getByText(/no habits yet/i)).toBeInTheDocument();
  });

  it('renders title, description, week count, streak flame and a progressbar', () => {
    render(<HabitsSection habits={[HABIT as never]} onComplete={vi.fn()} onUndo={vi.fn()} />);
    expect(screen.getByText('Meditate')).toBeInTheDocument();
    expect(screen.getByText('10 minutes')).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // streak count
    expect(screen.getByRole('progressbar', { name: /meditate this week/i })).toBeInTheDocument();
  });

  it('taps to complete an incomplete habit', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(<HabitsSection habits={[HABIT as never]} onComplete={onComplete} onUndo={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /mark meditate done/i }));
    expect(onComplete).toHaveBeenCalledWith('h1');
  });

  it('offers Undo on a completed habit (checkbox and pill)', async () => {
    const onUndo = vi.fn().mockResolvedValue(undefined);
    render(
      <HabitsSection
        habits={[{ ...HABIT, completedToday: true, weekCompletions: 3 } as never]}
        onComplete={vi.fn()}
        onUndo={onUndo}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^undo$/i }));
    expect(onUndo).toHaveBeenCalledWith('h1');
  });

  it('swallows an error thrown by the action', async () => {
    const onComplete = vi.fn().mockRejectedValue(new Error('nope'));
    render(<HabitsSection habits={[HABIT as never]} onComplete={onComplete} onUndo={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /mark meditate done/i }));
    expect(onComplete).toHaveBeenCalled();
  });

  it('hides the streak flame when the streak is 0', () => {
    render(
      <HabitsSection
        habits={[{ ...HABIT, weekStreak: 0 } as never]}
        onComplete={vi.fn()}
        onUndo={vi.fn()}
      />,
    );
    expect(screen.queryByTitle(/week streak/i)).not.toBeInTheDocument();
  });
});
