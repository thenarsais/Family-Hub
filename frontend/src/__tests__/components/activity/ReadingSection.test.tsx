import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingSection from '@/components/activity/ReadingSection';

const GOALS = { dailyMinutes: 20, weeklyMinutes: 100, pointsValue: 10 };

const fns = {
  onSubmit: vi.fn().mockResolvedValue(undefined),
  onUndo: vi.fn().mockResolvedValue(undefined),
};

function setup(over: Record<string, unknown> = {}) {
  return render(
    <ReadingSection
      goals={GOALS}
      log={null}
      weekMinutes={0}
      streak={0}
      loading={false}
      error={null}
      {...fns}
      {...over}
    />,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('ReadingSection', () => {
  it('pre-fills the minutes input with the daily goal and submits it', async () => {
    setup();
    const input = screen.getByLabelText('Minutes read today') as HTMLInputElement;
    expect(input.value).toBe('20');
    await userEvent.click(screen.getByRole('button', { name: /log reading/i }));
    expect(fns.onSubmit).toHaveBeenCalledWith(20);
  });

  it('lets the kid change the minutes before submitting', async () => {
    setup();
    const input = screen.getByLabelText('Minutes read today');
    await userEvent.clear(input);
    await userEvent.type(input, '35');
    await userEvent.click(screen.getByRole('button', { name: /log reading/i }));
    expect(fns.onSubmit).toHaveBeenCalledWith(35);
  });

  it('shows a celebration + points when the goal was met', () => {
    setup({ log: { minutes: 25, goalMet: true, pointsEarned: 10 }, streak: 2 });
    expect(screen.getByText(/25 min logged today/i)).toBeInTheDocument();
    expect(screen.getByText(/goal met! \+10 points/i)).toBeInTheDocument();
    expect(screen.getByText(/2-day streak/i)).toBeInTheDocument();
  });

  it('shows the encouragement copy when the goal was missed', () => {
    setup({ log: { minutes: 5, goalMet: false, pointsEarned: 0 } });
    expect(screen.getByText(/under today's 20-min goal/i)).toBeInTheDocument();
  });

  it('Undo calls onUndo', async () => {
    setup({ log: { minutes: 25, goalMet: true, pointsEarned: 10 } });
    await userEvent.click(screen.getByRole('button', { name: /undo/i }));
    expect(fns.onUndo).toHaveBeenCalled();
  });

  it('shows the weekly progress line', () => {
    setup({ weekMinutes: 55 });
    expect(screen.getByText('55 / 100 min')).toBeInTheDocument();
  });

  it('renders loading and error states', () => {
    const { rerender } = setup({ loading: true });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    rerender(
      <ReadingSection
        goals={GOALS}
        log={null}
        weekMinutes={0}
        streak={0}
        loading={false}
        error="boom"
        {...fns}
      />,
    );
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
