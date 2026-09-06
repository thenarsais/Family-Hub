import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { MealDayEditor, MEAL_DRAG_TYPE } from '@/components/Calendar/MealDayEditor';
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

function renderEditor(over: Partial<Meal> = {}, extra: Partial<React.ComponentProps<typeof MealDayEditor>> = {}) {
  const onSetSlot = vi.fn();
  const onSaveToLibrary = vi.fn();
  render(
    <MealDayEditor
      meal={meal(over)}
      dateLabel="Mon 8/17"
      onSetSlot={onSetSlot}
      onSaveToLibrary={onSaveToLibrary}
      {...extra}
    />,
  );
  return { onSetSlot, onSaveToLibrary };
}

describe('MealDayEditor', () => {
  it('renders all four slots', () => {
    renderEditor({ dinner: 'Tacos' });
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Snack')).toBeInTheDocument();
    expect(screen.getByText('Tacos')).toBeInTheDocument();
  });

  it('shows an "Add…" affordance for an empty slot', () => {
    renderEditor();
    expect(screen.getByRole('button', { name: 'Add Breakfast for Mon 8/17' })).toBeInTheDocument();
  });

  it('edits a slot and saves on Enter', async () => {
    const user = userEvent.setup();
    const { onSetSlot } = renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add Dinner for Mon 8/17' }));
    await user.type(screen.getByRole('textbox', { name: 'Dinner for Mon 8/17' }), 'Pizza{Enter}');

    expect(onSetSlot).toHaveBeenCalledWith('2026-08-17', 'dinner', 'Pizza');
  });

  it('saves on blur', async () => {
    const user = userEvent.setup();
    const { onSetSlot } = renderEditor({ dinner: 'Tacos' });

    await user.click(screen.getByRole('button', { name: 'Edit Dinner for Mon 8/17' }));
    const input = screen.getByRole('textbox', { name: 'Dinner for Mon 8/17' });
    await user.clear(input);
    await user.type(input, 'Curry');
    await user.tab();

    expect(onSetSlot).toHaveBeenCalledWith('2026-08-17', 'dinner', 'Curry');
  });

  it('cancels on Escape without saving', async () => {
    const user = userEvent.setup();
    const { onSetSlot } = renderEditor({ dinner: 'Tacos' });

    await user.click(screen.getByRole('button', { name: 'Edit Dinner for Mon 8/17' }));
    await user.type(screen.getByRole('textbox', { name: 'Dinner for Mon 8/17' }), 'x{Escape}');

    expect(onSetSlot).not.toHaveBeenCalled();
    expect(screen.getByText('Tacos')).toBeInTheDocument();
  });

  it('does not save when text is unchanged', async () => {
    const user = userEvent.setup();
    const { onSetSlot } = renderEditor({ dinner: 'Tacos' });

    await user.click(screen.getByRole('button', { name: 'Edit Dinner for Mon 8/17' }));
    await user.tab();

    expect(onSetSlot).not.toHaveBeenCalled();
  });

  it('fills a slot when a meal name is dropped on it', () => {
    const { onSetSlot } = renderEditor();
    const cell = screen.getByRole('button', { name: 'Add Lunch for Mon 8/17' }).parentElement!;

    const data: Record<string, string> = { [MEAL_DRAG_TYPE]: 'Grilled cheese' };
    fireEvent.drop(cell, { dataTransfer: { getData: (t: string) => data[t] ?? '', dropEffect: '' } });

    expect(onSetSlot).toHaveBeenCalledWith('2026-08-17', 'lunch', 'Grilled cheese');
  });

  it('falls back to text/plain on drop', () => {
    const { onSetSlot } = renderEditor();
    const cell = screen.getByRole('button', { name: 'Add Snack for Mon 8/17' }).parentElement!;

    fireEvent.drop(cell, { dataTransfer: { getData: (t: string) => (t === 'text/plain' ? 'Apple' : ''), dropEffect: '' } });

    expect(onSetSlot).toHaveBeenCalledWith('2026-08-17', 'snack', 'Apple');
  });

  it('offers a save-to-library star only on filled slots', async () => {
    const user = userEvent.setup();
    const { onSaveToLibrary } = renderEditor({ dinner: 'Tacos' });

    expect(screen.queryByRole('button', { name: /Save ".*Breakfast/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save "Tacos" to the meal library' }));

    expect(onSaveToLibrary).toHaveBeenCalledWith('Tacos', 'dinner');
  });

  it('omits the star when onSaveToLibrary is not provided', () => {
    renderEditor({ dinner: 'Tacos' }, { onSaveToLibrary: undefined });
    expect(screen.queryByRole('button', { name: /to the meal library/ })).not.toBeInTheDocument();
  });
});
