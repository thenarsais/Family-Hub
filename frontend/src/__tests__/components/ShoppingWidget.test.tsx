import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShoppingWidget } from '@/components/shell/ShoppingWidget';
import type { ShoppingItem } from '@/hooks/useShoppingList';

const item = (over: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: 'i1',
  name: 'Milk',
  checked: false,
  addedById: null,
  createdAt: null,
  ...over,
});

function renderWidget(props: Partial<React.ComponentProps<typeof ShoppingWidget>> = {}) {
  const handlers = {
    onAdd: vi.fn(),
    onToggle: vi.fn(),
    onRemove: vi.fn(),
    onClearChecked: vi.fn(),
  };
  render(<ShoppingWidget items={[]} {...handlers} {...props} />);
  return handlers;
}

describe('ShoppingWidget', () => {
  it('shows the pending/total summary', () => {
    renderWidget({ items: [item({ id: 'a' }), item({ id: 'b', checked: true })] });
    expect(screen.getByText('1 of 2 items still needed')).toBeInTheDocument();
  });

  it('adds a quick-add item on tap', async () => {
    const user = userEvent.setup();
    const { onAdd } = renderWidget();

    await user.click(screen.getByRole('button', { name: '+ Milk' }));

    expect(onAdd).toHaveBeenCalledWith('Milk');
  });

  it('hides a quick-add chip once that item is on the list', () => {
    renderWidget({ items: [item({ name: 'Milk' })] });
    expect(screen.queryByRole('button', { name: '+ Milk' })).not.toBeInTheDocument();
  });

  it('adds a free-text item and clears the field', async () => {
    const user = userEvent.setup();
    const { onAdd } = renderWidget();

    const field = screen.getByLabelText('Add a shopping item');
    await user.type(field, '  Spinach  ');
    await user.click(screen.getByRole('button', { name: 'Add item' }));

    expect(onAdd).toHaveBeenCalledWith('Spinach');
    expect(field).toHaveValue('');
  });

  it('toggles an item via its checkbox', async () => {
    const user = userEvent.setup();
    const { onToggle } = renderWidget({ items: [item({ id: 'x', name: 'Bread' })] });

    await user.click(screen.getByRole('checkbox', { name: 'Bread' }));

    expect(onToggle).toHaveBeenCalledWith('x');
  });

  it('removes an item via its remove button', async () => {
    const user = userEvent.setup();
    const { onRemove } = renderWidget({ items: [item({ id: 'x', name: 'Bread' })] });

    await user.click(screen.getByRole('button', { name: 'Remove Bread' }));

    expect(onRemove).toHaveBeenCalledWith('x');
  });

  it('hides "Clear checked" when nothing is checked', () => {
    renderWidget({ items: [item({ id: 'a' })] });
    expect(screen.queryByRole('button', { name: /clear .* checked/i })).not.toBeInTheDocument();
  });

  it('calls onClearChecked from the clear button', async () => {
    const user = userEvent.setup();
    const { onClearChecked } = renderWidget({
      items: [item({ id: 'a', checked: true }), item({ id: 'b', checked: true })],
    });

    await user.click(screen.getByRole('button', { name: 'Clear 2 checked' }));

    expect(onClearChecked).toHaveBeenCalled();
  });

  it('renders checked items after pending ones', () => {
    renderWidget({
      items: [item({ id: 'a', name: 'Apples', checked: true }), item({ id: 'b', name: 'Bread' })],
    });
    const labels = screen.getAllByRole('checkbox').map((c) => c.getAttribute('aria-label'));
    expect(labels).toEqual(['Bread', 'Apples']);
  });
});
