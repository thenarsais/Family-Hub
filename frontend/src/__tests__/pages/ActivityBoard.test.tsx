import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivityBoard from '@/pages/ActivityBoard';

const { mockUseAuth, mockUseFamily, mockUseChores } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseFamily: vi.fn(),
  mockUseChores: vi.fn(),
}));
vi.mock('@hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@hooks/useFamily', () => ({ useFamily: mockUseFamily }));
vi.mock('@hooks/useChores', async () => {
  const actual = await vi.importActual<typeof import('@hooks/useChores')>('@hooks/useChores');
  return { ...actual, useChores: mockUseChores };
});

const complete = vi.fn().mockResolvedValue(undefined);
const undo = vi.fn().mockResolvedValue(undefined);
const createChore = vi.fn().mockResolvedValue(undefined);
const updateChore = vi.fn().mockResolvedValue(undefined);
const loadFamilyChores = vi.fn().mockResolvedValue(undefined);

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

function withChores(over: Partial<ReturnType<typeof mockUseChores>> = {}) {
  mockUseChores.mockReturnValue({
    chores: [CHORE],
    familyChores: [CHORE],
    pointsSummary: { totalPoints: 0, dailyPoints: 30, weeklyPoints: 0, monthlyPoints: 250 },
    loading: false,
    error: null,
    complete,
    undo,
    createChore,
    updateChore,
    refresh: vi.fn(),
    loadFamilyChores,
    ...over,
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
  it('renders the chores section with the day-part group and points bars', () => {
    asRole('child');
    withChores();
    render(<ActivityBoard />);

    expect(screen.getByRole('heading', { name: /activity board/i })).toBeInTheDocument();
    expect(screen.getByText('Chores today')).toBeInTheDocument();
    expect(screen.getByText('Take out trash')).toBeInTheDocument();
    expect(screen.getByText(/Morning/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /today's points/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /this month/i })).toBeInTheDocument();
  });

  it('completes a chore on tap', async () => {
    asRole('child');
    withChores();
    render(<ActivityBoard />);

    await userEvent.click(screen.getByRole('button', { name: /take out trash/i }));
    expect(complete).toHaveBeenCalledWith('c1');
  });

  it('offers Undo on a completed chore', async () => {
    asRole('child');
    withChores({ chores: [{ ...CHORE, completedToday: true, completionId: 'x1' }] });
    render(<ActivityBoard />);

    await userEvent.click(screen.getByRole('button', { name: /undo/i }));
    expect(undo).toHaveBeenCalledWith('c1');
  });

  it('hides Manage from a child and shows it to a parent', async () => {
    asRole('child');
    withChores();
    const { rerender } = render(<ActivityBoard />);
    expect(screen.queryByRole('button', { name: /manage/i })).not.toBeInTheDocument();

    asRole('parent');
    withChores();
    rerender(<ActivityBoard />);
    const manage = screen.getByRole('button', { name: /manage/i });
    await userEvent.click(manage);
    await waitFor(() => expect(loadFamilyChores).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /add chore/i })).toBeInTheDocument();
  });

  it('collapses the section when the header is clicked', async () => {
    asRole('child');
    withChores();
    render(<ActivityBoard />);

    await userEvent.click(screen.getByRole('button', { name: /chores today/i }));
    expect(screen.queryByText('Take out trash')).not.toBeInTheDocument();
  });
});
