import { useCallback, useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient, type ApiEnvelope } from '../services/api';
import { useAuth } from './useAuth';

export type CommuteRouteStatus = components['schemas']['CommuteRouteStatus'];
export type CommuteRoute = components['schemas']['CommuteRoute'];
export type TripSuggestion = components['schemas']['CommuteTripSuggestion'];

export interface NewCommuteRoute {
  label: string;
  destinationAddress: string;
  /** Fixed-schedule routes need this; event-linked routes (eventTitlePattern set) don't. */
  arriveByTime?: string; // "HH:MM"
  bufferMinutes?: number;
  familyMemberId?: string;
  /** T-26: makes this route event-linked instead of fixed-schedule. */
  eventTitlePattern?: string;
  /** T-26: leave from somewhere other than the family home address. */
  originOverride?: string;
}

interface CommuteSummary {
  configured: boolean;
  homeAddress: string | null;
  noSchoolToday: boolean;
  routes: CommuteRouteStatus[];
}

const EMPTY_SUMMARY: CommuteSummary = { configured: false, homeAddress: null, noSchoolToday: false, routes: [] };
const POLL_MS = 60_000;

interface UseCommuteReturn {
  summary: CommuteSummary;
  suggestions: TripSuggestion[];
  loading: boolean;
  error: string | null;
  addRoute: (input: NewCommuteRoute) => Promise<void>;
  updateRoute: (id: string, updates: Partial<NewCommuteRoute> & { arriveByTime?: string | null; eventTitlePattern?: string | null; originOverride?: string | null }) => Promise<void>;
  removeRoute: (id: string) => Promise<void>;
  setHomeAddress: (address: string) => Promise<void>;
  setNoSchoolToday: (noSchool: boolean) => Promise<void>;
  dismissSuggestion: (titlePattern: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * T-16 + T-26 — the commute/trips dashboard card's data: fixed school-run
 * routes plus calendar-linked ad hoc trips, each carrying a live
 * traffic-derived "leave by" time, and the pending "add a commute for this?"
 * suggestions (T-26). Polls on the same 60s cadence as reminders so a
 * leave-soon alert stays live without a manual refresh. Gracefully degrades
 * (nulls, configured: false) when GOOGLE_MAPS_API_KEY or a home address
 * isn't set yet -- no error state for that, same as Water/Weather.
 */
export function useCommute(): UseCommuteReturn {
  const { user } = useAuth();
  const [summary, setSummary] = useState<CommuteSummary>(EMPTY_SUMMARY);
  const [suggestions, setSuggestions] = useState<TripSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;
  const headers = userId ? { 'x-user-id': userId } : undefined;

  const refresh = useCallback(async () => {
    if (!userId) {
      setSummary(EMPTY_SUMMARY);
      setSuggestions([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const h = { headers: { 'x-user-id': userId } };
      const [todayRes, suggestionsRes] = await Promise.all([
        apiClient.get<ApiEnvelope<unknown> & CommuteSummary>('/api/commute/today', h),
        apiClient.get<ApiEnvelope<unknown> & { suggestions: TripSuggestion[] }>('/api/commute/suggestions', h),
      ]);
      setSummary({
        configured: todayRes.data?.configured ?? false,
        homeAddress: todayRes.data?.homeAddress ?? null,
        noSchoolToday: todayRes.data?.noSchoolToday ?? false,
        routes: todayRes.data?.routes ?? [],
      });
      setSuggestions(suggestionsRes.data?.suggestions ?? []);
    } catch (err) {
      console.error('Failed to load commute summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load commute summary');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /** Like refresh(), but doesn't flip the shared loading flag -- for the 60s poll, so a re-fetch never unmounts what's currently showing (the same fix T-25 needed for its refresh()). */
  const refreshLive = useCallback(async () => {
    if (!userId) return;
    try {
      const h = { headers: { 'x-user-id': userId } };
      const [todayRes, suggestionsRes] = await Promise.all([
        apiClient.get<ApiEnvelope<unknown> & CommuteSummary>('/api/commute/today', h),
        apiClient.get<ApiEnvelope<unknown> & { suggestions: TripSuggestion[] }>('/api/commute/suggestions', h),
      ]);
      setSummary({
        configured: todayRes.data?.configured ?? false,
        homeAddress: todayRes.data?.homeAddress ?? null,
        noSchoolToday: todayRes.data?.noSchoolToday ?? false,
        routes: todayRes.data?.routes ?? [],
      });
      setSuggestions(suggestionsRes.data?.suggestions ?? []);
    } catch (err) {
      console.error('Failed to refresh commute summary:', err);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return undefined;
    const id = window.setInterval(() => void refreshLive(), POLL_MS);
    return () => window.clearInterval(id);
  }, [userId, refreshLive]);

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

  const updateRoute: UseCommuteReturn['updateRoute'] = async (id, updates) => {
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

  const dismissSuggestion = async (titlePattern: string) => {
    if (!headers) return;
    const snapshot = suggestions;
    setSuggestions((prev) => prev.filter((s) => s.titlePattern !== titlePattern)); // optimistic
    try {
      await apiClient.post('/api/commute/suggestions/dismiss', { titlePattern }, { headers });
    } catch (err) {
      console.error('Failed to dismiss commute suggestion:', err);
      setSuggestions(snapshot); // revert
      setError(err instanceof Error ? err.message : 'Failed to dismiss commute suggestion');
    }
  };

  return {
    summary,
    suggestions,
    loading,
    error,
    addRoute,
    updateRoute,
    removeRoute,
    setHomeAddress,
    setNoSchoolToday,
    dismissSuggestion,
    refresh,
  };
}
