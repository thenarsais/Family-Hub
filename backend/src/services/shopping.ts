import { query, queryOne } from '../database/connection';

export interface ShoppingItemRow {
  id: string;
  family_id: string;
  name: string;
  checked: boolean;
  added_by_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * FR-087 / T-17: the shared family shopping list.
 *
 * Every method takes the caller's `userId`, resolves their `family_id` from
 * `family_members` (the same resolution announcements/reminders use), and scopes
 * the query to it -- an item id belonging to another family simply matches no
 * row, so toggles and deletes across families are no-ops rather than errors.
 */
class ShoppingService {
  private async familyIdForUser(userId: string): Promise<string | null> {
    const row = await queryOne<{ family_id: string }>(
      `SELECT family_id FROM family_members WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [userId]
    );
    return row?.family_id ?? null;
  }

  /** All items for the caller's family: pending first (add order), checked sink to the bottom. */
  async getItemsForUser(userId: string): Promise<ShoppingItemRow[]> {
    const familyId = await this.familyIdForUser(userId);
    if (!familyId) return [];

    const result = await query<ShoppingItemRow>(
      `SELECT * FROM shopping_items
       WHERE family_id = $1
       ORDER BY checked ASC, created_at ASC`,
      [familyId]
    );
    return result.rows;
  }

  /** Add a line item. Returns null when the caller has no family. */
  async addItem(userId: string, name: string): Promise<ShoppingItemRow | null> {
    const familyId = await this.familyIdForUser(userId);
    if (!familyId) return null;

    return queryOne<ShoppingItemRow>(
      `INSERT INTO shopping_items (family_id, name, added_by_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [familyId, name.trim(), userId]
    );
  }

  /** Set the checked flag explicitly. Returns null when nothing matched (wrong family / bad id). */
  async setChecked(userId: string, itemId: string, checked: boolean): Promise<ShoppingItemRow | null> {
    const familyId = await this.familyIdForUser(userId);
    if (!familyId) return null;

    return queryOne<ShoppingItemRow>(
      `UPDATE shopping_items
       SET checked = $1, updated_at = now()
       WHERE id = $2 AND family_id = $3
       RETURNING *`,
      [checked, itemId, familyId]
    );
  }

  /** Delete one item. Returns false when nothing matched. */
  async removeItem(userId: string, itemId: string): Promise<boolean> {
    const familyId = await this.familyIdForUser(userId);
    if (!familyId) return false;

    const result = await query(
      `DELETE FROM shopping_items WHERE id = $1 AND family_id = $2`,
      [itemId, familyId]
    );
    return result.rowCount > 0;
  }

  /** Clear every checked item for the family. Returns the number removed. */
  async clearChecked(userId: string): Promise<number> {
    const familyId = await this.familyIdForUser(userId);
    if (!familyId) return 0;

    const result = await query(
      `DELETE FROM shopping_items WHERE family_id = $1 AND checked = true`,
      [familyId]
    );
    return result.rowCount;
  }
}

let instance: ShoppingService | null = null;
export function getShoppingService(): ShoppingService {
  if (!instance) instance = new ShoppingService();
  return instance;
}

export { ShoppingService };
