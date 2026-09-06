import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MealPlannerCard } from '@/components/shell/MealPlannerCard';
import type { Meal } from '@/hooks/useMealPlanner';

const { mockLib } = vi.hoisted(() => ({
  mockLib: {
    library: [] as { id: string; name: string; defaultSlot: string | null }[],
    loading: false,
    error: null,
    addToLibrary: vi.fn(),
    renameLibraryItem: vi.fn(),
    setLibraryItemSlot: vi.fn(),
    removeFromLibrary: vi.fn(),
    refresh: vi.fn(),
  },
}));
vi.mock('@/hooks/useMealLibrary', () => ({ useMealLibrary: () => mockLib }));

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
  beforeEach(() => {
    vi.clearAllMocks();
    mockLib.library = [];
  });

  it('renders the saved-meals strip', () => {
    mockLib.library = [{ id: 'a', name: 'Taco night', defaultSlot: 'dinner' }];
    renderCard([meal()]);

    expect(screen.getByText(/Saved meals/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Taco night' })).toBeInTheDocument();
    expect(screen.getByLabelText('Add a meal to the library')).toBeInTheDocument();
  });

  it('renders each day in the window with its four slots', () => {
    renderCard([
      meal({ date: '2026-08-17', dinner: 'Tacos' }),
      meal({ date: '2026-08-18' }),
    ]);

    expect(screen.getByText(/Mon 8\/17/)).toBeInTheDocument();
    expect(screen.getByText(/Tue 8\/18/)).toBeInTheDocument();
    expect(screen.getAllByText('Breakfast')).toHaveLength(2);
    expect(screen.getByText('Tacos')).toBeInTheDocument();
  });

  it('wires a slot edit through to onSetSlot', async () => {
    const { userEvent } = await import('@testing-library/user-event').then((m) => ({ userEvent: m.default }));
    const user = userEvent.setup();
    const { onSetSlot } = renderCard([meal()]);

    await user.click(screen.getByRole('button', { name: 'Add Dinner for Mon 8/17' }));
    await user.type(screen.getByRole('textbox', { name: 'Dinner for Mon 8/17' }), 'Pizza{Enter}');

    expect(onSetSlot).toHaveBeenCalledWith('2026-08-17', 'dinner', 'Pizza');
  });

  it('save-to-library star on a filled slot calls addToLibrary with the slot', async () => {
    const { userEvent } = await import('@testing-library/user-event').then((m) => ({ userEvent: m.default }));
    const user = userEvent.setup();
    renderCard([meal({ dinner: 'Tacos' })]);

    await user.click(screen.getByRole('button', { name: 'Save "Tacos" to the meal library' }));

    expect(mockLib.addToLibrary).toHaveBeenCalledWith('Tacos', 'dinner');
  });
});
