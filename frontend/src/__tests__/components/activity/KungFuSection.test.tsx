import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KungFuSection from '@/components/activity/KungFuSection';

const PROFILE = { belt: null, beltSince: null, pointsPerClass: 15, pointsPerPractice: 5 };

const fns = {
  onLogClass: vi.fn().mockResolvedValue(undefined),
  onLogPractice: vi.fn().mockResolvedValue(undefined),
  onUndo: vi.fn().mockResolvedValue(undefined),
};

function setup(over: Record<string, unknown> = {}) {
  return render(
    <KungFuSection
      profile={PROFILE}
      todayLogs={[]}
      weekCounts={{ class: 0, practice: 0 }}
      loading={false}
      error={null}
      {...fns}
      {...over}
    />,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('KungFuSection', () => {
  it('shows "no belt set" when unset', () => {
    setup();
    expect(screen.getByText(/no belt set yet/i)).toBeInTheDocument();
  });

  it('shows the belt + since date when set', () => {
    setup({ profile: { ...PROFILE, belt: 'Yellow Sash', beltSince: '2026-06-01' } });
    expect(screen.getByText(/yellow sash/i)).toBeInTheDocument();
    expect(screen.getByText(/since jun 2026/i)).toBeInTheDocument();
  });

  it('shows the weekly counts', () => {
    setup({ weekCounts: { class: 2, practice: 3 } });
    expect(screen.getByText(/2 classes/)).toBeInTheDocument();
    expect(screen.getByText(/3 practices/)).toBeInTheDocument();
  });

  it('tapping Log class calls onLogClass', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /log class/i }));
    expect(fns.onLogClass).toHaveBeenCalled();
  });

  it('tapping Log practice calls onLogPractice', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /log practice/i }));
    expect(fns.onLogPractice).toHaveBeenCalled();
  });

  it("lists today's entries with per-entry Undo", async () => {
    setup({
      todayLogs: [
        { id: 'log-1', sessionType: 'class', pointsEarned: 15, loggedAt: 'x' },
        { id: 'log-2', sessionType: 'practice', pointsEarned: 5, loggedAt: 'y' },
      ],
    });
    expect(screen.getByText(/🥋 Class/)).toBeInTheDocument();
    expect(screen.getByText(/🏠 Practice/)).toBeInTheDocument();
    const undoButtons = screen.getAllByRole('button', { name: /undo/i });
    expect(undoButtons).toHaveLength(2);
    await userEvent.click(undoButtons[0]);
    expect(fns.onUndo).toHaveBeenCalledWith('log-1');
  });

  it('renders loading and error states', () => {
    const { rerender } = setup({ loading: true });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    rerender(
      <KungFuSection
        profile={PROFILE}
        todayLogs={[]}
        weekCounts={{ class: 0, practice: 0 }}
        loading={false}
        error="boom"
        {...fns}
      />,
    );
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
