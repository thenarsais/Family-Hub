import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

interface CalendarEvent {
  id: string;
  event_title?: string;
  summary?: string;
  event_description?: string;
  description?: string;
  event_type?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  created_at?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  source?: 'local' | 'google';
}

interface UseCalendarReturn {
  events: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  loading: boolean;
  error: string | null;
  googleConnected: boolean;
  createEvent: (data: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, data: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  deleteEvent: (eventId: string) => Promise<void>;
  connectGoogle: () => Promise<string>;
  disconnectGoogle: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCalendar(): UseCalendarReturn {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) return;

      const [eventsResponse, upcomingResponse, googleEventsResponse] = await Promise.all([
        apiClient.get('/api/calendar/events', {
          headers: { 'x-user-id': user.id },
        }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/calendar/upcoming', {
          headers: { 'x-user-id': user.id },
        }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/calendar/google/events', {
          headers: { 'x-user-id': user.id },
        }).catch(() => ({ data: { data: [] } })),
      ]);

      const localEvents = eventsResponse.data?.data || [];
      const localUpcoming = upcomingResponse.data?.data || [];
      const googleEvents = googleEventsResponse.data?.data || [];

      // Mark events with their source
      const localEventsWithSource = localEvents.map((e: any) => ({ ...e, source: 'local' }));
      const googleEventsWithSource = googleEvents.map((e: any) => ({ ...e, source: 'google' }));

      // Merge events (Google events first, then local)
      const mergedEvents = [...googleEventsWithSource, ...localEventsWithSource];

      // Filter upcoming from merged events
      const now = new Date();
      const upcomingMerged = mergedEvents
        .filter((e: any) => {
          const eventDate = e.event_date || e.start?.dateTime || e.start?.date;
          return eventDate && new Date(eventDate) >= now;
        })
        .slice(0, 10);

      setEvents(mergedEvents);
      setUpcomingEvents(upcomingMerged.length > 0 ? upcomingMerged : localUpcoming);
      setGoogleConnected(googleEvents.length > 0);
    } catch (err: any) {
      console.error('Failed to fetch calendar events:', err);
      setError(err.message || 'Failed to fetch calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user?.id]);

  const createEvent = async (data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      const response = await apiClient.post(
        '/api/calendar/events',
        data,
        { headers: { 'x-user-id': user.id } },
      );

      const newEvent = response.data;
      setEvents((prev) => [...prev, newEvent]);
      return newEvent;
    } catch (err: any) {
      throw err;
    }
  };

  const updateEvent = async (eventId: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      const response = await apiClient.patch(
        `/api/calendar/events/${eventId}`,
        data,
        { headers: { 'x-user-id': user.id } },
      );

      const updated = response.data;
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
      return updated;
    } catch (err: any) {
      throw err;
    }
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      await apiClient.delete(`/api/calendar/events/${eventId}`, {
        headers: { 'x-user-id': user.id },
      });

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err: any) {
      throw err;
    }
  };

  const connectGoogle = async (): Promise<string> => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      const response = await apiClient.get('/api/calendar/auth/google', {
        headers: { 'x-user-id': user.id },
      });

      const authUrl = response.data?.authUrl;
      if (!authUrl) throw new Error('Failed to get Google OAuth URL');

      // Open OAuth window
      window.open(authUrl, 'google-oauth', 'width=500,height=600');

      // Refresh events after a delay to check if user authorized
      setTimeout(() => {
        fetchEvents();
      }, 3000);

      return authUrl;
    } catch (err: any) {
      console.error('Failed to connect Google Calendar:', err);
      throw err;
    }
  };

  const disconnectGoogle = async (): Promise<void> => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      await apiClient.post('/api/calendar/google/disconnect', {}, {
        headers: { 'x-user-id': user.id },
      });

      setGoogleConnected(false);
      await fetchEvents();
    } catch (err: any) {
      console.error('Failed to disconnect Google Calendar:', err);
      throw err;
    }
  };

  return {
    events,
    upcomingEvents,
    loading,
    error,
    googleConnected,
    createEvent,
    updateEvent,
    deleteEvent,
    connectGoogle,
    disconnectGoogle,
    refresh: fetchEvents,
  };
}
