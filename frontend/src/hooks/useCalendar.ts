import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

interface CalendarEvent {
  id: string;
  event_title: string;
  event_description?: string;
  event_type?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  created_at: string;
}

interface UseCalendarReturn {
  events: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  loading: boolean;
  error: string | null;
  createEvent: (data: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, data: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  deleteEvent: (eventId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCalendar(): UseCalendarReturn {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) return;

      const [eventsResponse, upcomingResponse] = await Promise.all([
        apiClient.get('/calendar/events', {
          headers: { 'x-user-id': user.id },
        }),
        apiClient.get('/calendar/upcoming', {
          headers: { 'x-user-id': user.id },
        }),
      ]);

      setEvents(eventsResponse.data || []);
      setUpcomingEvents(upcomingResponse.data || []);
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
        '/calendar/events',
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
        `/calendar/events/${eventId}`,
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

      await apiClient.delete(`/calendar/events/${eventId}`, {
        headers: { 'x-user-id': user.id },
      });

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err: any) {
      throw err;
    }
  };

  return {
    events,
    upcomingEvents,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refresh: fetchEvents,
  };
}
