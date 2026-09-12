import { useCallback, useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient } from '../services/api';

export type WaterUsageSummary = components['schemas']['WaterUsageSummary'];

// GET /api/water/usage spreads the summary fields at the top level (like
// /api/learning/stats), not wrapped in the generic { status, data } envelope.
interface UsageResponse extends WaterUsageSummary {
  status: string;
}

const EMPTY_SUMMARY: WaterUsageSummary = {
  configured: false,
  lastSyncedAt: null,
  latestReadingAt: null,
  dailyTotals: [],
  leakDetected: false,
};

interface UseWaterReturn {
  summary: WaterUsageSummary;
  loading: boolean;
  error: string | null;
  /** Triggers a sync right now instead of waiting for the next scheduled poll. */
  syncNow: () => Promise<void>;
  syncing: boolean;
  syncError: string | null;
  refresh: () => Promise<void>;
}

/**
 * FR-139 — the water usage dashboard card's data. No x-user-id header: like
 * Energy's usage/summary endpoints, this is unauthenticated, family-wide data.
 */
export function useWater(): UseWaterReturn {
  const [summary, setSummary] = useState<WaterUsageSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<UsageResponse>('/api/water/usage');
      setSummary({
        configured: res.data?.configured ?? false,
        lastSyncedAt: res.data?.lastSyncedAt ?? null,
        latestReadingAt: res.data?.latestReadingAt ?? null,
        dailyTotals: res.data?.dailyTotals ?? [],
        leakDetected: res.data?.leakDetected ?? false,
      });
    } catch (err) {
      console.error('Failed to load water usage:', err);
      setError(err instanceof Error ? err.message : 'Failed to load water usage');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      await apiClient.post('/api/water/sync', {});
      await refresh();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  return { summary, loading, error, syncNow, syncing, syncError, refresh };
}
