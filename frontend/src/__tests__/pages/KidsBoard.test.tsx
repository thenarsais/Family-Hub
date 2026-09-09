import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import KidsBoard from '@/pages/KidsBoard';

const { mockUseAuth, mockUseFamily, mockUseKidBoard, mockUseParams } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseFamily: vi.fn(),
  mockUseKidBoard: vi.fn(),
  mockUseParams: vi.fn(),
}));
vi.mock('@hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@hooks/useFamily', () => ({ useFamily: mockUseFamily }));
vi.mock('@hooks/useKidBoard', () => ({ useKidBoard: mockUseKidBoard }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useParams: mockUseParams };
});

const R = (over = {}) => ({
  id: 'r1',
  userId: 'kid-1',
  slot: 'morning',
  label: 'Brush teeth',
  emoji: '🪥',
  sortOrder: 0,
  enabled: true,
  doneToday: false,
  ...over,
});

const boardFns = {
  completeRoutine: vi.fn().mockResolvedValue(undefined),
  undoRoutine: vi.fn().mockResolvedValue(undefined),
  setMood: vi.fn().mockResolvedValue(undefined),
  createRoutine: vi.fn().mockResolvedValue(undefined),
  updateRoutine: vi.fn().mockResolvedValue(undefined),
  refresh: vi.fn(),
  refreshManage: vi.fn().mockResolvedValue(undefined),
};

function withBoard(
  over: {
    routines?: unknown[];
    manageRoutines?: unknown[];
    todayMood?: unknown;
    loading?: boolean;
    error?: string | null;
  } = {},
) {
  const routines =
    over.routines ?? [R(), R({ id: 'r2', slot: 'evening', label: 'Pajamas', emoji: '👕' })];
  mockUseKidBoard.mockReturnValue({
    routines: routines as never,
    manageRoutines: (over.manageRoutines ?? routines) as never,
    todayMood: (over.todayMood ?? null) as never,
    loading: over.loading ?? false,
    error: over.error ?? null,
    ...boardFns,
  });
}

function asFamily(callerRole = 'parent') {
  mockUseParams.mockReturnValue({ memberId: 'kid-1' });
  mockUseAuth.mockReturnValue({ user: { id: 'parent-1' } });
  mockUseFamily.mockReturnValue({
    loading: false,
    members: [
      { user_id: 'parent-1', role: callerRole, name: 'Priya Parent' },
      { user_id: 'kid-1', role: 'child', name: 'Karishma Kid' },
    ],
  });
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/kids/kid-1']}>
      <KidsBoard />
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe('KidsBoard', () => {
  it('renders the four blocks for a parent', () => {
    asFamily('parent');
    withBoard();
    renderPage();

    expect(screen.getByRole('heading', { name: /karishma kid's day/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /morning/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /evening/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /how do you feel/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /look and learn/i })).toBeInTheDocument();
  });

  it('taps a morning routine → completeRoutine', async () => {
    asFamily('parent');
    withBoard();
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /brush teeth/i }));
    expect(boardFns.completeRoutine).toHaveBeenCalledWith('r1');
  });

  it('taps a done routine → undoRoutine', async () => {
    asFamily('parent');
    withBoard({ routines: [R({ doneToday: true })] });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /brush teeth/i }));
    expect(boardFns.undoRoutine).toHaveBeenCalledWith('r1');
  });

  it('taps a mood face → setMood', async () => {
    asFamily('parent');
    withBoard();
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Good' }));
    expect(boardFns.setMood).toHaveBeenCalledWith('good');
  });

  it('opens a category grid when a tile is tapped', async () => {
    asFamily('parent');
    withBoard();
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /colors/i }));
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('toggles the Manage panel', async () => {
    asFamily('parent');
    withBoard();
    renderPage();
    expect(screen.queryByRole('button', { name: /add step/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /manage/i }));
    expect(screen.getByRole('button', { name: /add step/i })).toBeInTheDocument();
    expect(boardFns.refreshManage).toHaveBeenCalled();
  });

  it('feeds the Manage panel the full (incl. hidden) routine list', async () => {
    asFamily('parent');
    withBoard({
      routines: [R()],
      manageRoutines: [R(), R({ id: 'r9', label: 'Old step', enabled: false })],
    });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /manage/i }));
    expect(screen.getByText(/old step/i)).toBeInTheDocument();
  });

  it('shows a spinner while the family is loading', () => {
    mockUseParams.mockReturnValue({ memberId: 'kid-1' });
    mockUseAuth.mockReturnValue({ user: { id: 'parent-1' } });
    mockUseFamily.mockReturnValue({ loading: true, members: [] });
    withBoard();
    renderPage();
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('shows the grown-up fallback for a non-parent caller', () => {
    asFamily('child');
    withBoard();
    renderPage();
    expect(screen.getByText(/grown-up view/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to the dashboard/i })).toBeInTheDocument();
  });

  it('shows the fallback when the member is not in the family', () => {
    mockUseParams.mockReturnValue({ memberId: 'ghost' });
    mockUseAuth.mockReturnValue({ user: { id: 'parent-1' } });
    mockUseFamily.mockReturnValue({
      loading: false,
      members: [{ user_id: 'parent-1', role: 'parent', name: 'Priya' }],
    });
    withBoard();
    renderPage();
    expect(screen.getByText(/grown-up view/i)).toBeInTheDocument();
  });

  it('surfaces a board error', () => {
    asFamily('parent');
    withBoard({ error: 'boom' });
    renderPage();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  it('shows a spinner while the board is loading', () => {
    asFamily('parent');
    withBoard({ loading: true });
    renderPage();
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });
});
