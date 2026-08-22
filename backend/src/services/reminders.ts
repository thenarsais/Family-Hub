import { query, queryOne } from '../database/connection';
import type { Database } from '../types/database';

export type Reminder = Database['public']['Tables']['reminders']['Row'];
export type ReminderInsert = Database['public']['Tables']['reminders']['Insert'];

// PATCH /api/reminders/:id passes req.body straight through with no runtime
// validation (Partial<ReminderInsert> only checks at compile time) -- this
// whitelist is what stands between an arbitrary request body and a raw SQL
// UPDATE statement.
const UPDATABLE_REMINDER_COLUMNS = [
  'title', 'description', 'reminder_type', 'related_item_id', 'related_item_type',
  'scheduled_time', 'remind_before_minutes', 'recurrence', 'recurrence_end_date',
];

class ReminderService {
  /**
   * Get all reminders for user
   */
  async getRemindersForUser(userId: string, filter?: 'pending' | 'dismissed' | 'all'): Promise<any[]> {
    try {
      const conditions = ['user_id = $1'];
      const values: any[] = [userId];

      if (filter === 'pending') {
        conditions.push('is_dismissed = false');
      } else if (filter === 'dismissed') {
        conditions.push('is_dismissed = true');
      }

      const result = await query<Reminder>(
        `SELECT * FROM reminders WHERE ${conditions.join(' AND ')} ORDER BY scheduled_time ASC`,
        values
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
      throw error;
    }
  }

  /**
   * Get upcoming reminders (next 24 hours)
   */
  async getUpcomingReminders(userId: string): Promise<any[]> {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const result = await query<Reminder>(
        `SELECT * FROM reminders
         WHERE user_id = $1 AND is_dismissed = false
           AND scheduled_time >= $2 AND scheduled_time <= $3
         ORDER BY scheduled_time ASC`,
        [userId, now.toISOString(), tomorrow.toISOString()]
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to fetch upcoming reminders:', error);
      throw error;
    }
  }

  /**
   * Create a reminder
   */
  async createReminder(
    userId: string,
    data: {
      title: string;
      description?: string;
      reminder_type: 'chore' | 'assignment' | 'event' | 'goal' | 'custom';
      related_item_id?: string;
      related_item_type?: string;
      scheduled_time: string;
      remind_before_minutes?: number;
      recurrence?: 'once' | 'daily' | 'weekly' | 'monthly';
      recurrence_end_date?: string;
    },
  ): Promise<any> {
    try {
      const reminder = await queryOne<Reminder>(
        `INSERT INTO reminders
           (user_id, title, description, reminder_type, related_item_id, related_item_type,
            scheduled_time, remind_before_minutes, recurrence, recurrence_end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userId,
          data.title,
          data.description || null,
          data.reminder_type,
          data.related_item_id || null,
          data.related_item_type || null,
          data.scheduled_time,
          data.remind_before_minutes ?? 15,
          data.recurrence || 'once',
          data.recurrence_end_date || null,
        ]
      );

      if (!reminder) throw new Error('Failed to create reminder');
      return reminder;
    } catch (error) {
      console.error('Failed to create reminder:', error);
      throw error;
    }
  }

  /**
   * Update reminder
   */
  async updateReminder(id: string, updates: Partial<ReminderInsert>): Promise<any> {
    try {
      const columns = Object.keys(updates || {}).filter((k) => UPDATABLE_REMINDER_COLUMNS.includes(k));

      if (columns.length === 0) {
        return queryOne<Reminder>(`SELECT * FROM reminders WHERE id = $1`, [id]);
      }

      const setClauses = columns.map((col, i) => `${col} = $${i + 2}`);
      const values = columns.map((col) => (updates as any)[col]);

      const reminder = await queryOne<Reminder>(
        `UPDATE reminders
         SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id, ...values]
      );

      return reminder;
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  }

  /**
   * Dismiss a reminder
   */
  async dismissReminder(id: string): Promise<void> {
    try {
      await query(
        `UPDATE reminders SET is_dismissed = true, dismissed_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );
    } catch (error) {
      console.error('Failed to dismiss reminder:', error);
      throw error;
    }
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(id: string): Promise<void> {
    try {
      await query(`DELETE FROM reminders WHERE id = $1`, [id]);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw error;
    }
  }

  /**
   * Mark reminder as notification sent
   */
  async markNotificationSent(id: string): Promise<void> {
    try {
      await query(
        `UPDATE reminders SET notification_sent = true, sent_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );
    } catch (error) {
      console.error('Failed to mark notification sent:', error);
      throw error;
    }
  }

  /**
   * Get reminders that need notification (within remind_before_minutes window)
   * Run this periodically to send push notifications
   */
  async getRemindersNeedingNotification(): Promise<any[]> {
    try {
      const result = await query<Reminder>(
        `SELECT * FROM reminders
         WHERE notification_sent = false AND is_dismissed = false
           AND scheduled_time <= $1`,
        [new Date(Date.now() + 60 * 60 * 1000).toISOString()]
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to fetch reminders needing notification:', error);
      throw error;
    }
  }
}

// Singleton pattern
let reminderService: ReminderService;

export function getReminderService(): ReminderService {
  if (!reminderService) {
    reminderService = new ReminderService();
  }
  return reminderService;
}
