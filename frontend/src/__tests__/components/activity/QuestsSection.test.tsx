import { render, screen } from '@testing-library/react';
import QuestsSection from '@/components/activity/QuestsSection';

const QUESTS = [
  { key: 'chore', label: 'Complete a chore', done: true },
  { key: 'reading', label: 'Log your reading', done: false },
  { key: 'mood', label: 'Check in your mood', done: false },
];

function setup(over: Record<string, unknown> = {}) {
  return render(
    <QuestsSection
      quests={QUESTS as never}
      allDone={false}
      bonusAwarded={false}
      loading={false}
      error={null}
      {...over}
    />,
  );
}

describe('QuestsSection', () => {
  it('renders all 3 quests with their labels', () => {
    setup();
    expect(screen.getByText('Complete a chore')).toBeInTheDocument();
    expect(screen.getByText('Log your reading')).toBeInTheDocument();
    expect(screen.getByText('Check in your mood')).toBeInTheDocument();
  });

  it('does not show the bonus banner when not all done', () => {
    setup();
    expect(screen.queryByText(/\+50 bonus/i)).not.toBeInTheDocument();
  });

  it('shows the bonus banner when allDone and bonusAwarded', () => {
    setup({ allDone: true, bonusAwarded: true });
    expect(screen.getByText(/all 3 quests done! \+50 bonus/i)).toBeInTheDocument();
  });

  it('renders loading and error states', () => {
    const { rerender } = setup({ loading: true });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    rerender(
      <QuestsSection
        quests={QUESTS as never}
        allDone={false}
        bonusAwarded={false}
        loading={false}
        error="boom"
      />,
    );
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
