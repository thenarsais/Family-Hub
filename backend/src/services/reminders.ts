import { query, queryOne } from '../database/connection';
import type { Database } from '../types/database';
import { isRecurring, nextOccurrence, type Recurrence } from './recurrence';

export type Reminder = Database['public']['Tables']['reminders']['Row'];
export type ReminderInsert = Database['public']['Tables']['reminders']['Insert'];

/** A reminder plus the assignee's display name, for the family-scoped views. */
export interface ReminderWithAssignee extends Reminder {
  assignee_name: string | null;
}

// PATCH /api/reminders/:id passes req.body straight through -- this whitelist is
// what stands between an arbitrary body and a raw SQL UPDATE.
const UPDATABLE_REMINDER_COLUMNS = [
  'title', 'description', 'reminder_type', 'related_item_id', 'related_item_type',
  'scheduled_time', 'remind_before_minutes', 'recurrence', 'recurrence_end_date',
];

const SELECT_WITH_ASSIGNEE = `
  SELECT r.*, u.name AS assignee_name
  FROM reminders r
  LEFT JOIN users u ON u.id = r.user_id
`;

interface FamilyContext {
  familyId: string;
  tz: string;
}

class ReminderService {
  /** The caller's family id + timezone (defaults to America/New_York). */
  private async familyContext(userId: string): Promise<FamilyContext | null> {
    const row = await queryOne<{ family_id: string; timezone: string | null }>(
      `SELECT fm.family_id, fs.timezone
       FROM family_members fm
       LEFT JOIN family_settings fs ON fs.family_id = fm.family_id
       WHERE fm.user_id = $1 AND fm.is_active = true
       LIMIT 1`,
      [userId],
    );
    if (!row) return null;
    return { familyId: row.family_id, tz: row.timezone || 'America/New_York' };
  }

  /**
   * Roll every stale recurring reminder in the family forward to its next
   * occurrence (there is no job runner). Compare-and-swaps on scheduled_time so
   * two concurrent reads can't double-advance the same row. A series that has
   * passed its recurrence_end_date is dismissed instead.
   */
  private async rollStale(ctx: FamilyContext): Promise<void> {
    const now = new Date();
    const stale = await query<Reminder>(
      `SELECT * FROM reminders
       WHERE family_id = $1 AND is_dismissed = false
         AND recurrence IN ('daily','weekly','monthly')
         AND scheduled_time < $2`,
      [ctx.familyId, now.toISOString()],
    );

    for (const r of stale.rows) {
      const base = new Date(r.scheduled_time as unknown as string);
      const next = nextOccurrence(
        base,
        r.recurrence as Recurrence,
        ctx.tz,
        now,
        r.recurrence_end_date ?? null,
      );
      if (next) {
        await query(
          `UPDATE reminders
           SET scheduled_time = $1, is_dismissed = false, dismissed_at = NULL,
               notification_sent = false, sent_at = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND scheduled_time = $3`,
          [next.toISOString(), r.id, r.scheduled_time],
        );
      } else {
        await query(
          `UPDATE reminders
           SET is_dismissed = true, dismissed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND scheduled_time = $2`,
          [r.id, r.scheduled_time],
        );
      }
    }
  }

  // ---------------- reads (family-scoped) ----------------

  async getRemindersForUser(
    userId: string,
    filter: 'pending' | 'dismissed' | 'all' = 'all',
  ): Promise<ReminderWithAssignee[]> {
    const ctx = await this.familyContext(userId);
    if (!ctx) return [];
    await this.rollStale(ctx);

    const conditions = ['r.family_id = $1'];
    if (filter === 'pending') conditions.push('r.is_dismissed = false');
    else if (filter === 'dismissed') conditions.push('r.is_dismissed = true');

    const result = await query<ReminderWithAssignee>(
      `${SELECT_WITH_ASSIGNEE} WHERE ${conditions.join(' AND ')} ORDER BY r.scheduled_time ASC`,
      [ctx.familyId],
    );
    return result.rows;
  }

  /** Not dismissed, due within the next 24h. */
  async getUpcomingReminders(userId: string): Promise<ReminderWithAssignee[]> {
    const ctx = await this.familyContext(userId);
    if (!ctx) return [];
    await this.rollStale(ctx);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const result = await query<ReminderWithAssignee>(
      `${SELECT_WITH_ASSIGNEE}
       WHERE r.family_id = $1 AND r.is_dismissed = false
         AND r.scheduled_time >= $2 AND r.scheduled_time <= $3
       ORDER BY r.scheduled_time ASC`,
      [ctx.familyId, now.toISOString(), tomorrow.toISOString()],
    );
    return result.rows;
  }

  /** Not dismissed, scheduled_time is now or in the past — the T-18 "due" surface. */
  async getDueReminders(userId: string): Promise<ReminderWithAssignee[]> {
    const ctx = await this.familyContext(userId);
    if (!ctx) return [];
    await this.rollStale(ctx);

    const result = await query<ReminderWithAssignee>(
      `${SELECT_WITH_ASSIGNEE}
       WHERE r.family_id = $1 AND r.is_dismissed = false AND r.scheduled_time <= $2
       ORDER BY r.scheduled_time ASC`,
      [ctx.familyId, new Date().toISOString()],
    );
    return result.rows;
  }

