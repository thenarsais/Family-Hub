import { useState, useEffect } from 'react';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  completed: boolean;
  addedBy: string;
}

interface UseShoppingListReturn {
  items: ShoppingItem[];
  loading: boolean;
  error: string | null;
  addItem: (name: string, quantity: number, unit: string, category: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

export function useShoppingList(): UseShoppingListReturn {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);

        // Mock shopping list for testing
        const mockItems: ShoppingItem[] = [
          {
            id: '1',
            name: 'Milk',
            quantity: 2,
            unit: 'gallons',
            category: 'Dairy',
            completed: false,
            addedBy: 'Mom'
          },
          {
            id: '2',
            name: 'Bread',
            quantity: 1,
            unit: 'loaf',
            category: 'Bakery',
            completed: false,
            addedBy: 'Dad'
          },
          {
            id: '3',
            name: 'Apples',
            quantity: 3,
            unit: 'lbs',
            category: 'Produce',
            completed: false,
            addedBy: 'Mom'
          },
          {
            id: '4',
            name: 'Chicken Breast',
            quantity: 2,
            unit: 'lbs',
            category: 'Meat',
            completed: true,
            addedBy: 'Mom'
          },
          {
            id: '5',
            name: 'Rice',
            quantity: 1,
            unit: 'bag',
            category: 'Grains',
            completed: false,
            addedBy: 'Dad'
          }
        ];

        setItems(mockItems);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to fetch shopping list:', err);
        setError(err.message || 'Failed to fetch shopping list');
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const addItem = async (name: string, quantity: number, unit: string, category: string) => {
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name,
      quantity,
      unit,
      category,
      completed: false,
      addedBy: 'User'
    };
    setItems([...items, newItem]);
  };

  const toggleItem = async (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const removeItem = async (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return {
    items,
    loading,
    error,
    addItem,
    toggleItem,
    removeItem
  };
}
