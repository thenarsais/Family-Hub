import { getSupabase } from './supabase'
import type { Database } from '../types/database';


export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'];

class CalendarService {
  /**
   * Get calendar events for family
   */
  async getFamilyEvents(
    familyId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    try {
      let query = getSupabase()
        .from('calendar_events')
        .select('*')
        .eq('family_id', familyId);

      if (startDate) {
        query = query.gte('event_date', startDate);
      }

      if (endDate) {
        query = query.lte('event_date', endDate);
      }

      const { data, error } = await query.order('event_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch family events:', error);
      throw error;
    }
  }

  /**
   * Get upcoming events (next 7 days)
   */
  async getUpcomingEvents(familyId: string): Promise<any[]> {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await getSupabase()
        .from('calendar_events')
        .select('*')
        .eq('family_id', familyId)
        .gte('event_date', today.toISOString().split('T')[0])
        .lte('event_date', nextWeek.toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch upcoming events:', error);
      throw error;
    }
  }

  /**
   * Create calendar event
   */
  async createEvent(
    familyId: string,
    createdById: string,
    data: {
      event_title: string;
      event_description?: string;
      event_type?: string;
      event_date: string;
      start_time?: string;
      end_time?: string;
      location?: string;
    },
  ): Promise<any> {
    try {
      const { data: event, error } = await getSupabase()
        .from('calendar_events')
        .insert({
          family_id: familyId,
          event_title: data.event_title,
          event_description: data.event_description,
          event_type: data.event_type,
          event_date: data.event_date,
          start_time: data.start_time,
          end_time: data.end_time,
          location: data.location,
          created_by_id: createdById,
        })
        .select()
        .single();

      if (error) throw error;
      return event;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  /**
   * Update calendar event
   */
  async updateEvent(id: string, updates: any): Promise<any> {
    try {
      const { data: event, error } = await getSupabase()
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return event;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(id: string): Promise<void> {
    try {
      const { error } = await getSupabase()
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  /**
   * Get events by type (chore, assignment, family_event, etc.)
   */
  async getEventsByType(familyId: string, eventType: string): Promise<any[]> {
    try {
      const { data, error } = await getSupabase()
        .from('calendar_events')
        .select('*')
        .eq('family_id', familyId)
        .eq('event_type', eventType)
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch events by type:', error);
      throw error;
    }
  }
}

// Singleton pattern
let calendarService: CalendarService;

export function getCalendarService(): CalendarService {
  if (!calendarService) {
    calendarService = new CalendarService();
  }
  return calendarService;
}




