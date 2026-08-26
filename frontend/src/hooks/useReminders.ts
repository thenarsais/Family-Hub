import { useState, useEffect } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

type Reminder = components['schemas']['Reminder'];

interface UseRemindersReturn {
  reminders: Reminder[];
  upcomingReminders: Reminder[];
  loading: boolean;
  error: string | null;
  createReminder: (data: Partial<Reminder>) => Promise<Reminder>;
  dismissReminder: (reminderId: string) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
  refreshReminders: () => Promise<void>;
  refreshUpcoming: () => Promise<void>;
}

export function useReminders(): UseRemindersReturn {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setReminders([]);
        return;
      }

      const response = await apiClient.get('/api/reminders', {
        headers: { 'x-user-id': user.id },
      });

      setReminders(response.data?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch reminders:', err);
      setError(err.message || 'Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingReminders = async () => {
    try {
      if (!user?.id) return;

      const response = await apiClient.get('/api/reminders/upcoming', {
        headers: { 'x-user-id': user.id },
      });

      setUpcomingReminders(response.data?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch upcoming reminders:', err);
    }
  };

  useEffect(() => {
    fetchReminders();
    fetchUpcomingReminders();
  }, [user?.id]);

  const createReminder = async (data: Partial<Reminder>): Promise<Reminder> => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await apiClient.post(
        '/api/reminders',
        data,
        { headers: { 'x-user-id': user.id } },
      );

      const newReminder = response.data?.data;
      setReminders((prev) => [...prev, newReminder]);
      return newReminder;
    } catch (err: any) {
      console.error('Failed to create reminder:', err);
      throw err;
    }
  };

  const dismissReminder = async (reminderId: string): Promise<void> => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      await apiClient.post(
        `/api/reminders/${reminderId}/dismiss`,
        {},
        { headers: { 'x-user-id': user.id } },
      );

      setReminders((prev) =>
        prev.map((r) =>
          r.id === reminderId ? { ...r, is_dismissed: true } : r,
        ),
      );
    } catch (err: any) {
      console.error('Failed to dismiss reminder:', err);
      throw err;
    }
  };

  const deleteReminder = async (reminderId: string): Promise<void> => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      await apiClient.delete(`/api/reminders/${reminderId}`, {
        headers: { 'x-user-id': user.id },
      });

      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (err: any) {
      console.error('Failed to delete reminder:', err);
      throw err;
    }
  };

  return {
    reminders,
    upcomingReminders,
    loading,
    error,
    createReminder,
    dismissReminder,
    deleteReminder,
    refreshReminders: fetchReminders,
    refreshUpcoming: fetchUpcomingReminders,
  };
}
