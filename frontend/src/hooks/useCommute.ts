import { useCallback, useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient, type ApiEnvelope } from '../services/api';
import { useAuth } from './useAuth';

export type CommuteRouteStatus = components['schemas']['CommuteRouteStatus'];
export type CommuteRoute = components['schemas']['CommuteRoute'];

export interface NewCommuteRoute {
  label: string;
  destinationAddress: string;
  arriveByTime: string; // "HH:MM"
  bufferMinutes?: number;
}

interface CommuteSummary {
  configured: boolean;
  homeAddress: string | null;
  noSchoolToday: boolean;
  routes: CommuteRouteStatus[];
}

const EMPTY_SUMMARY: CommuteSummary = { configured: false, homeAddress: null, noSchoolToday: false, routes: [] };

interface UseCommuteReturn {
  summary: CommuteSummary;
  loading: boolean;
  error: string | null;
  addRoute: (input: NewCommuteRoute) => Promise<void>;
  updateRoute: (id: string, updates: Partial<NewCommuteRoute>) => Promise<void>;
  removeRoute: (id: string) => Promise<void>;
  setHomeAddress: (address: string) => Promise<void>;
  setNoSchoolToday: (noSchool: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * T-16 — the commute/school-run dashboard card's data: one route per kid,
 * each carrying a live traffic-derived "leave by" time. Gracefully degrades
 * (nulls, configured: false) when GOOGLE_MAPS_API_KEY or a home address
 * isn't set yet -- no error state for that, same as Water/Weather.
 */
export function useCommute(): UseCommuteReturn {
  const { user } = useAuth();
  const [summary, setSummary] = useState<CommuteSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = user?.id ? { 'x-user-id': user.id } : undefined;

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setSummary(EMPTY_SUMMARY);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<ApiEnvelope<unknown> & CommuteSummary>('/api/commute/today', {
        headers: { 'x-user-id': user.id },
      });
      setSummary({
        configured: res.data?.configured ?? false,
        homeAddress: res.data?.homeAddress ?? null,
        noSchoolToday: res.data?.noSchoolToday ?? false,
        routes: res.data?.routes ?? [],
      });
    } catch (err) {
      console.error('Failed to load commute summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load commute summary');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addRoute = async (input: NewCommuteRoute) => {
    if (!headers) return;
    try {
      await apiClient.post('/api/commute/routes', input, { headers });
      await refresh();
    } catch (err) {
      console.error('Failed to add commute route:', err);
      setError(err instanceof Error ? err.message : 'Failed to add commute route');
      throw err;
    }
  };

  const updateRoute = async (id: string, updates: Partial<NewCommuteRoute>) => {
    if (!headers) return;
    try {
      await apiClient.patch(`/api/commute/routes/${id}`, updates, { headers });
      await refresh();
    } catch (err) {
      console.error('Failed to update commute route:', err);
      setError(err instanceof Error ? err.message : 'Failed to update commute route');
      throw err;
    }
  };

  const removeRoute = async (id: string) => {
    if (!headers) return;
    const snapshot = summary;
    setSummary((prev) => ({ ...prev, routes: prev.routes.filter((r) => r.id !== id) })); // optimistic
    try {
      await apiClient.delete(`/api/commute/routes/${id}`, { headers });
    } catch (err) {
      console.error('Failed to remove commute route:', err);
      setSummary(snapshot); // revert
      setError(err instanceof Error ? err.message : 'Failed to remove commute route');
    }
  };

  const setHomeAddress = async (address: string) => {
    if (!headers) return;
    try {
      await apiClient.put('/api/commute/settings', { homeAddress: address }, { headers });
      await refresh();
    } catch (err) {
      console.error('Failed to set home address:', err);
      setError(err instanceof Error ? err.message : 'Failed to set home address');
      throw err;
    }
  };

  const setNoSchoolToday = async (noSchool: boolean) => {
    if (!headers) return;
    const snapshot = summary;
    setSummary((prev) => ({ ...prev, noSchoolToday: noSchool })); // optimistic
    try {
      await apiClient.put('/api/commute/settings', { noSchoolToday: noSchool }, { headers });
    } catch (err) {
      console.error('Failed to toggle no-school-today:', err);
      setSummary(snapshot); // revert
      setError(err instanceof Error ? err.message : 'Failed to toggle no-school-today');
    }
  };

  return { summary, loading, error, addRoute, updateRoute, removeRoute, setHomeAddress, setNoSchoolToday, refresh };
}
