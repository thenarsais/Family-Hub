import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryExplorer from '@/components/kids/CategoryExplorer';
import type { ExploreCategory } from '@/data/exploreCategories';

const CATEGORIES: ExploreCategory[] = [
  {
    id: 'colors',
    title: 'Colors',
    emoji: '🎨',
    items: [
      { emoji: '🔴', label: 'Red' },
      { emoji: '🔵', label: 'Blue' },
    ],
  },
  {
    id: 'shapes',
    title: 'Shapes',
    emoji: '🔷',
    items: [{ emoji: '⭐', label: 'Star' }],
  },
];

beforeEach(() => vi.clearAllMocks());

describe('CategoryExplorer', () => {
  it('shows the category tiles first', () => {
    render(<CategoryExplorer categories={CATEGORIES} />);
    expect(screen.getByRole('heading', { name: /look and learn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /colors/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shapes/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Red' })).not.toBeInTheDocument();
  });

  it('opens a category grid and returns with Back', async () => {
    render(<CategoryExplorer categories={CATEGORIES} />);
    await userEvent.click(screen.getByRole('button', { name: /colors/i }));

    expect(screen.getByRole('button', { name: 'Red' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Blue' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.queryByRole('button', { name: 'Red' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shapes/i })).toBeInTheDocument();
  });

  it('pops an item on tap, then clears the pop class shortly after', async () => {
    render(<CategoryExplorer categories={CATEGORIES} />);
    await userEvent.click(screen.getByRole('button', { name: /colors/i }));
    const red = screen.getByRole('button', { name: 'Red' });

    await userEvent.click(red);
    expect(red.className).toContain('animate-pop');

    await waitFor(() => expect(red.className).not.toContain('animate-pop'), { timeout: 1000 });
  });
});
