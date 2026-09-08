import { useState, useEffect, useCallback } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient, type ApiEnvelope } from '../services/api';
import { useAuth } from './useAuth';

type Reminder = components['schemas']['Reminder'];

/** Fields the create form collects. assignee_user_id defaults to the caller. */
export interface NewReminder {
  title: string;
  description?: string;
  scheduled_time: string;
  reminder_type?: string;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly';
  recurrence_end_date?: string | null;
  assignee_user_id?: string;
}

type ReminderUpdate = Partial<
  Pick<
    Reminder,
    'title' | 'description' | 'scheduled_time' | 'reminder_type' | 'recurrence' | 'recurrence_end_date'
  >
>;

interface UseRemindersReturn {
  reminders: Reminder[];
  upcomingReminders: Reminder[];
  dueReminders: Reminder[];
  dismissedReminders: Reminder[];
  loading: boolean;
  error: string | null;
  createReminder: (data: NewReminder) => Promise<Reminder>;
  updateReminder: (id: string, updates: ReminderUpdate) => Promise<Reminder>;
  dismissReminder: (id: string) => Promise<void>;
  restoreReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// The "due now" band and the card poll on this cadence so a reminder surfaces
// without a reload. Recurrence rollover also happens server-side on these reads.
const POLL_MS = 60_000;

export function useReminders(): UseRemindersReturn {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [dueReminders, setDueReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setReminders([]);
      setUpcomingReminders([]);
      setDueReminders([]);
      setLoading(false);
      return;
    }
    const h = { headers: { 'x-user-id': userId } };
    try {
      setLoading(true);
      setError(null);
      const [all, upcoming, due] = await Promise.all([
        apiClient.get<ApiEnvelope<Reminder[]>>('/api/reminders', h),
        apiClient.get<ApiEnvelope<Reminder[]>>('/api/reminders/upcoming', h),
        apiClient.get<ApiEnvelope<Reminder[]>>('/api/reminders/due', h),
      ]);
      setReminders(all.data?.data ?? []);
      setUpcomingReminders(upcoming.data?.data ?? []);
      setDueReminders(due.data?.data ?? []);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshLive = useCallback(async () => {
    if (!userId) return;
    const h = { headers: { 'x-user-id': userId } };
    try {
      const [upcoming, due] = await Promise.all([
        apiClient.get<ApiEnvelope<Reminder[]>>('/api/reminders/upcoming', h),
        apiClient.get<ApiEnvelope<Reminder[]>>('/api/reminders/due', h),
      ]);
      setUpcomingReminders(upcoming.data?.data ?? []);
      setDueReminders(due.data?.data ?? []);
    } catch (err) {
      console.error('Failed to refresh reminders:', err);
    }
  }, [userId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!userId) return undefined;
    const id = window.setInterval(() => void refreshLive(), POLL_MS);
    return () => window.clearInterval(id);
  }, [userId, refreshLive]);

  const createReminder = useCallback(
    async (data: NewReminder): Promise<Reminder> => {
      if (!userId) throw new Error('User not authenticated');
      const res = await apiClient.post<ApiEnvelope<Reminder>>('/api/reminders', data, {
        headers: { 'x-user-id': userId },
      });
      const created = res.data?.data as Reminder;
      // where it lands (due / upcoming / neither) is the server's call — reconcile
      await fetchAll();
      return created;
    },
    [userId, fetchAll],
  );

  const updateReminder = useCallback(
    async (id: string, updates: ReminderUpdate): Promise<Reminder> => {
      if (!userId) throw new Error('User not authenticated');
      const res = await apiClient.patch<ApiEnvelope<Reminder>>(`/api/reminders/${id}`, updates, {
        headers: { 'x-user-id': userId },
      });
      const updated = res.data?.data as Reminder;
      await fetchAll();
      return updated;
    },
    [userId, fetchAll],
  );

  // optimistic hide from every list, revert the snapshot if the call fails
  const mutateOptimistic = useCallback(
    async (id: string, apply: (r: Reminder) => Reminder, call: () => Promise<unknown>) => {
      if (!userId) throw new Error('User not authenticated');
      const snapshot = { reminders, upcomingReminders, dueReminders };
      setReminders((prev) => prev.map((r) => (r.id === id ? apply(r) : r)));
      setUpcomingReminders((prev) => prev.filter((r) => r.id !== id));
      setDueReminders((prev) => prev.filter((r) => r.id !== id));
      try {
        await call();
        await fetchAll();
      } catch (err) {
        setReminders(snapshot.reminders);
        setUpcomingReminders(snapshot.upcomingReminders);
        setDueReminders(snapshot.dueReminders);
        throw err;
      }
    },
    [userId, reminders, upcomingReminders, dueReminders, fetchAll],
  );

  const dismissReminder = useCallback(
    (id: string) =>
      mutateOptimistic(
        id,
        (r) => ({ ...r, is_dismissed: true }),
        () =>
          apiClient.post(`/api/reminders/${id}/dismiss`, {}, { headers: { 'x-user-id': userId! } }),
      ),
    [mutateOptimistic, userId],
  );

  const deleteReminder = useCallback(
    async (id: string): Promise<void> => {
      if (!userId) throw new Error('User not authenticated');
      const snapshot = { reminders, upcomingReminders, dueReminders };
      setReminders((prev) => prev.filter((r) => r.id !== id));
      setUpcomingReminders((prev) => prev.filter((r) => r.id !== id));
      setDueReminders((prev) => prev.filter((r) => r.id !== id));
      try {
        await apiClient.delete(`/api/reminders/${id}`, { headers: { 'x-user-id': userId } });
      } catch (err) {
        setReminders(snapshot.reminders);
        setUpcomingReminders(snapshot.upcomingReminders);
        setDueReminders(snapshot.dueReminders);
        throw err;
      }
    },
    [userId, reminders, upcomingReminders, dueReminders],
  );

  const restoreReminder = useCallback(
    async (id: string): Promise<void> => {
      if (!userId) throw new Error('User not authenticated');
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, is_dismissed: false } : r)));
      try {
        await apiClient.post(
          `/api/reminders/${id}/restore`,
          {},
          { headers: { 'x-user-id': userId } },
        );
        await fetchAll();
      } catch (err) {
        setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, is_dismissed: true } : r)));
        throw err;
      }
    },
    [userId, fetchAll],
  );

  return {
    reminders,
    upcomingReminders,
    dueReminders,
    dismissedReminders: reminders.filter((r) => r.is_dismissed),
    loading,
    error,
    createReminder,
    updateReminder,
    dismissReminder,
    restoreReminder,
    deleteReminder,
    refresh: fetchAll,
  };
}
