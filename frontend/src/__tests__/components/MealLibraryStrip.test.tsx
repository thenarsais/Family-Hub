import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealLibraryStrip } from '@/components/Calendar/MealLibraryStrip';
import { MEAL_DRAG_TYPE } from '@/components/Calendar/MealDayEditor';
import type { LibraryMeal } from '@/hooks/useMealLibrary';

const lib: LibraryMeal[] = [
  { id: 'a', name: 'Taco night', defaultSlot: 'dinner' },
  { id: 'b', name: 'Oatmeal', defaultSlot: 'breakfast' },
];

function renderStrip(library = lib) {
  const onAdd = vi.fn();
  const onRename = vi.fn();
  const onRemove = vi.fn();
  render(
    <MealLibraryStrip library={library} onAdd={onAdd} onRename={onRename} onRemove={onRemove} />,
  );
  return { onAdd, onRename, onRemove };
}

describe('MealLibraryStrip', () => {
  it('renders a chip per saved meal', () => {
    renderStrip();
    expect(screen.getByRole('button', { name: 'Taco night' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Oatmeal' })).toBeInTheDocument();
  });

  it('adds a meal from the input on submit', async () => {
    const user = userEvent.setup();
    const { onAdd } = renderStrip();

    const input = screen.getByLabelText('Add a meal to the library');
    await user.type(input, 'Pasta{Enter}');

    expect(onAdd).toHaveBeenCalledWith('Pasta');
    expect(input).toHaveValue('');
  });

  it('sets the drag payload on dragstart', () => {
    renderStrip();
    const chip = screen.getByRole('button', { name: 'Taco night' }).closest('[draggable]')!;
    const setData = vi.fn();
    fireEvent.dragStart(chip, { dataTransfer: { setData, effectAllowed: '' } });

    expect(setData).toHaveBeenCalledWith(MEAL_DRAG_TYPE, 'Taco night');
    expect(setData).toHaveBeenCalledWith('text/plain', 'Taco night');
  });

  it('removes a meal', async () => {
    const user = userEvent.setup();
    const { onRemove } = renderStrip();

    await user.click(screen.getByRole('button', { name: 'Remove Taco night from the library' }));

    expect(onRemove).toHaveBeenCalledWith('a');
  });

  it('renames a meal inline', async () => {
    const user = userEvent.setup();
    const { onRename } = renderStrip();

    await user.click(screen.getByRole('button', { name: 'Taco night' }));
    const input = screen.getByRole('textbox', { name: 'Rename Taco night' });
    await user.clear(input);
    await user.type(input, 'Taco Tuesday{Enter}');

    expect(onRename).toHaveBeenCalledWith('a', 'Taco Tuesday');
  });

  it('does not rename when the name is unchanged', async () => {
    const user = userEvent.setup();
    const { onRename } = renderStrip();

    await user.click(screen.getByRole('button', { name: 'Oatmeal' }));
    await user.keyboard('{Enter}');

    expect(onRename).not.toHaveBeenCalled();
  });
});
