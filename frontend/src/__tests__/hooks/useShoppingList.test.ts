import { renderHook, waitFor, act } from '@testing-library/react';
import { useShoppingList } from '@/hooks/useShoppingList';

describe('useShoppingList', () => {
  it('should load a mock shopping list', async () => {
    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toHaveLength(5);
    expect(result.current.error).toBeNull();
  });

  describe('addItem', () => {
    it('should append a new item added by "User"', async () => {
      const { result } = renderHook(() => useShoppingList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addItem('Eggs', 12, 'count', 'Dairy');
      });

      const newItem = result.current.items[result.current.items.length - 1];
      expect(newItem).toMatchObject({
        name: 'Eggs',
        quantity: 12,
        unit: 'count',
        category: 'Dairy',
        completed: false,
        addedBy: 'User',
      });
      expect(result.current.items).toHaveLength(6);
    });
  });

  describe('toggleItem', () => {
    it('should flip completed for the matching item', async () => {
      const { result } = renderHook(() => useShoppingList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggleItem('1');
      });

      expect(result.current.items.find((i) => i.id === '1')?.completed).toBe(true);
    });

    it('should leave other items unaffected', async () => {
      const { result } = renderHook(() => useShoppingList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggleItem('1');
      });

      expect(result.current.items.find((i) => i.id === '2')?.completed).toBe(false);
    });
  });

  describe('removeItem', () => {
    it('should remove the matching item', async () => {
      const { result } = renderHook(() => useShoppingList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.removeItem('1');
      });

      expect(result.current.items.find((i) => i.id === '1')).toBeUndefined();
      expect(result.current.items).toHaveLength(4);
    });
  });
});
