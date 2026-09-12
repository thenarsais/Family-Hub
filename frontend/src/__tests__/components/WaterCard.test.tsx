import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { WaterCard } from '@/components/Water/WaterCard';
import type { WaterUsageSummary } from '@/hooks/useWater';

const shell = {
  id: 'water',
  expanded: false,
  onToggle: vi.fn(),
  onReorder: vi.fn(),
  onMove: vi.fn(),
};

// relativeDay() compares a fixture date against the real wall clock, so build
// "today" and "yesterday" from it rather than fake-timing the whole render
// (userEvent's own internal delays don't play well with vi.useFakeTimers).
// Built from LOCAL date parts (not toISOString, which is UTC) to match how
// WaterCard's own relativeDay() parses "YYYY-MM-DD" as a local-midnight Date.
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const CONFIGURED: WaterUsageSummary = {
  configured: true,
  lastSyncedAt: today.toISOString(),
  latestReadingAt: today.toISOString(),
  dailyTotals: [
    { date: isoDate(yesterday), gallons: 120 },
    { date: isoDate(today), gallons: 95 },
  ],
  leakDetected: false,
};

function renderCard(overrides: Partial<React.ComponentProps<typeof WaterCard>> = {}) {
  const syncNow = vi.fn();
  render(
    <WaterCard
      {...shell}
      summary={CONFIGURED}
      loading={false}
      error={null}
      syncNow={syncNow}
      syncing={false}
      syncError={null}
      {...overrides}
    />,
  );
  return { syncNow };
}

describe('WaterCard', () => {
  it('shows a loading spinner', () => {
    renderCard({ loading: true });
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('shows the load error instead of the usual body', () => {
    renderCard({ error: 'network is down' });
    expect(screen.getByText('network is down')).toBeInTheDocument();
  });

  it('shows a "not connected" message when WaterSmart is unconfigured', () => {
    renderCard({ summary: { ...CONFIGURED, configured: false, dailyTotals: [] } });
    expect(screen.getByText(/not connected/i)).toBeInTheDocument();
    expect(screen.getByText(/WATERSMART_HOSTNAME/)).toBeInTheDocument();
  });

  it('shows a "waiting on the first sync" message when configured but empty', () => {
    renderCard({ summary: { ...CONFIGURED, dailyTotals: [] } });
    expect(screen.getByText(/waiting on the first sync/i)).toBeInTheDocument();
  });

  it("renders the daily totals bar with relative day labels, and the latest day's gallon count in the card header", () => {
    renderCard();
    expect(screen.getByText('95 gal')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('shows a leak banner only when leakDetected is true', () => {
    const { rerender } = render(
      <WaterCard {...shell} summary={CONFIGURED} loading={false} error={null} syncNow={vi.fn()} syncing={false} syncError={null} />,
    );
    expect(screen.queryByText(/possible leak/i)).not.toBeInTheDocument();

    rerender(
      <WaterCard
        {...shell}
        summary={{ ...CONFIGURED, leakDetected: true }}
        loading={false}
        error={null}
        syncNow={vi.fn()}
        syncing={false}
        syncError={null}
      />,
    );
    expect(screen.getByText(/possible leak/i)).toBeInTheDocument();
  });

  it('calls syncNow when "Sync now" is clicked, and disables the button while syncing', async () => {
    const { syncNow } = renderCard();
    const btn = screen.getByRole('button', { name: /sync now/i });
    await userEvent.click(btn);
    expect(syncNow).toHaveBeenCalled();
  });

  it('shows "Syncing…" and disables the button while a sync is in flight', () => {
    renderCard({ syncing: true });
    const btn = screen.getByRole('button', { name: /syncing/i });
    expect(btn).toBeDisabled();
  });

  it('surfaces a sync error under the button', () => {
    renderCard({ syncError: 'WaterSmart rejected the login' });
    expect(screen.getByText('WaterSmart rejected the login')).toBeInTheDocument();
  });
});
