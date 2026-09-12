import { Droplets, RefreshCw, TriangleAlert } from 'lucide-react';
import { DashboardCard } from '../shell/DashboardCard';
import type { WaterUsageSummary } from '@hooks/useWater';

interface CardShellProps {
  id: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  onReorder: (dragId: string, dropId: string) => void;
  onMove: (id: string, delta: number) => void;
}

interface Props extends CardShellProps {
  summary: WaterUsageSummary;
  loading: boolean;
  error: string | null;
  syncNow: () => void | Promise<void>;
  syncing: boolean;
  syncError: string | null;
}

function relativeDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

/**
 * FR-139 — City of Thornton water usage via WaterSmart. WaterSmart's own data
 * lags a day or more behind real time, so this deliberately never claims to
 * be "live" -- every total is labeled with the day it's actually for.
 */
export function WaterCard({ summary, loading, error, syncNow, syncing, syncError, ...shell }: Props) {
  const { configured, dailyTotals, latestReadingAt, leakDetected } = summary;
  const latest = dailyTotals[dailyTotals.length - 1];
  const maxGallons = Math.max(1, ...dailyTotals.map((d) => d.gallons));

  return (
    <DashboardCard
      {...shell}
      title="Water Usage"
      icon={<Droplets className="w-5 h-5 text-leaf" aria-hidden="true" />}
      count={latest ? `${Math.round(latest.gallons)} gal` : undefined}
    >
      {loading ? (
        <div className="py-6 flex justify-center" role="status" aria-label="Loading">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
        </div>
      ) : error ? (
        <p className="text-alert text-sm text-center py-4">{error}</p>
      ) : !configured ? (
        <p className="text-ink-3 text-sm text-center py-4">
          Not connected — set WATERSMART_HOSTNAME/EMAIL/PASSWORD to turn this on.
        </p>
      ) : (
        <div>
          {leakDetected && (
            <div className="flex items-center gap-2 rounded-lg bg-alert/10 border border-alert/40 px-3 py-2 mb-3 text-sm text-alert">
              <TriangleAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
              Possible leak flagged in the last 2 days — worth a look.
            </div>
          )}

          {dailyTotals.length === 0 ? (
            <p className="text-ink-3 text-sm text-center py-4">
              Connected — waiting on the first sync.
            </p>
          ) : (
            <>
              <div className="flex items-end gap-2 h-16">
                {dailyTotals.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                    <div
                      className="w-full rounded-t bg-leaf/70"
                      style={{ height: `${Math.max(8, (d.gallons / maxGallons) * 100)}%` }}
                      title={`${relativeDay(d.date)} · ${Math.round(d.gallons)} gal`}
                    />
                    <span className="text-[0.65rem] text-ink-3">{relativeDay(d.date)}</span>
                  </div>
                ))}
              </div>
              {latestReadingAt && (
                <p className="text-xs text-ink-3 mt-2">
                  Latest reading {new Date(latestReadingAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  — WaterSmart data typically lags a day or more.
                </p>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => void syncNow()}
            disabled={syncing}
            className="btn btn-secondary btn-small gap-1 mt-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
          {syncError && <p className="text-xs text-alert mt-2">{syncError}</p>}
        </div>
      )}
    </DashboardCard>
  );
}

export default WaterCard;
