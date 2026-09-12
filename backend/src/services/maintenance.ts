import { query, queryOne } from '../database/connection';

/**
 * Home maintenance tracker (T-15 / FR-078 + FR-080-core + FR-081). A
 * user-definable list of recurring items -- a name, an interval in days, and
 * a last-done date. "Next due" is always computed (last_done_at +
 * interval_days), never stored; "mark done" just resets last_done_at to
 * today, which reschedules for free. Family-wide like the shopping list --
 * no role gate, no points, any signed-in member can manage it.
 */

export interface MaintenanceItem {
  id: string;
  name: string;
  intervalDays: number;
  lastDoneAt: string;
  nextDueAt: string;
  daysUntilDue: number;
}

interface ItemRow {
  id: string;
  name: string;
  interval_days: number;
  last_done_at: string;
  next_due_at: string;
  days_until_due: number;
  family_id?: string;
}

const UPDATABLE_COLUMNS = ['name', 'interval_days', 'last_done_at'];

// last_done_at/next_due_at are DATE columns -- ::text-cast to sidestep
// node-pg's ambiguous default date parsing (see the timezone-bug lesson).
const SELECT_COLUMNS = `
  id, name, interval_days,
  last_done_at::text AS last_done_at,
  (last_done_at + (interval_days || ' days')::interval)::date::text AS next_due_at,
  ((last_done_at + (interval_days || ' days')::interval)::date - CURRENT_DATE) AS days_until_due
`;

function mapItem(row: ItemRow): MaintenanceItem {
  return {
    id: row.id,
    name: row.name,
    intervalDays: row.interval_days,
    lastDoneAt: row.last_done_at,
    nextDueAt: row.next_due_at,
    daysUntilDue: row.days_until_due,
  };
}

export class MaintenanceService {
  private async familyId(userId: string): Promise<string | null> {
    const row = await queryOne<{ family_id: string }>(
      `SELECT family_id FROM family_members WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [userId],
    );
    return row?.family_id ?? null;
  }

  /** Every item for the viewer's family, soonest-due first. */
  async getItems(viewerId: string): Promise<MaintenanceItem[]> {
    const fid = await this.familyId(viewerId);
    if (!fid) return [];
    const { rows } = await query<ItemRow>(
      `SELECT ${SELECT_COLUMNS} FROM maintenance_items WHERE family_id = $1 ORDER BY next_due_at ASC`,
      [fid],
    );
    return rows.map(mapItem);
  }

  async createItem(
    callerId: string,
    input: { name: string; intervalDays: number; lastDoneAt?: string },
  ): Promise<MaintenanceItem> {
    const familyId = await this.familyId(callerId);
    if (!familyId) throw new Error('no-family');

    const row = await queryOne<ItemRow>(
      `INSERT INTO maintenance_items (family_id, name, interval_days, last_done_at, created_by)
       VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5)
       RETURNING ${SELECT_COLUMNS}`,
      [familyId, input.name, input.intervalDays, input.lastDoneAt ?? null, callerId],
    );
    if (!row) throw new Error('Failed to add maintenance item');
    return mapItem(row);
  }

  /** Reschedules from today -- the whole "completion" mechanic. */
  async markDone(callerId: string, itemId: string): Promise<MaintenanceItem | null> {
    if (!(await this.ownsItem(callerId, itemId))) return null;
    const row = await queryOne<ItemRow>(
      `UPDATE maintenance_items SET last_done_at = CURRENT_DATE, updated_at = now()
       WHERE id = $1
       RETURNING ${SELECT_COLUMNS}`,
      [itemId],
    );
    return row ? mapItem(row) : null;
  }

  async updateItem(
    callerId: string,
    itemId: string,
    updates: Record<string, unknown>,
  ): Promise<MaintenanceItem | null> {
    if (!(await this.ownsItem(callerId, itemId))) return null;

    const columns = Object.keys(updates || {}).filter((k) => UPDATABLE_COLUMNS.includes(k));
    if (columns.length === 0) {
      const row = await queryOne<ItemRow>(
        `SELECT ${SELECT_COLUMNS} FROM maintenance_items WHERE id = $1`,
        [itemId],
      );
      return row ? mapItem(row) : null;
    }

    const setClauses = columns.map((col, i) => `${col} = $${i + 2}`);
    const values = columns.map((col) => updates[col]);
    const row = await queryOne<ItemRow>(
      `UPDATE maintenance_items SET ${setClauses.join(', ')}, updated_at = now()
       WHERE id = $1
       RETURNING ${SELECT_COLUMNS}`,
      [itemId, ...values],
    );
    return row ? mapItem(row) : null;
  }

  async deleteItem(callerId: string, itemId: string): Promise<boolean> {
    if (!(await this.ownsItem(callerId, itemId))) return false;
    await query(`DELETE FROM maintenance_items WHERE id = $1`, [itemId]);
    return true;
  }

  /** The caller must share a family with whichever family owns this item. */
  private async ownsItem(callerId: string, itemId: string): Promise<boolean> {
    const item = await queryOne<{ family_id: string }>(
      `SELECT family_id FROM maintenance_items WHERE id = $1`,
      [itemId],
    );
    if (!item) return false;
    const callerFamily = await this.familyId(callerId);
    return !!callerFamily && callerFamily === item.family_id;
  }
}

let maintenanceService: MaintenanceService | null = null;

export function getMaintenanceService(): MaintenanceService {
  if (!maintenanceService) {
    maintenanceService = new MaintenanceService();
  }
  return maintenanceService;
}
