import { useState, useEffect } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient, type ApiEnvelope } from '../services/api';
import { useAuth } from './useAuth';

// GET /api/announcements returns the base row plus a per-user read flag.
type Announcement = components['schemas']['Announcement'] & { is_read?: boolean };

interface UseAnnouncementsReturn {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
  createAnnouncement: (
    familyId: string,
    title: string,
    message: string,
    options?: {
      announcement_type?: string;
      priority?: string;
      target_audience?: string;
      target_user_ids?: string[];
      is_pinned?: boolean;
      expires_at?: string;
    },
  ) => Promise<Announcement>;
  updateAnnouncement: (
    announcementId: string,
    updates: Partial<
      Pick<
        Announcement,
        'title' | 'message' | 'is_pinned' | 'announcement_type' | 'priority' | 'target_audience' | 'expires_at'
      >
    >,
  ) => Promise<Announcement>;
  markAsRead: (announcementId: string) => Promise<void>;
  deleteAnnouncement: (announcementId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAnnouncements(): UseAnnouncementsReturn {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setAnnouncements([]);
        return;
      }

      const response = await apiClient.get<ApiEnvelope<Announcement[]>>('/api/announcements', {
        headers: { 'x-user-id': user.id },
      });

      setAnnouncements(response.data?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch announcements:', err);
      setError(err.message || 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [user?.id]);

  const createAnnouncement = async (
    familyId: string,
    title: string,
    message: string,
    options?: any,
  ): Promise<Announcement> => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await apiClient.post<ApiEnvelope<Announcement>>(
        '/api/announcements',
        {
          family_id: familyId,
          title,
          message,
          ...options,
        },
        { headers: { 'x-user-id': user.id } },
      );

      const newAnnouncement = response.data?.data;
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      return newAnnouncement;
    } catch (err: any) {
      console.error('Failed to create announcement:', err);
      throw err;
    }
  };

  const updateAnnouncement = async (
    announcementId: string,
    updates: Partial<Announcement>,
  ): Promise<Announcement> => {
    if (!user?.id) throw new Error('User not authenticated');

    const response = await apiClient.patch<ApiEnvelope<Announcement>>(
      `/api/announcements/${announcementId}`,
      updates,
      { headers: { 'x-user-id': user.id } },
    );

    const updated = response.data?.data;
    setAnnouncements((prev) =>
      prev
        .map((a) => (a.id === announcementId ? { ...a, ...updated } : a))
        // keep pinned-first / newest ordering the list endpoint uses
        .sort((a, b) => {
          if (!!a.is_pinned !== !!b.is_pinned) return a.is_pinned ? -1 : 1;
          return (b.created_at ?? '').localeCompare(a.created_at ?? '');
        }),
    );
    return updated;
  };

  const markAsRead = async (announcementId: string): Promise<void> => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      await apiClient.post(
        `/api/announcements/${announcementId}/read`,
        {},
        { headers: { 'x-user-id': user.id } },
      );

      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcementId ? { ...a, is_read: true } : a,
        ),
      );
    } catch (err: any) {
      console.error('Failed to mark announcement as read:', err);
      throw err;
    }
  };

  const deleteAnnouncement = async (announcementId: string): Promise<void> => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      await apiClient.delete(`/api/announcements/${announcementId}`, {
        headers: { 'x-user-id': user.id },
      });

      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    } catch (err: any) {
      console.error('Failed to delete announcement:', err);
      throw err;
    }
  };

  return {
    announcements,
    loading,
    error,
    createAnnouncement,
    updateAnnouncement,
    markAsRead,
    deleteAnnouncement,
    refresh: fetchAnnouncements,
  };
}
