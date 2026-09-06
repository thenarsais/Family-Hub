import { query, queryOne } from '../database/connection';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface MealPlanRow {
  id: string;
  family_id: string;
  plan_date: string; // 'YYYY-MM-DD'
  slot: MealSlot;
  text: string;
  updated_by_id: string | null;
  created_at: string;
  updated_at: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const isValidDate = (s: unknown): s is string => typeof s === 'string' && DATE_RE.test(s);
export const isValidSlot = (s: unknown): s is MealSlot => MEAL_SLOTS.includes(s as MealSlot);

/**
 * FR-015 / FR-089: the family meal planner.
 *
 * Every method resolves the caller's `family_id` (same lookup as
 * announcements/reminders/shopping) and scopes to it, so a date/slot from
 * another family simply matches nothing.
 */
class MealPlanService {
  private async familyIdForUser(userId: string): Promise<string | null> {
    const row = await queryOne<{ family_id: string }>(
      `SELECT family_id FROM family_members WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [userId]
    );
    return row?.family_id ?? null;
  }

  /** All slot rows for the family between two ISO dates, inclusive. */
  async getRange(userId: string, start: string, end: string): Promise<MealPlanRow[]> {
    const familyId = await this.familyIdForUser(userId);
    if (!familyId) return [];

    const result = await query<MealPlanRow>(
      `SELECT id, family_id, to_char(plan_date, 'YYYY-MM-DD') AS plan_date, slot, text,
              updated_by_id, created_at, updated_at
       FROM meal_plans
       WHERE family_id = $1 AND plan_date BETWEEN $2 AND $3
       ORDER BY plan_date ASC, slot ASC`,
      [familyId, start, end]
    );
    return result.rows;
  }

  /**
   * Upsert one slot. A blank `text` clears the slot (deletes the row) and
   * resolves to null. Returns null when the caller has no family.
   */
  async setSlot(
    userId: string,
    date: string,
    slot: MealSlot,
    text: string
  ): Promise<MealPlanRow | null> {
    const familyId = await this.familyIdForUser(userId);
    if (!familyId) return null;

    const trimmed = text.trim();
    if (!trimmed) {
      await this.clearSlot(userId, date, slot);
      return null;
    }

    return queryOne<MealPlanRow>(
      `INSERT INTO meal_plans (family_id, plan_date, slot, text, updated_by_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (family_id, plan_date, slot)
       DO UPDATE SET text = EXCLUDED.text, updated_by_id = EXCLUDED.updated_by_id, updated_at = now()
       RETURNING id, family_id, to_char(plan_date, 'YYYY-MM-DD') AS plan_date, slot, text,
                 updated_by_id, created_at, updated_at`,
      [familyId, date, slot, trimmed, userId]
    );
  }

  /** Clear one slot. Returns true when a row was removed. */
  async clearSlot(userId: string, date: string, slot: MealSlot): Promise<boolean> {
    const familyId = await this.familyIdForUser(userId);
    if (!familyId) return false;

    const result = await query(
      `DELETE FROM meal_plans WHERE family_id = $1 AND plan_date = $2 AND slot = $3`,
      [familyId, date, slot]
    );
    return result.rowCount > 0;
  }
}

let instance: MealPlanService | null = null;
export function getMealPlanService(): MealPlanService {
  if (!instance) instance = new MealPlanService();
  return instance;
}

export { MealPlanService };
