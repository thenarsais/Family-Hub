import { query, queryOne } from '../database/connection';
import type { Database } from '../types/database';

export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'];

// PATCH /api/calendar/events/:id passes req.body straight through with no
// validation -- this whitelist is what stands between an arbitrary request
// body and a raw SQL UPDATE statement.
const UPDATABLE_EVENT_COLUMNS = [
  'event_title', 'event_description', 'event_type', 'event_date',
  'start_time', 'end_time', 'location', 'child_id',
];

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
      const conditions = ['family_id = $1'];
      const values: any[] = [familyId];

      if (startDate) {
        values.push(startDate);
        conditions.push(`event_date >= $${values.length}`);
      }

      if (endDate) {
        values.push(endDate);
        conditions.push(`event_date <= $${values.length}`);
      }

      const result = await query<CalendarEvent>(
        `SELECT * FROM calendar_events WHERE ${conditions.join(' AND ')} ORDER BY event_date ASC`,
        values
      );

      return result.rows;
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

      const result = await query<CalendarEvent>(
        `SELECT * FROM calendar_events
         WHERE family_id = $1 AND event_date >= $2 AND event_date <= $3
         ORDER BY event_date ASC
         LIMIT 10`,
        [familyId, today.toISOString().split('T')[0], nextWeek.toISOString().split('T')[0]]
      );

      return result.rows;
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
      const event = await queryOne<CalendarEvent>(
        `INSERT INTO calendar_events
           (family_id, event_title, event_description, event_type, event_date, start_time, end_time, location, created_by_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          familyId,
          data.event_title,
          data.event_description || null,
          data.event_type || null,
          data.event_date,
          data.start_time || null,
          data.end_time || null,
          data.location || null,
          createdById,
        ]
      );

      if (!event) throw new Error('Failed to create event');
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
      const columns = Object.keys(updates || {}).filter((k) => UPDATABLE_EVENT_COLUMNS.includes(k));

      if (columns.length === 0) {
        return queryOne<CalendarEvent>(`SELECT * FROM calendar_events WHERE id = $1`, [id]);
      }

      const setClauses = columns.map((col, i) => `${col} = $${i + 2}`);
      const values = columns.map((col) => updates[col]);

      const event = await queryOne<CalendarEvent>(
        `UPDATE calendar_events
         SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id, ...values]
      );

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
      await query(`DELETE FROM calendar_events WHERE id = $1`, [id]);
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
      const result = await query<CalendarEvent>(
        `SELECT * FROM calendar_events WHERE family_id = $1 AND event_type = $2 ORDER BY event_date ASC`,
        [familyId, eventType]
      );
      return result.rows;
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
