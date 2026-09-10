import { query, queryOne } from '../database/connection';
import * as PointsRepository from '../database/repositories/PointsRepository';

/**
 * Homework tracker (FR-024 / T-20). Unlike chores/habits these items are dated
 * and one-shot: there is no completions table and no daily reset. `completed_at`
 * / `points_earned` live on the row. `user_id` is the assignee ("whose
 * homework"); family scoping is derived through `family_members` at read time.
 * Points are flat (`points_value`, parent-set, default 10) — NO streak
 * multiplier, unlike chores/habits.
 */

export interface HomeworkItem {
  id: string;
  userId: string;
  createdBy?: string;
  title: string;
  subject?: string;
  /** 'YYYY-MM-DD'. */
  dueDate: string;
  pointsValue: number;
  completedAt?: string | null;
  pointsEarned?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/** A homework item plus the derived state the board and manage panel render. */
export interface HomeworkItemWithStatus extends HomeworkItem {
  assigneeName?: string;
  addedByName?: string;
  /** completedAt == null && dueDate is before the family-local today. */
  isOverdue: boolean;
  /** completedAt != null. */
  completed: boolean;
}

export interface NewHomework {
  title: string;
  dueDate: string;
  subject?: string;
  pointsValue?: number;
  /** Defaults to the caller. Any active family member is allowed. */
  assigneeId?: string;
}

interface HomeworkRow {
  id: string;
  user_id: string;
  created_by: string | null;
  title: string;
  subject: string | null;
  due_date: string; // selected as ::text — always 'YYYY-MM-DD'
  points_value: number;
  completed_at: string | null;
  points_earned: number | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_POINTS = 10;

// DATE is selected as ::text so it never depends on the pg driver's Date parsing.
const COLS = `id, user_id, created_by, title, subject, due_date::text AS due_date,
              points_value, completed_at, points_earned, created_at, updated_at`;

// PATCH /api/homework/:id passes req.body through with only this column whitelist.
const UPDATABLE_COLUMNS = ['title', 'subject', 'due_date', 'points_value'];

/** True for a real calendar date in 'YYYY-MM-DD' form. */
function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export class HomeworkService {
  /** The caller's active family id, or null when they aren't in one. */
  private async familyId(userId: string): Promise<string | null> {
    const row = await queryOne<{ family_id: string }>(
      `SELECT family_id FROM family_members WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [userId],
    );
    return row?.family_id ?? null;
  }

  /** The family's timezone for the due-date / overdue boundary. */
  private async familyTz(userId: string): Promise<string> {
    const row = await queryOne<{ timezone: string | null }>(
      `SELECT fs.timezone
       FROM family_members fm
       LEFT JOIN family_settings fs ON fs.family_id = fm.family_id
       WHERE fm.user_id = $1 AND fm.is_active = true
       LIMIT 1`,
      [userId],
    );
    return row?.timezone || 'America/Denver';
  }

  /** Whether `other` is an active member of `caller`'s family (true for self). */
  private async sharesFamily(caller: string, other: string): Promise<boolean> {
    if (caller === other) return true;
    const fid = await this.familyId(caller);
    if (!fid) return false;
    const row = await queryOne<{ ok: number }>(
      `SELECT 1 AS ok FROM family_members
       WHERE user_id = $1 AND family_id = $2 AND is_active = true LIMIT 1`,
      [other, fid],
    );
    return !!row;
  }

  /**
   * Create a homework item. `assigneeId` (default: the caller) is stored as
   * user_id. Throws 'bad-assignee' when it isn't a family member, 'bad-due-date'
   * when `dueDate` isn't a real YYYY-MM-DD.
   */
  async createItem(creatorId: string, input: NewHomework): Promise<HomeworkItem> {
    const assignee = input.assigneeId ?? creatorId;
    if (assignee !== creatorId && !(await this.sharesFamily(creatorId, assignee))) {
      throw new Error('bad-assignee');
    }
    if (!isIsoDate(input.dueDate)) throw new Error('bad-due-date');

    const points =
      typeof input.pointsValue === 'number' && input.pointsValue >= 1
        ? Math.floor(input.pointsValue)
        : DEFAULT_POINTS;

    const result = await queryOne<HomeworkRow>(
      `INSERT INTO homework_items (user_id, created_by, title, subject, due_date, points_value)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLS}`,
      [assignee, creatorId, input.title, input.subject || null, input.dueDate, points],
    );
    if (!result) throw new Error('Failed to create homework item');
    return this.mapItem(result);
  }

  /**
   * Edit an item's whitelisted fields. The caller must share a family with the
   * item's assignee. Returns the updated item, or null when nothing matched.
   */
  async updateItem(
    callerId: string,
    id: string,
    updates: Record<string, unknown>,
  ): Promise<HomeworkItem | null> {
    const row = await queryOne<HomeworkRow>(
      `SELECT ${COLS} FROM homework_items WHERE id = $1`,
      [id],
    );
    if (!row || !(await this.sharesFamily(callerId, row.user_id))) return null;

    if (updates.due_date !== undefined && !isIsoDate(updates.due_date)) {
      throw new Error('bad-due-date');
    }
    if (
      updates.points_value !== undefined &&
      (typeof updates.points_value !== 'number' ||
        !Number.isFinite(updates.points_value) ||
        updates.points_value < 1)
    ) {
      throw new Error('bad-points');
    }

    const columns = Object.keys(updates || {}).filter((k) => UPDATABLE_COLUMNS.includes(k));
    if (columns.length === 0) return this.mapItem(row);

    const setClauses = columns.map((col, i) => `${col} = $${i + 2}`);
    const values = columns.map((col) => updates[col]);
    const updated = await queryOne<HomeworkRow>(
      `UPDATE homework_items SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING ${COLS}`,
      [id, ...values],
    );
    return updated ? this.mapItem(updated) : null;
  }

  /**
   * Delete an item. The caller must share a family with the assignee. If the
   * item was completed its points award is reversed first. Returns false when
   * nothing matched.
   */
  async deleteItem(callerId: string, id: string): Promise<boolean> {
    const row = await queryOne<HomeworkRow>(
      `SELECT ${COLS} FROM homework_items WHERE id = $1`,
      [id],
    );
    if (!row || !(await this.sharesFamily(callerId, row.user_id))) return false;

    if (row.completed_at) {
      await PointsRepository.removePoints(row.user_id, 'homework', `Homework: ${id}`);
    }
    await query(`DELETE FROM homework_items WHERE id = $1`, [id]);
    return true;
  }

  /**
   * The board view.
   * - `mine`: the caller's items that are still open and due within the next 7
   *   family-local days OR overdue, plus anything completed today (so the client
   *   can offer "undo").
   * - `family`: every family member's items that are still open or were due in
   *   the last 30 days — the parent Manage panel.
   */
  async getItems(
    viewerId: string,
    scope: 'mine' | 'family' = 'mine',
  ): Promise<HomeworkItemWithStatus[]> {
    const tz = await this.familyTz(viewerId);

    let whereClause: string;
    let params: unknown[];

    if (scope === 'family') {
      const fid = await this.familyId(viewerId);
      if (!fid) return [];
      whereClause = `h.user_id IN (
        SELECT user_id FROM family_members WHERE family_id = $2 AND is_active = true
      ) AND (
        h.completed_at IS NULL
        OR h.due_date >= (now() AT TIME ZONE $1)::date - 30
      )`;
      params = [tz, fid];
    } else {
      whereClause = `h.user_id = $2 AND (
        (h.completed_at IS NULL AND h.due_date <= (now() AT TIME ZONE $1)::date + 7)
        OR (h.completed_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date
      )`;
      params = [tz, viewerId];
    }

    const rows = await query<
      HomeworkRow & {
        assignee_name: string | null;
        added_by_name: string | null;
        is_overdue: boolean;
      }
    >(
      `SELECT h.id, h.user_id, h.created_by, h.title, h.subject,
              h.due_date::text AS due_date, h.points_value, h.completed_at,
              h.points_earned, h.created_at, h.updated_at,
              u.name  AS assignee_name,
              cb.name AS added_by_name,
              (h.completed_at IS NULL AND h.due_date < (now() AT TIME ZONE $1)::date) AS is_overdue
       FROM homework_items h
       LEFT JOIN users u  ON u.id  = h.user_id
       LEFT JOIN users cb ON cb.id = h.created_by
       WHERE ${whereClause}
       ORDER BY h.completed_at NULLS FIRST, h.due_date, h.subject NULLS LAST, h.title`,
      params,
    );

    return rows.rows.map((r) => ({
      ...this.mapItem(r),
      assigneeName: r.assignee_name ?? undefined,
      addedByName: r.added_by_name ?? undefined,
      completed: !!r.completed_at,
      isOverdue: !!r.is_overdue,
    }));
  }

  /**
   * Complete one of the caller's own items and award its (flat) points. Throws
   * 'not-found' / 'already-completed'.
   */
  async completeItem(userId: string, id: string): Promise<{ pointsEarned: number }> {
    const row = await queryOne<{ points_value: number; completed_at: string | null }>(
      `SELECT points_value, completed_at FROM homework_items WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    if (!row) throw new Error('not-found');
    if (row.completed_at) throw new Error('already-completed');

    await query(
      `UPDATE homework_items
       SET completed_at = now(), points_earned = points_value, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id],
    );

    // The one real points ledger (activity_points). Flat — no streak multiplier.
    await PointsRepository.addPoints(userId, row.points_value, 'homework', `Homework: ${id}`);
    return { pointsEarned: row.points_value };
  }

  /**
   * Undo the completion of one of the caller's own items — clears it and
   * reverses the points. Allowed any time while the item is completed (kinder
   * than the chores same-day rule for dated work). Returns false when there was
   * nothing to undo.
   */
  async uncompleteItem(userId: string, id: string): Promise<boolean> {
    const cleared = await queryOne<{ id: string }>(
      `UPDATE homework_items
       SET completed_at = NULL, points_earned = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND completed_at IS NOT NULL
       RETURNING id`,
      [id, userId],
    );
    if (!cleared) return false;

    await PointsRepository.removePoints(userId, 'homework', `Homework: ${id}`);
    return true;
  }

  private mapItem(row: HomeworkRow): HomeworkItem {
    return {
      id: row.id,
      userId: row.user_id,
      createdBy: row.created_by ?? undefined,
      title: row.title,
      subject: row.subject ?? undefined,
      dueDate: String(row.due_date).slice(0, 10),
      pointsValue: row.points_value,
      completedAt: row.completed_at,
      pointsEarned: row.points_earned,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

let homeworkService: HomeworkService | null = null;

export function getHomeworkService(): HomeworkService {
  if (!homeworkService) {
    homeworkService = new HomeworkService();
  }
  return homeworkService;
}