  // ---------------- writes (family-scoped) ----------------

  /**
   * Create a reminder. `assigneeUserId` (default: the caller) is stored as
   * user_id — "whose reminder". Returns null when the caller has no family, or
   * when the assignee is not a member of it.
   */
  async createReminder(
    creatorId: string,
    data: {
      title: string;
      description?: string;
      reminder_type?: string;
      assignee_user_id?: string;
      scheduled_time: string;
      recurrence?: Recurrence;
      recurrence_end_date?: string;
    },
  ): Promise<ReminderWithAssignee | null | 'bad-assignee'> {
    const ctx = await this.familyContext(creatorId);
    if (!ctx) return null;

    const assignee = data.assignee_user_id ?? creatorId;
    if (assignee !== creatorId) {
      const member = await queryOne<{ ok: number }>(
        `SELECT 1 AS ok FROM family_members
         WHERE user_id = $1 AND family_id = $2 AND is_active = true LIMIT 1`,
        [assignee, ctx.familyId],
      );
      if (!member) return 'bad-assignee';
    }

    const created = await queryOne<{ id: string }>(
      `INSERT INTO reminders
         (user_id, family_id, title, description, reminder_type, scheduled_time,
          recurrence, recurrence_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        assignee,
        ctx.familyId,
        data.title.trim(),
        data.description?.trim() || null,
        data.reminder_type || 'custom',
        data.scheduled_time,
        isRecurring(data.recurrence) ? data.recurrence : 'once',
        data.recurrence_end_date || null,
      ],
    );
    if (!created) return null;
    return this.getOne(created.id, ctx.familyId);
  }

  private async getOne(id: string, familyId: string): Promise<ReminderWithAssignee | null> {
    return queryOne<ReminderWithAssignee>(
      `${SELECT_WITH_ASSIGNEE} WHERE r.id = $1 AND r.family_id = $2`,
      [id, familyId],
    );
  }

  async updateReminder(
    userId: string,
    id: string,
    updates: Partial<ReminderInsert>,
  ): Promise<ReminderWithAssignee | null> {
    const ctx = await this.familyContext(userId);
    if (!ctx) return null;

    const columns = Object.keys(updates || {}).filter((k) =>
      UPDATABLE_REMINDER_COLUMNS.includes(k),
    ) as (keyof ReminderInsert)[];
    if (columns.length === 0) return this.getOne(id, ctx.familyId);

    const setClauses = columns.map((col, i) => `${col} = $${i + 3}`);
    const values = columns.map((col) => updates[col]);
    const updated = await queryOne<{ id: string }>(
      `UPDATE reminders SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND family_id = $2 RETURNING id`,
      [id, ctx.familyId, ...values],
    );
    return updated ? this.getOne(id, ctx.familyId) : null;
  }

  /**
   * Dismiss. For a recurring reminder this means "done this time" — it rolls
   * forward to the next occurrence rather than ending the series. For a one-off
   * (or a series past its end date) it sets is_dismissed. Returns the resulting
   * row, or null when nothing matched.
   */
  async dismissReminder(userId: string, id: string): Promise<ReminderWithAssignee | null> {
    const ctx = await this.familyContext(userId);
    if (!ctx) return null;

    const r = await this.getOne(id, ctx.familyId);
    if (!r) return null;

    if (isRecurring(r.recurrence)) {
      const next = nextOccurrence(
        new Date(r.scheduled_time as unknown as string),
        r.recurrence as Recurrence,
        ctx.tz,
        new Date(),
        r.recurrence_end_date ?? null,
      );
      if (next) {
        await query(
          `UPDATE reminders
           SET scheduled_time = $1, is_dismissed = false, dismissed_at = NULL,
               notification_sent = false, sent_at = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND family_id = $3`,
          [next.toISOString(), id, ctx.familyId],
        );
        return this.getOne(id, ctx.familyId);
      }
    }

    await query(
      `UPDATE reminders SET is_dismissed = true, dismissed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND family_id = $2`,
      [id, ctx.familyId],
    );
    return this.getOne(id, ctx.familyId);
  }

  /** Un-dismiss a previously dismissed reminder. */
  async restoreReminder(userId: string, id: string): Promise<ReminderWithAssignee | null> {
    const ctx = await this.familyContext(userId);
    if (!ctx) return null;
    const updated = await queryOne<{ id: string }>(
      `UPDATE reminders SET is_dismissed = false, dismissed_at = NULL,
              updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND family_id = $2 RETURNING id`,
      [id, ctx.familyId],
    );
    return updated ? this.getOne(id, ctx.familyId) : null;
  }

  async deleteReminder(userId: string, id: string): Promise<boolean> {
    const ctx = await this.familyContext(userId);
    if (!ctx) return false;
    const result = await query(
      `DELETE FROM reminders WHERE id = $1 AND family_id = $2`,
      [id, ctx.familyId],
    );
    return result.rowCount > 0;
  }
}

let reminderService: ReminderService;
export function getReminderService(): ReminderService {
  if (!reminderService) reminderService = new ReminderService();
  return reminderService;
}

export { ReminderService };
