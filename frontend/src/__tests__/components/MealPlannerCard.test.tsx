import { vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealPlannerCard } from '@/components/shell/MealPlannerCard';
import type { Meal } from '@/hooks/useMealPlanner';

const meal = (over: Partial<Meal> = {}): Meal => ({
  date: '2026-08-17',
  day: 'Monday',
  breakfast: '',
  lunch: '',
  dinner: '',
  snack: '',
  ...over,
});

function renderCard(meals: Meal[]) {
  const onSetSlot = vi.fn();
  render(<MealPlannerCard meals={meals} onSetSlot={onSetSlot} />);
  return { onSetSlot };
}

describe('MealPlannerCard', () => {
  it('renders a day heading and all four slots per day', () => {
    renderCard([meal({ dinner: 'Tacos' })]);

    expect(screen.getByText(/Mon 8\/17/)).toBeInTheDocument();
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Snack')).toBeInTheDocument();
    expect(screen.getByText('Tacos')).toBeInTheDocument();
  });

  it('shows an "Add…" affordance for an empty slot', () => {
    renderCard([meal()]);
    expect(
      screen.getByRole('button', { name: 'Add Breakfast for Mon 8/17' }),
    ).toBeInTheDocument();
  });

  it('edits a slot and saves on Enter', async () => {
    const user = userEvent.setup();
    const { onSetSlot } = renderCard([meal()]);

    await user.click(screen.getByRole('button', { name: 'Add Dinner for Mon 8/17' }));
    const input = screen.getByRole('textbox', { name: 'Dinner for Mon 8/17' });
    await user.type(input, 'Pizza{Enter}');

    expect(onSetSlot).toHaveBeenCalledWith('2026-08-17', 'dinner', 'Pizza');
  });

  it('saves on blur', async () => {
    const user = userEvent.setup();
    const { onSetSlot } = renderCard([meal({ dinner: 'Tacos' })]);

    await user.click(screen.getByRole('button', { name: 'Edit Dinner for Mon 8/17' }));
    const input = screen.getByRole('textbox', { name: 'Dinner for Mon 8/17' });
    await user.clear(input);
    await user.type(input, 'Curry');
    await user.tab();

    expect(onSetSlot).toHaveBeenCalledWith('2026-08-17', 'dinner', 'Curry');
  });

  it('cancels on Escape without saving', async () => {
    const user = userEvent.setup();
    const { onSetSlot } = renderCard([meal({ dinner: 'Tacos' })]);

    await user.click(screen.getByRole('button', { name: 'Edit Dinner for Mon 8/17' }));
    const input = screen.getByRole('textbox', { name: 'Dinner for Mon 8/17' });
    await user.clear(input);
    await user.type(input, 'Nope{Escape}');

    expect(onSetSlot).not.toHaveBeenCalled();
    expect(screen.getByText('Tacos')).toBeInTheDocument();
  });

  it('does not save when the text is unchanged', async () => {
    const user = userEvent.setup();
    const { onSetSlot } = renderCard([meal({ dinner: 'Tacos' })]);

    await user.click(screen.getByRole('button', { name: 'Edit Dinner for Mon 8/17' }));
    await user.tab();

    expect(onSetSlot).not.toHaveBeenCalled();
  });

  it('renders every day in the window', () => {
    renderCard([
      meal({ date: '2026-08-17', day: 'Monday' }),
      meal({ date: '2026-08-18', day: 'Tuesday' }),
      meal({ date: '2026-08-19', day: 'Wednesday' }),
    ]);
    expect(screen.getByText(/Mon 8\/17/)).toBeInTheDocument();
    expect(screen.getByText(/Tue 8\/18/)).toBeInTheDocument();
    expect(screen.getByText(/Wed 8\/19/)).toBeInTheDocument();
  });
});
