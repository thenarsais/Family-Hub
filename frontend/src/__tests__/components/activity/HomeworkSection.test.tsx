import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeworkSection from '@/components/activity/HomeworkSection';
import type { HomeworkItemWithStatus } from '@/hooks/useHomework';

function iso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

const base = {
  userId: 'kid-1',
  pointsValue: 10,
  completedAt: null,
  completed: false,
  isOverdue: false,
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
} satisfies Partial<HomeworkItemWithStatus>;

const overdueItem: HomeworkItemWithStatus = {
  ...base,
  id: 'a',
  title: 'Spelling list',
  subject: 'English',
  dueDate: iso(-2),
  isOverdue: true,
};
const todayItem: HomeworkItemWithStatus = {
  ...base,
  id: 'b',
  title: 'Math worksheet',
  subject: 'Math',
  dueDate: iso(0),
};
const weekItem: HomeworkItemWithStatus = {
  ...base,
  id: 'c',
  title: 'Book report',
  subject: 'English',
  dueDate: iso(3),
};
const doneItem: HomeworkItemWithStatus = {
  ...base,
  id: 'd',
  title: 'Science reading',
  dueDate: iso(0),
  completed: true,
  completedAt: new Date().toISOString(),
  pointsEarned: 10,
};

const fns = {
  onComplete: vi.fn().mockResolvedValue(undefined),
  onUncomplete: vi.fn().mockResolvedValue(undefined),
  onAdd: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => vi.clearAllMocks());

describe('HomeworkSection', () => {
  it('buckets items into Overdue / Due today / This week / Done today', () => {
    render(
      <HomeworkSection items={[overdueItem, todayItem, weekItem, doneItem]} {...fns} />,
    );
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Due today')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.getByText('Done today')).toBeInTheDocument();
    expect(screen.getByText('Spelling list')).toBeInTheDocument();
    expect(screen.getByText(/was due/i)).toBeInTheDocument();
  });

  it('tapping an open item completes it', async () => {
    render(<HomeworkSection items={[todayItem]} {...fns} />);
    await userEvent.click(screen.getByRole('button', { name: /math worksheet/i }));
    expect(fns.onComplete).toHaveBeenCalledWith('b');
  });

  it('Undo on a done item calls onUncomplete', async () => {
    render(<HomeworkSection items={[doneItem]} {...fns} />);
    await userEvent.click(screen.getByRole('button', { name: /undo/i }));
    expect(fns.onUncomplete).toHaveBeenCalledWith('d');
  });

  it('shows an empty state when there is nothing', () => {
    render(<HomeworkSection items={[]} {...fns} />);
    expect(screen.getByText(/no homework due in the next week/i)).toBeInTheDocument();
  });

  it('the add-homework form submits a new item', async () => {
    render(<HomeworkSection items={[]} {...fns} />);
    await userEvent.click(screen.getByRole('button', { name: /add homework/i }));
    await userEvent.type(screen.getByLabelText('Homework title'), 'Read chapter 4');
    await userEvent.type(screen.getByLabelText('Subject'), 'History');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(fns.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Read chapter 4', subject: 'History' }),
    );
  });
});
