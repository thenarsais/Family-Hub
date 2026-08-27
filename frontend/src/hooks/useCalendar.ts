import { useState, useEffect } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient, type ApiEnvelope } from '../services/api';
import { useAuth } from './useAuth';

type LocalCalendarEvent = components['schemas']['CalendarEvent'];
type GoogleCalendarEvent = components['schemas']['GoogleCalendarEvent'];

// The hook merges the local (`/api/calendar/events`) and Google
// (`/api/calendar/google/events`) feeds into one list, tagging each with its
// origin. An item is therefore either shape — everything is optional except id.
type CalendarEvent = Partial<LocalCalendarEvent> &
  Partial<GoogleCalendarEvent> & {
    id: string;
    source?: 'local' | 'google';
  };

interface UseCalendarReturn {
  events: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  loading: boolean;
  error: string | null;
  tokenExpired: boolean;
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
  const [tokenExpired, setTokenExpired] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      setTokenExpired(false);

      if (!user?.id) return;

      // Ask Google for a window around "now" so the WeekCalendar's back/forward
      // navigation has data — not just future events. The route otherwise
      // defaults timeMin to the start of the current week.
      const DAY_MS = 24 * 60 * 60 * 1000;
      const timeMin = new Date(Date.now() - 60 * DAY_MS).toISOString();
      const timeMax = new Date(Date.now() + 90 * DAY_MS).toISOString();

      const [eventsResponse, upcomingResponse, googleEventsResponse] = await Promise.all([
        apiClient.get<ApiEnvelope<LocalCalendarEvent[]>>('/api/calendar/events', {
          headers: { 'x-user-id': user.id },
        }).catch(() => ({ data: { data: [] } })),
        apiClient.get<ApiEnvelope<LocalCalendarEvent[]>>('/api/calendar/upcoming', {
          headers: { 'x-user-id': user.id },
        }).catch(() => ({ data: { data: [] } })),
        apiClient.get<ApiEnvelope<GoogleCalendarEvent[]>>('/api/calendar/google/events', {
          headers: { 'x-user-id': user.id },
          params: { timeMin, timeMax },
        }).catch((err) => {
          // 401 = token expired/revoked; 403 = token's scopes no longer cover
          // the read (e.g. a token that predates the calendar.readonly scope).
          // Both are fixed the same way — surface the re-authorize prompt.
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            setTokenExpired(true);
            console.warn('Google Calendar needs re-authorization (status', status, ')');
          } else {
            console.warn('Failed to fetch Google events:', err);
          }
          return { data: { data: [] } };
        }),
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
      // One-directional: seeing Google events proves a live connection, but an
      // empty window doesn't disprove one — leave "not connected" to the
      // dedicated /auth/google check so a connected user with no nearby events
      // doesn't get the "Connect" banner.
      if (googleEvents.length > 0) setGoogleConnected(true);
    } catch (err: any) {
      console.error('Failed to fetch calendar events:', err);
      setError(err.message || 'Failed to fetch calendar events');
    } finally {
      setLoading(false);
    }
  };

  // Check Google Calendar connection status on load. This used to redirect
  // the whole page straight to Google's consent screen the moment it saw no
  // token -- meaning anyone landing on the dashboard (including right after
  // signup, with zero clicks) got auto-navigated off the app into a real
  // OAuth grant. It's now just a status check; connecting is always a
  // user-initiated action via connectGoogle() (see the "not connected" banner
  // in WeekCalendar), same as the existing re-authorize flow for expired
  // tokens.
  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (!user?.id) return;

      try {
        const authResponse = await apiClient.get<ApiEnvelope<{ connected?: boolean; authUrl?: string }>>('/api/calendar/auth/google', {
          headers: { 'x-user-id': user.id },
        });

        setGoogleConnected(!!authResponse.data?.data?.connected);
      } catch (err) {
        console.warn('Failed to check Google Calendar connection:', err);
      }
    };

    checkGoogleConnection();
  }, [user?.id]);

  useEffect(() => {
    fetchEvents();
  }, [user?.id]);

  const createEvent = async (data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    if (!user?.id) throw new Error('User not authenticated');

    const response = await apiClient.post<CalendarEvent>(
      '/api/calendar/events',
      data,
      { headers: { 'x-user-id': user.id } },
    );

    const newEvent = response.data;
    setEvents((prev) => [...prev, newEvent]);
    return newEvent;
  };

  const updateEvent = async (eventId: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    if (!user?.id) throw new Error('User not authenticated');

    const response = await apiClient.patch<CalendarEvent>(
      `/api/calendar/events/${eventId}`,
      data,
      { headers: { 'x-user-id': user.id } },
    );

    const updated = response.data;
    setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
    return updated;
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    await apiClient.delete(`/api/calendar/events/${eventId}`, {
      headers: { 'x-user-id': user.id },
    });

    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const connectGoogle = async (): Promise<string> => {
    try {
      let userId = user?.id;

      // Fallback: try to decode user ID from token
      if (!userId) {
        const token = localStorage.getItem('auth_token');
        if (token) {
          try {
            const decoded = JSON.parse(atob(token));
            userId = decoded.sub || decoded.id;
          } catch (e) {
            // Not a demo token
          }
        }
      }

      if (!userId) throw new Error('User not authenticated');

      console.log('Connecting to Google Calendar with user ID:', userId);
      const response = await apiClient.get<ApiEnvelope<{ connected?: boolean; authUrl?: string }>>('/api/calendar/auth/google', {
        headers: { 'x-user-id': userId },
      });

      const authUrl = response.data?.data?.authUrl;
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
    tokenExpired,
    googleConnected,
    createEvent,
    updateEvent,
    deleteEvent,
    connectGoogle,
    disconnectGoogle,
    refresh: fetchEvents,
  };
}
