import { MaintenanceService } from '../../services/maintenance';
import * as connection from '../../database/connection';

jest.mock('../../database/connection');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;

const ROW = {
  id: 'item-1',
  name: 'HVAC air filter',
  interval_days: 90,
  last_done_at: '2026-09-01',
  next_due_at: '2026-11-30',
  days_until_due: 79,
};

describe('MaintenanceService', () => {
  let service: MaintenanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MaintenanceService();
  });

  describe('getItems', () => {
    it("returns an empty list when the viewer has no family", async () => {
      mockQueryOne.mockResolvedValueOnce(null); // familyId
      const items = await service.getItems('nobody');
      expect(items).toEqual([]);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("maps rows for the viewer's family, soonest-due first (via ORDER BY)", async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' });
      mockQuery.mockResolvedValueOnce({ rows: [ROW] });

      const items = await service.getItems('user-1');

      expect(items).toEqual([
        {
          id: 'item-1',
          name: 'HVAC air filter',
          intervalDays: 90,
          lastDoneAt: '2026-09-01',
          nextDueAt: '2026-11-30',
          daysUntilDue: 79,
        },
      ]);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('WHERE family_id = $1');
      expect(sql).toContain('ORDER BY next_due_at ASC');
      expect(params).toEqual(['fam-1']);
    });
  });

  describe('createItem', () => {
    it("adds an item under the caller's family, defaulting last_done_at to today", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId
        .mockResolvedValueOnce(ROW); // INSERT RETURNING

      const item = await service.createItem('parent-1', { name: 'HVAC air filter', intervalDays: 90 });

      expect(item.name).toBe('HVAC air filter');
      expect(item.daysUntilDue).toBe(79);
      const [, params] = mockQueryOne.mock.calls[1];
      expect(params).toEqual(['fam-1', 'HVAC air filter', 90, null, 'parent-1']);
    });

    it('throws no-family when the caller has none', async () => {
      mockQueryOne.mockResolvedValueOnce(null); // familyId
      await expect(
        service.createItem('nobody', { name: 'x', intervalDays: 30 }),
      ).rejects.toThrow('no-family');
    });

    it('passes an explicit lastDoneAt through when given', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' }).mockResolvedValueOnce(ROW);
      await service.createItem('parent-1', { name: 'x', intervalDays: 30, lastDoneAt: '2026-01-01' });
      const [, params] = mockQueryOne.mock.calls[1];
      expect(params).toEqual(['fam-1', 'x', 30, '2026-01-01', 'parent-1']);
    });
  });

  describe('markDone', () => {
    it("resets last_done_at to today when the caller shares the item's family", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // ownsItem: SELECT item
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // ownsItem: familyId(caller)
        .mockResolvedValueOnce({ ...ROW, last_done_at: '2026-09-12', days_until_due: 90 }); // UPDATE RETURNING

      const item = await service.markDone('parent-1', 'item-1');

      expect(item?.lastDoneAt).toBe('2026-09-12');
      const [sql] = mockQueryOne.mock.calls[2];
      expect(sql).toContain('last_done_at = CURRENT_DATE');
    });

    it('returns null for an item in a different family', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // the item's family
        .mockResolvedValueOnce({ family_id: 'fam-2' }); // caller's family
      const item = await service.markDone('outsider', 'item-1');
      expect(item).toBeNull();
    });

    it('returns null for a nonexistent item', async () => {
      mockQueryOne.mockResolvedValueOnce(null); // SELECT item -> not found
      const item = await service.markDone('parent-1', 'ghost');
      expect(item).toBeNull();
    });
  });

  describe('updateItem', () => {
    it('only writes whitelisted columns', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // ownsItem: item
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // ownsItem: caller family
        .mockResolvedValueOnce({ ...ROW, name: 'New name' });

      const item = await service.updateItem('parent-1', 'item-1', {
        name: 'New name',
        not_a_real_column: 'nope',
      });

      expect(item?.name).toBe('New name');
      const [sql, params] = mockQueryOne.mock.calls[2];
      expect(sql).toContain('name = $2');
      expect(sql).not.toContain('not_a_real_column');
      expect(params).toEqual(['item-1', 'New name']);
    });

    it('returns the unchanged item when no whitelisted columns are given', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' })
        .mockResolvedValueOnce({ family_id: 'fam-1' })
        .mockResolvedValueOnce(ROW);

      const item = await service.updateItem('parent-1', 'item-1', {});
      expect(item?.name).toBe('HVAC air filter');
    });

    it('rejects an update for an item outside the caller\'s family', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' }).mockResolvedValueOnce({ family_id: 'fam-2' });
      const item = await service.updateItem('outsider', 'item-1', { name: 'x' });
      expect(item).toBeNull();
    });
  });

  describe('deleteItem', () => {
    it('deletes when the caller shares the family', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' }).mockResolvedValueOnce({ family_id: 'fam-1' });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const ok = await service.deleteItem('parent-1', 'item-1');

      expect(ok).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(`DELETE FROM maintenance_items WHERE id = $1`, ['item-1']);
    });

    it('refuses to delete across families', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' }).mockResolvedValueOnce({ family_id: 'fam-2' });
      const ok = await service.deleteItem('outsider', 'item-1');
      expect(ok).toBe(false);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });
});
