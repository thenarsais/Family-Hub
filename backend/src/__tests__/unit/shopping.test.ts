import { getShoppingService } from '../../services/shopping';
import * as connection from '../../database/connection';

jest.mock('../../database/connection');

const service = getShoppingService();
const queryOne = connection.queryOne as jest.Mock;
const query = connection.query as jest.Mock;

const FAMILY = { family_id: 'fam-1' };

describe('ShoppingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getItemsForUser', () => {
    it('returns [] when the user has no family', async () => {
      queryOne.mockResolvedValueOnce(null);

      expect(await service.getItemsForUser('user-1')).toEqual([]);
      expect(query).not.toHaveBeenCalled();
    });

    it('scopes the SELECT to the resolved family_id', async () => {
      queryOne.mockResolvedValueOnce(FAMILY);
      query.mockResolvedValueOnce({ rows: [{ id: 'i1', name: 'Milk' }], rowCount: 1 });

      const rows = await service.getItemsForUser('user-1');

      expect(rows).toEqual([{ id: 'i1', name: 'Milk' }]);
      expect(query.mock.calls[0][1]).toEqual(['fam-1']);
    });
  });

  describe('addItem', () => {
    it('returns null when the user has no family', async () => {
      queryOne.mockResolvedValueOnce(null);

      expect(await service.addItem('user-1', 'Eggs')).toBeNull();
    });

    it('inserts a trimmed name tagged with the user id and family id', async () => {
      queryOne.mockResolvedValueOnce(FAMILY).mockResolvedValueOnce({ id: 'i2', name: 'Eggs' });

      const created = await service.addItem('user-1', '  Eggs  ');

      expect(created).toEqual({ id: 'i2', name: 'Eggs' });
      expect(queryOne.mock.calls[1][1]).toEqual(['fam-1', 'Eggs', 'user-1']);
    });
  });

  describe('setChecked', () => {
    it('updates only within the caller family and returns the row', async () => {
      queryOne.mockResolvedValueOnce(FAMILY).mockResolvedValueOnce({ id: 'i1', checked: true });

      const row = await service.setChecked('user-1', 'i1', true);

      expect(row).toEqual({ id: 'i1', checked: true });
      expect(queryOne.mock.calls[1][1]).toEqual([true, 'i1', 'fam-1']);
    });

    it('returns null when the user has no family', async () => {
      queryOne.mockResolvedValueOnce(null);
      expect(await service.setChecked('user-1', 'i1', true)).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('is true when a row was deleted', async () => {
      queryOne.mockResolvedValueOnce(FAMILY);
      query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      expect(await service.removeItem('user-1', 'i1')).toBe(true);
      expect(query.mock.calls[0][1]).toEqual(['i1', 'fam-1']);
    });

    it('is false when nothing matched', async () => {
      queryOne.mockResolvedValueOnce(FAMILY);
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      expect(await service.removeItem('user-1', 'i1')).toBe(false);
    });
  });

  describe('clearChecked', () => {
    it('returns the number of rows removed', async () => {
      queryOne.mockResolvedValueOnce(FAMILY);
      query.mockResolvedValueOnce({ rows: [], rowCount: 4 });

      expect(await service.clearChecked('user-1')).toBe(4);
      expect(query.mock.calls[0][1]).toEqual(['fam-1']);
    });

    it('returns 0 when the user has no family', async () => {
      queryOne.mockResolvedValueOnce(null);
      expect(await service.clearChecked('user-1')).toBe(0);
    });
  });
});
