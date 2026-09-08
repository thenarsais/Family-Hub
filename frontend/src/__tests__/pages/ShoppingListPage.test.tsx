import { vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShoppingListPage from '@/pages/ShoppingListPage';

const { hook, useFamily } = vi.hoisted(() => ({
  hook: {
    items: [] as Array<{ id: string; name: string; checked: boolean; addedById: string | null; createdAt: string | null }>,
    loading: false,
    error: null as string | null,
    addItem: vi.fn(),
    toggleItem: vi.fn(),
    removeItem: vi.fn(),
    clearChecked: vi.fn(),
    refresh: vi.fn(),
  },
  useFamily: vi.fn(),
}));

vi.mock('@hooks/useShoppingList', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useShoppingList')>(
    '@/hooks/useShoppingList',
  );
  return { ...actual, useShoppingList: () => hook };
});
vi.mock('@hooks/useFamily', () => ({ useFamily }));

describe('ShoppingListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFamily.mockReturnValue({
      members: [
        { user_id: 'u1', name: 'Priya', role: 'parent' },
        { user_id: 'u2', name: 'Sam', role: 'child' },
      ],
    });
    hook.items = [
      { id: 'a', name: 'Milk', checked: false, addedById: 'u1', createdAt: '2026-01-01' },
      { id: 'b', name: 'Old bread', checked: true, addedById: 'u2', createdAt: '2026-01-02' },
    ];
    hook.loading = false;
    hook.error = null;
    hook.addItem.mockResolvedValue(undefined);
    hook.toggleItem.mockResolvedValue(undefined);
    hook.removeItem.mockResolvedValue(undefined);
    hook.clearChecked.mockResolvedValue(undefined);
  });

  it('renders the list with counts and who-added tags', () => {
    render(<ShoppingListPage />);
    expect(screen.getByText(/1 of 2 still needed/)).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Old bread')).toBeInTheDocument();
    expect(screen.getByText('Priya')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
  });

  it('shows a loading spinner', () => {
    hook.loading = true;
    const { container } = render(<ShoppingListPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows an error banner but keeps the list visible', () => {
    hook.error = 'boom';
    render(<ShoppingListPage />);
    expect(screen.getByText(/Couldn't load the list: boom/)).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
  });

  it('empty state when there is nothing', () => {
    hook.items = [];
    render(<ShoppingListPage />);
    expect(screen.getByText('Nothing on the list.')).toBeInTheDocument();
  });

  it('adds via the free-text form', async () => {
    render(<ShoppingListPage />);
    await userEvent.type(screen.getByLabelText('Add a shopping item'), 'Apples');
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }));
    expect(hook.addItem).toHaveBeenCalledWith('Apples');
  });

  it('adds via a quick-add chip and hides chips for items already on the list', async () => {
    render(<ShoppingListPage />);
    // "Milk" is already on the list → no chip for it
    expect(screen.queryByRole('button', { name: '+ Milk' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '+ Eggs' }));
    expect(hook.addItem).toHaveBeenCalledWith('Eggs');
  });

  it('toggles and removes an item', async () => {
    render(<ShoppingListPage />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Milk' }));
    expect(hook.toggleItem).toHaveBeenCalledWith('a');

    await userEvent.click(screen.getByRole('button', { name: 'Remove Milk' }));
    expect(hook.removeItem).toHaveBeenCalledWith('a');
  });

  it('clears checked items', async () => {
    render(<ShoppingListPage />);
    await userEvent.click(screen.getByRole('button', { name: /Clear 1 checked/ }));
    expect(hook.clearChecked).toHaveBeenCalled();
  });

  it('orders pending before checked', () => {
    render(<ShoppingListPage />);
    const names = screen.getAllByRole('listitem').map((li) => within(li).getByText(/Milk|Old bread/).textContent);
    expect(names).toEqual(['Milk', 'Old bread']);
  });
});
