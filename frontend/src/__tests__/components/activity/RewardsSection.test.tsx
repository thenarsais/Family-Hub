import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RewardsSection from '@/components/activity/RewardsSection';

const TIERS = [
  { name: 'bronze', points: 200, reached: true },
  { name: 'silver', points: 300, reached: false },
  { name: 'gold', points: 400, reached: false },
];

function setup(over: Record<string, unknown> = {}) {
  return render(
    <RewardsSection
      weeklyGoal={50}
      weekPoints={20}
      monthPoints={220}
      tiers={TIERS as never}
      justEarned={[]}
      earned={[]}
      loading={false}
      error={null}
      {...over}
    />,
  );
}

describe('RewardsSection', () => {
  it('renders the weekly and monthly progress bars', () => {
    setup();
    expect(screen.getByText('20 / 50')).toBeInTheDocument();
    expect(screen.getByText('220 / 400')).toBeInTheDocument();
    expect(screen.getByText(/this month · bronze/i)).toBeInTheDocument();
  });

  it('does not show the celebration banner when nothing was just earned', () => {
    setup();
    expect(screen.queryByText(/new reward earned/i)).not.toBeInTheDocument();
  });

  it('shows the celebration banner when something was just earned, and dismisses it', async () => {
    setup({ justEarned: ['weekly'] });
    expect(screen.getByText(/new reward earned/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByText(/new reward earned/i)).not.toBeInTheDocument();
  });

  it("lists the caller's pending rewards", () => {
    setup({
      earned: [
        {
          id: 'r1', userId: 'u1', milestoneType: 'weekly', periodKey: '2026-09-07',
          earnedAt: 'x', fulfilledAt: null, libraryItem: null, fulfillmentNote: null,
        },
        {
          id: 'r2', userId: 'u1', milestoneType: 'bronze', periodKey: '2026-09',
          earnedAt: 'x', fulfilledAt: 'y', libraryItem: null, fulfillmentNote: null,
        },
      ],
    });
    expect(screen.getByText(/your pending rewards \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('Weekly goal')).toBeInTheDocument();
  });

  it('renders loading and error states', () => {
    const { rerender } = setup({ loading: true });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    rerender(
      <RewardsSection
        weeklyGoal={50}
        weekPoints={0}
        monthPoints={0}
        tiers={[]}
        justEarned={[]}
        earned={[]}
        loading={false}
        error="boom"
      />,
    );
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
