import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivityBoard from '@/pages/ActivityBoard';

const { mockUseAuth, mockUseFamily, mockUseChores, mockUseHabits } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseFamily: vi.fn(),
  mockUseChores: vi.fn(),
  mockUseHabits: vi.fn(),
}));
vi.mock('@hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@hooks/useFamily', () => ({ useFamily: mockUseFamily }));
vi.mock('@hooks/useChores', async () => {
  const actual = await vi.importActual<typeof import('@hooks/useChores')>('@hooks/useChores');
  return { ...actual, useChores: mockUseChores };
});
vi.mock('@hooks/useHabits', async () => {
  const actual = await vi.importActual<typeof import('@hooks/useHabits')>('@hooks/useHabits');
  return { ...actual, useHabits: mockUseHabits };
});
// The Gujarati section pulls in useLearning + a <Link>; keep it in its loading
// state here so this suite stays about the board shell (LearningSummarySection
// has its own test).
vi.mock('@hooks/useLearning', () => ({ useLearning: () => ({ loading: true, stats: {} }) }));
vi.mock('@hooks/useTrivia', () => ({
  useTrivia: () => ({ loading: true, question: null, attempt: null, streak: 0, stats: { answered: 0, correct: 0 } }),
}));

const choreFns = {
  complete: vi.fn().mockResolvedValue(undefined),
  undo: vi.fn().mockResolvedValue(undefined),
  createChore: vi.fn().mockResolvedValue(undefined),
  updateChore: vi.fn().mockResolvedValue(undefined),
  loadFamilyChores: vi.fn().mockResolvedValue(undefined),
  refresh: vi.fn(),
};
const habitFns = {
  complete: vi.fn().mockResolvedValue(undefined),
  undo: vi.fn().mockResolvedValue(undefined),
  createHabit: vi.fn().mockResolvedValue(undefined),
  updateHabit: vi.fn().mockResolvedValue(undefined),
  setMood: vi.fn().mockResolvedValue(undefined),
  loadFamilyHabits: vi.fn().mockResolvedValue(undefined),
  refresh: vi.fn(),
};

const CHORE = {
  id: 'c1',
  userId: 'u1',
  name: 'Take out trash',
  description: '',
  timeSlot: 'morning' as const,
  pointsValue: 10,
  enabled: true,
  createdAt: '',
  updatedAt: '',
  completedToday: false,
  assigneeName: 'Krish',
};
const HABIT = {
  id: 'h1',
  userId: 'u1',
  title: 'Meditate',
  weeklyTarget: 5,
  pointsValue: 10,
  enabled: true,
  createdAt: '',
  updatedAt: '',
  weekCompletions: 2,
  completedToday: false,
  weekStreak: 1,
};

function withHooks(
  over: { chores?: unknown[]; habits?: unknown[]; todayMood?: unknown } = {},
) {
  mockUseChores.mockReturnValue({
    chores: (over.chores ?? [CHORE]) as never,
    familyChores: [CHORE] as never,
    pointsSummary: { totalPoints: 0, dailyPoints: 30, weeklyPoints: 0, monthlyPoints: 250 },
    loading: false,
    error: null,
    ...choreFns,
  });
  mockUseHabits.mockReturnValue({
    habits: (over.habits ?? [HABIT]) as never,
    familyHabits: [HABIT] as never,
    todayMood: (over.todayMood ?? null) as never,
    loading: false,
    error: null,
    ...habitFns,
  });
}

function asRole(role: string) {
  mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
  mockUseFamily.mockReturnValue({
    family: { id: 'f1', name: 'Narsai' },
    members: [
      { user_id: 'u1', role, name: 'Parent' },
      { user_id: 'u2', role: 'child', name: 'Krish' },
    ],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

describe('ActivityBoard', () => {
  it('renders the chores, habits and mood sections', () => {
    asRole('child');
    withHooks();
    render(<ActivityBoard />);

    expect(screen.getByRole('heading', { name: /activity board/i })).toBeInTheDocument();
    expect(screen.getByText('Chores today')).toBeInTheDocument();
    expect(screen.getByText('Habits this week')).toBeInTheDocument();
    expect(screen.getByText('Mood')).toBeInTheDocument();
    expect(screen.getByText('Take out trash')).toBeInTheDocument();
    expect(screen.getByText('Meditate')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /today's points/i })).toBeInTheDocument();
  });

  it('completes a chore and a habit on tap', async () => {
    asRole('child');
    withHooks();
    render(<ActivityBoard />);

    await userEvent.click(screen.getByRole('button', { name: /take out trash/i }));
    expect(choreFns.complete).toHaveBeenCalledWith('c1');

    await userEvent.click(screen.getByRole('button', { name: /mark meditate done/i }));
    expect(habitFns.complete).toHaveBeenCalledWith('h1');
  });

  it('records a mood', async () => {
    asRole('child');
    withHooks();
    render(<ActivityBoard />);

    await userEvent.click(screen.getByRole('button', { name: 'Good' }));
    expect(habitFns.setMood).toHaveBeenCalledWith('good');
  });

  it('shows Manage on chores and habits for a parent, not for a child', async () => {
    asRole('child');
    withHooks();
    const { rerender } = render(<ActivityBoard />);
    expect(screen.queryByRole('button', { name: /manage/i })).not.toBeInTheDocument();

    asRole('parent');
    withHooks();
    rerender(<ActivityBoard />);
    const manageButtons = screen.getAllByRole('button', { name: /manage/i });
    expect(manageButtons).toHaveLength(2);

    await userEvent.click(manageButtons[1]); // habits
    await waitFor(() => expect(habitFns.loadFamilyHabits).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /add habit/i })).toBeInTheDocument();
  });

  it('collapses a section when its header is clicked', async () => {
    asRole('child');
    withHooks();
    render(<ActivityBoard />);

    await userEvent.click(screen.getByRole('button', { name: /collapse habits this week/i }));
    expect(screen.queryByText('Meditate')).not.toBeInTheDocument();
    expect(screen.getByText('Take out trash')).toBeInTheDocument();
  });
});
