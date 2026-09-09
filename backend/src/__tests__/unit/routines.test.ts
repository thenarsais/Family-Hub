import { RoutineService } from '../../services/routines';
import * as connection from '../../database/connection';

jest.mock('../../database/connection');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;

const ROW = {
  id: 'r-1',
  user_id: 'kid-1',
  slot: 'morning',
  label: 'Brush teeth',
  emoji: '🪥',
  sort_order: 0,
  enabled: true,
  created_at: new Date(),
  updated_at: new Date(),
};

const okRow = { ok: 1 };

describe('RoutineService', () => {
  let service: RoutineService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RoutineService();
  });

  describe('isParentActingFor', () => {
    it('is true for the same user without a query', async () => {
      expect(await service.isParentActingFor('u1', 'u1')).toBe(true);
      expect(mockQueryOne).not.toHaveBeenCalled();
    });

    it('is true for a same-family parent/admin', async () => {
      mockQueryOne.mockResolvedValueOnce(okRow);
      expect(await service.isParentActingFor('parent-1', 'kid-1')).toBe(true);
      const [sql, params] = mockQueryOne.mock.calls[0];
      expect(sql).toContain("caller.role IN ('parent', 'admin')");
      expect(params).toEqual(['parent-1', 'kid-1']);
    });

    it('is false for a stranger', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      expect(await service.isParentActingFor('stranger', 'kid-1')).toBe(false);
    });
  });

  describe('getRoutines', () => {
    it("returns the child's enabled routines with doneToday state", async () => {
      mockQueryOne.mockResolvedValueOnce(okRow); // isParentActingFor
      mockQueryOne.mockResolvedValueOnce({ timezone: 'America/Denver' }); // familyTz
      mockQuery.mockResolvedValueOnce({
        rows: [
          { ...ROW, done_id: 'c-9' },
          { ...ROW, id: 'r-2', slot: 'evening', label: 'Pajamas', done_id: null },
        ],
      });

      const rows = await service.getRoutines('parent-1', 'kid-1');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('r.user_id = $1 AND r.enabled = true');
      expect(sql).toContain('ORDER BY r.slot, r.sort_order, r.label');
      expect(params).toEqual(['kid-1', 'America/Denver']);
      expect(rows[0]).toMatchObject({ id: 'r-1', label: 'Brush teeth', doneToday: true });
      expect(rows[1]).toMatchObject({ id: 'r-2', doneToday: false });
    });

    it("scope 'manage' returns hidden items too", async () => {
      mockQueryOne.mockResolvedValueOnce(okRow); // isParentActingFor
      mockQueryOne.mockResolvedValueOnce({ timezone: 'America/Denver' }); // familyTz
      mockQuery.mockResolvedValueOnce({ rows: [{ ...ROW, enabled: false, done_id: null }] });

      await service.getRoutines('parent-1', 'kid-1', 'manage');

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('WHERE r.user_id = $1');
      expect(sql).not.toContain('r.enabled = true');
    });

    it('throws not-allowed for a caller who may not act for the child', async () => {
      mockQueryOne.mockResolvedValueOnce(null); // isParentActingFor
      await expect(service.getRoutines('nope', 'kid-1')).rejects.toThrow('not-allowed');
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('completeRoutine', () => {
    it('inserts an idempotent completion for the family-local day', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ user_id: 'kid-1' }) // routine lookup
        .mockResolvedValueOnce(okRow) // isParentActingFor
        .mockResolvedValueOnce({ timezone: 'America/Denver' }); // familyTz
      mockQuery.mockResolvedValueOnce({ rows: [] }); // INSERT ... ON CONFLICT

      await service.completeRoutine('parent-1', 'r-1', 'kid-1');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('ON CONFLICT (routine_id, done_on) DO NOTHING');
      expect(params).toEqual(['r-1', 'kid-1', 'America/Denver']);
    });

    it("throws not-found when the routine isn't the child's", async () => {
      mockQueryOne.mockResolvedValueOnce({ user_id: 'someone-else' });
      await expect(service.completeRoutine('parent-1', 'r-1', 'kid-1')).rejects.toThrow('not-found');
    });

    it('throws not-allowed for a caller who may not act for the child', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ user_id: 'kid-1' })
        .mockResolvedValueOnce(null); // isParentActingFor
      await expect(service.completeRoutine('nope', 'r-1', 'kid-1')).rejects.toThrow('not-allowed');
    });
  });

  describe('undoRoutine', () => {
    it("deletes today's completion and reports removal", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ user_id: 'kid-1' }) // routine lookup
        .mockResolvedValueOnce(okRow) // isParentActingFor
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce({ id: 'c-9' }); // DELETE RETURNING

      expect(await service.undoRoutine('parent-1', 'r-1', 'kid-1')).toBe(true);
    });

    it('returns false when nothing was ticked today', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ user_id: 'kid-1' })
        .mockResolvedValueOnce(okRow)
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce(null);
      expect(await service.undoRoutine('parent-1', 'r-1', 'kid-1')).toBe(false);
    });
  });

  describe('createRoutine', () => {
    it('creates a routine for a parent acting for the child', async () => {
      mockQueryOne
        .mockResolvedValueOnce(okRow) // isParent
        .mockResolvedValueOnce(okRow) // isParentActingFor
        .mockResolvedValueOnce(ROW); // INSERT RETURNING

      const r = await service.createRoutine('parent-1', 'kid-1', {
        slot: 'morning',
        label: '  Brush teeth  ',
        emoji: '🪥',
      });

      expect(r).toMatchObject({ id: 'r-1', slot: 'morning', label: 'Brush teeth' });
      expect(mockQueryOne.mock.calls[2][1]).toEqual(['kid-1', 'morning', 'Brush teeth', '🪥', 0]);
    });

    it('throws not-allowed when the caller is the child themselves', async () => {
      await expect(
        service.createRoutine('kid-1', 'kid-1', { slot: 'morning', label: 'x', emoji: '🪥' }),
      ).rejects.toThrow('not-allowed');
    });

    it('throws not-allowed for a non-parent', async () => {
      mockQueryOne.mockResolvedValueOnce(null); // isParent
      await expect(
        service.createRoutine('kid-2', 'kid-1', { slot: 'morning', label: 'x', emoji: '🪥' }),
      ).rejects.toThrow('not-allowed');
    });
  });

  describe('updateRoutine', () => {
    it('writes only whitelisted columns', async () => {
      mockQueryOne
        .mockResolvedValueOnce(ROW) // SELECT the routine
        .mockResolvedValueOnce(okRow) // isParent
        .mockResolvedValueOnce(okRow) // isParentActingFor
        .mockResolvedValueOnce({ ...ROW, label: 'Wash face', enabled: false }); // UPDATE

      const r = await service.updateRoutine('parent-1', 'r-1', {
        label: 'Wash face',
        enabled: false,
        user_id: 'hacker', // ignored
      });

      const [sql, params] = mockQueryOne.mock.calls[3];
      expect(sql).toContain('label = $2');
      expect(sql).not.toContain('user_id =');
      expect(params).toEqual(['r-1', 'Wash face', false]);
      expect(r?.label).toBe('Wash face');
    });

    it('returns null when the routine does not exist', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      expect(await service.updateRoutine('parent-1', 'nope', { label: 'x' })).toBeNull();
    });

    it('returns the routine unchanged when no whitelisted keys are given', async () => {
      mockQueryOne
        .mockResolvedValueOnce(ROW) // SELECT
        .mockResolvedValueOnce(okRow) // isParent
        .mockResolvedValueOnce(okRow); // isParentActingFor
      const r = await service.updateRoutine('parent-1', 'r-1', { nope: 1 });
      expect(r?.id).toBe('r-1');
    });

    it('returns null when the UPDATE itself matches nothing', async () => {
      mockQueryOne
        .mockResolvedValueOnce(ROW)
        .mockResolvedValueOnce(okRow)
        .mockResolvedValueOnce(okRow)
        .mockResolvedValueOnce(null); // UPDATE RETURNING → none
      expect(await service.updateRoutine('parent-1', 'r-1', { label: 'x' })).toBeNull();
    });

    it('returns null when the caller is not a parent for it', async () => {
      mockQueryOne
        .mockResolvedValueOnce(ROW) // SELECT
        .mockResolvedValueOnce(null); // isParent → false
      expect(await service.updateRoutine('kid-2', 'r-1', { label: 'x' })).toBeNull();
    });
  });
});
