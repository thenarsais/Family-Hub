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
    // Present on B-lite events (created via the dashboard form). Folded onto
    // the Google-feed copy from its calendar_events mirror row so the UI can
    // gate Edit/Delete to the creator without a second lookup.
    created_by_id?: string;
    google_event_id?: string;
    google_calendar_id?: string;
    mirror_id?: string;
  };

// Body for POST/PATCH /api/calendar/google/events — matches
// components['schemas']['GoogleCalendarEventInput'].
export interface GoogleEventInput {
  summary: string;
  description?: string;
  location?: string;
  allDay: boolean;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  timeZone: string;
  attendees?: string[];
  sendInvites?: boolean;
}

interface UseCalendarReturn {
  events: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  loading: boolean;
  error: string | null;
  tokenExpired: boolean;
  googleConnected: boolean;
  createEvent: (input: GoogleEventInput) => Promise<CalendarEvent>;
  updateEvent: (googleEventId: string, input: GoogleEventInput) => Promise<CalendarEvent>;
  deleteEvent: (googleEventId: string, sendInvites?: boolean) => Promise<void>;
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

      // B-lite dedupe: a form-created event comes back on BOTH feeds — once
      // from Google (rich) and once as its calendar_events mirror row. Keep the
      // Google copy, fold the mirror's creator/ids onto it so the UI can gate
      // Edit/Delete, and drop the duplicate local row. A family member who
      // isn't an attendee has only the mirror row, so they still see it.
      const googleById = new Map<string, any>(
        googleEventsWithSource.map((e: any) => [e.id, e]),
      );
      const localWithoutMirrorDupes = localEventsWithSource.filter((e: any) => {
        const gid = e.google_event_id;
        if (gid && googleById.has(gid)) {
          const g = googleById.get(gid);
          g.created_by_id = e.created_by_id;
          g.google_event_id = gid;
          g.google_calendar_id = e.google_calendar_id;
          g.mirror_id = e.id;
          return false;
        }
        return true;
      });

      // Merge events (Google events first, then local)
      const mergedEvents = [...googleEventsWithSource, ...localWithoutMirrorDupes];

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

  // Create / edit / delete all go through the Google routes (B-lite): the
  // event is written to the user's Google Calendar and mirrored locally. We
  // re-fetch afterwards rather than splicing an optimistic object in, so the
  // merged/deduped list stays the single source of shape.
  const createEvent = async (input: GoogleEventInput): Promise<CalendarEvent> => {
    if (!user?.id) throw new Error('User not authenticated');

    const response = await apiClient.post<ApiEnvelope<CalendarEvent & { google_event_id?: string }>>(
      '/api/calendar/google/events',
      input,
      { headers: { 'x-user-id': user.id } },
    );

    await fetchEvents();
    return response.data.data;
  };

  const updateEvent = async (googleEventId: string, input: GoogleEventInput): Promise<CalendarEvent> => {
    if (!user?.id) throw new Error('User not authenticated');

    const response = await apiClient.patch<ApiEnvelope<CalendarEvent & { google_event_id?: string }>>(
      `/api/calendar/google/events/${googleEventId}`,
      input,
      { headers: { 'x-user-id': user.id } },
    );

    await fetchEvents();
    return response.data.data;
  };

  const deleteEvent = async (googleEventId: string, sendInvites = true): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    await apiClient.delete(`/api/calendar/google/events/${googleEventId}`, {
      headers: { 'x-user-id': user.id },
      data: { sendInvites },
    });

    setEvents((prev) => prev.filter((e) => (e.google_event_id ?? e.id) !== googleEventId));
    await fetchEvents();
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
