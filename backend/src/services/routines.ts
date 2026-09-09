import { query, queryOne } from '../database/connection';

export type RoutineSlot = 'morning' | 'evening';

export interface Routine {
  id: string;
  userId: string;
  slot: RoutineSlot;
  label: string;
  emoji: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** A routine plus whether it's been ticked off for the child's family-local today. */
export interface RoutineWithStatus extends Routine {
  doneToday: boolean;
}

/** `board` (default) = the enabled checklist; `manage` = every item incl. hidden. */
export type RoutineScope = 'board' | 'manage';

interface RoutineRow {
  id: string;
  user_id: string;
  slot: RoutineSlot;
  label: string;
  emoji: string;
  sort_order: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// PATCH passes req.body through with only this column whitelist.
const UPDATABLE_COLUMNS = ['slot', 'label', 'emoji', 'sort_order', 'enabled'];

export class RoutineService {
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

  /**
   * True when `caller` may act for `target`: the caller is `target`, OR the
   * caller is an active parent/admin and `target` is an active member of the
   * caller's family.
   */
  async isParentActingFor(callerId: string, targetId: string): Promise<boolean> {
    if (callerId === targetId) return true;
    const row = await queryOne<{ ok: number }>(
      `SELECT 1 AS ok
       FROM family_members caller
       JOIN family_members target ON target.family_id = caller.family_id
       WHERE caller.user_id = $1 AND caller.is_active = true
         AND caller.role IN ('parent', 'admin')
         AND target.user_id = $2 AND target.is_active = true
       LIMIT 1`,
      [callerId, targetId],
    );
    return !!row;
  }

  /** Whether `caller` is an active parent/admin in any family. */
  private async isParent(callerId: string): Promise<boolean> {
    const row = await queryOne<{ ok: number }>(
      `SELECT 1 AS ok FROM family_members
       WHERE user_id = $1 AND is_active = true AND role IN ('parent', 'admin') LIMIT 1`,
      [callerId],
    );
    return !!row;
  }

  /**
   * The child's routines + today's tick state. `scope='board'` (default) returns
   * only enabled items (the checklist); `scope='manage'` returns every item so a
   * parent can re-show a hidden one. Gated by isParentActingFor.
   */
  async getRoutines(
    callerId: string,
    targetId: string,
    scope: RoutineScope = 'board',
  ): Promise<RoutineWithStatus[]> {
    if (!(await this.isParentActingFor(callerId, targetId))) throw new Error('not-allowed');
    const tz = await this.familyTz(targetId);
    const enabledClause = scope === 'manage' ? '' : ' AND r.enabled = true';
    const rows = await query<RoutineRow & { done_id: string | null }>(
      `SELECT r.id, r.user_id, r.slot, r.label, r.emoji, r.sort_order, r.enabled,
              r.created_at, r.updated_at,
              comp.id AS done_id
       FROM routines r
       LEFT JOIN LATERAL (
         SELECT id FROM routine_completions
         WHERE routine_id = r.id AND done_on = (now() AT TIME ZONE $2)::date
         LIMIT 1
       ) comp ON true
       WHERE r.user_id = $1${enabledClause}
       ORDER BY r.slot, r.sort_order, r.label`,
      [targetId, tz],
    );
    return rows.rows.map((r) => ({ ...this.mapRoutine(r), doneToday: !!r.done_id }));
  }

  /** Tick a routine off for today (idempotent). */
  async completeRoutine(callerId: string, routineId: string, targetId: string): Promise<void> {
    const routine = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM routines WHERE id = $1`,
      [routineId],
    );
    if (!routine || routine.user_id !== targetId) throw new Error('not-found');
    if (!(await this.isParentActingFor(callerId, targetId))) throw new Error('not-allowed');
    const tz = await this.familyTz(targetId);
    await query(
      `INSERT INTO routine_completions (routine_id, user_id, done_on)
       VALUES ($1, $2, (now() AT TIME ZONE $3)::date)
       ON CONFLICT (routine_id, done_on) DO NOTHING`,
      [routineId, targetId, tz],
    );
  }

  /** Un-tick today's completion. Returns whether a row was removed. */
  async undoRoutine(callerId: string, routineId: string, targetId: string): Promise<boolean> {
    const routine = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM routines WHERE id = $1`,
      [routineId],
    );
    if (!routine || routine.user_id !== targetId) throw new Error('not-found');
    if (!(await this.isParentActingFor(callerId, targetId))) throw new Error('not-allowed');
    const tz = await this.familyTz(targetId);
    const removed = await queryOne<{ id: string }>(
      `DELETE FROM routine_completions
       WHERE routine_id = $1 AND done_on = (now() AT TIME ZONE $2)::date
       RETURNING id`,
      [routineId, tz],
    );
    return !!removed;
  }

  /** Add a routine item to the child's list. Parent only (not the child themselves). */
  async createRoutine(
    callerId: string,
    targetId: string,
    data: { slot: RoutineSlot; label: string; emoji: string; sortOrder?: number },
  ): Promise<Routine> {
    if (callerId === targetId || !(await this.isParent(callerId))) throw new Error('not-allowed');
    if (!(await this.isParentActingFor(callerId, targetId))) throw new Error('not-allowed');
    const result = await queryOne<RoutineRow>(
      `INSERT INTO routines (user_id, slot, label, emoji, sort_order, enabled)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, user_id, slot, label, emoji, sort_order, enabled, created_at, updated_at`,
      [targetId, data.slot, data.label.trim(), data.emoji, data.sortOrder ?? 0],
    );
    if (!result) throw new Error('Failed to create routine');
    return this.mapRoutine(result);
  }

  /** Edit a routine's whitelisted fields. Parent only. Null when nothing matched. */
  async updateRoutine(
    callerId: string,
    routineId: string,
    updates: Record<string, unknown>,
  ): Promise<Routine | null> {
    const routine = await queryOne<RoutineRow>(`SELECT * FROM routines WHERE id = $1`, [routineId]);
    if (!routine) return null;
    if (!(await this.isParent(callerId)) || !(await this.isParentActingFor(callerId, routine.user_id))) {
      return null;
    }
    const columns = Object.keys(updates || {}).filter((k) => UPDATABLE_COLUMNS.includes(k));
    if (columns.length === 0) return this.mapRoutine(routine);
    const setClauses = columns.map((col, i) => `${col} = $${i + 2}`);
    const values = columns.map((col) => updates[col]);
    const updated = await queryOne<RoutineRow>(
      `UPDATE routines SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, user_id, slot, label, emoji, sort_order, enabled, created_at, updated_at`,
      [routineId, ...values],
    );
    return updated ? this.mapRoutine(updated) : null;
  }

  private mapRoutine(row: RoutineRow): Routine {
    return {
      id: row.id,
      userId: row.user_id,
      slot: row.slot,
      label: row.label,
      emoji: row.emoji,
      sortOrder: row.sort_order,
      enabled: row.enabled,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

let routineService: RoutineService | null = null;

export function getRoutineService(): RoutineService {
  if (!routineService) routineService = new RoutineService();
  return routineService;
}
