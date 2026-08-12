import { getSupabase } from './supabase'
import type { Database } from '../types/database';


export type Reminder = Database['public']['Tables']['reminders']['Row'];
export type ReminderInsert = Database['public']['Tables']['reminders']['Insert'];

class ReminderService {
  /**
   * Get all reminders for user
   */
  async getRemindersForUser(userId: string, filter?: 'pending' | 'dismissed' | 'all'): Promise<any[]> {
    try {
      let query = getSupabase()
        .from('reminders')
        .select('*')
        .eq('user_id', userId);

      if (filter === 'pending') {
        query = query.eq('is_dismissed', false);
      } else if (filter === 'dismissed') {
        query = query.eq('is_dismissed', true);
      }

      const { data, error } = await query.order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data || [];
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

      const { data, error } = await getSupabase()
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .gte('scheduled_time', now.toISOString())
        .lte('scheduled_time', tomorrow.toISOString())
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data || [];
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
      const { data: reminder, error } = await getSupabase()
        .from('reminders')
        .insert({
          user_id: userId,
          title: data.title,
          description: data.description,
          reminder_type: data.reminder_type,
          related_item_id: data.related_item_id,
          related_item_type: data.related_item_type,
          scheduled_time: data.scheduled_time,
          remind_before_minutes: data.remind_before_minutes || 15,
          recurrence: data.recurrence || 'once',
          recurrence_end_date: data.recurrence_end_date,
        })
        .select()
        .single();

      if (error) throw error;
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
      const { data: reminder, error } = await getSupabase()
        .from('reminders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
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
      const { error } = await getSupabase()
        .from('reminders')
        .update({
          is_dismissed: true,
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
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
      const { error } = await getSupabase()
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
      const { error } = await getSupabase()
        .from('reminders')
        .update({
          notification_sent: true,
          sent_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
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
      const { data, error } = await getSupabase()
        .from('reminders')
        .select('*')
        .eq('notification_sent', false)
        .eq('is_dismissed', false)
        .lte('scheduled_time', new Date(Date.now() + 60 * 60 * 1000).toISOString());

      if (error) throw error;
      return data || [];
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




