import { HomeworkService } from '../../services/homework';
import * as connection from '../../database/connection';
import * as PointsRepository from '../../database/repositories/PointsRepository';

jest.mock('../../database/connection');
jest.mock('../../database/repositories/PointsRepository');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;
const mockAddPoints = PointsRepository.addPoints as jest.Mock;
const mockRemovePoints = PointsRepository.removePoints as jest.Mock;

const ROW = {
  id: 'hw-1',
  user_id: 'kid-1',
  created_by: 'parent-1',
  title: 'Math p.12',
  subject: 'Math',
  due_date: '2026-09-12',
  points_value: 10,
  completed_at: null,
  points_earned: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('HomeworkService', () => {
  let service: HomeworkService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HomeworkService();
  });

  describe('createItem', () => {
    it('creates for the caller with the default 10 points when none is given', async () => {
      mockQueryOne.mockResolvedValueOnce(ROW); // INSERT
      const item = await service.createItem('kid-1', {
        title: 'Math p.12',
        dueDate: '2026-09-12',
      });
      expect(item.pointsValue).toBe(10);
      expect(item.dueDate).toBe('2026-09-12');
      // INSERT params: [assignee, creator, title, subject, dueDate, points]
      const params = mockQueryOne.mock.calls[0][1];
      expect(params[0]).toBe('kid-1');
      expect(params[5]).toBe(10);
    });

    it('honours an explicit pointsValue', async () => {
      mockQueryOne.mockResolvedValueOnce({ ...ROW, points_value: 25 });
      const item = await service.createItem('kid-1', {
        title: 'Essay',
        dueDate: '2026-09-15',
        pointsValue: 25,
      });
      expect(item.pointsValue).toBe(25);
    });

    it('validates a different assignee against the family', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId(creator)
        .mockResolvedValueOnce({ ok: 1 }) // membership check
        .mockResolvedValueOnce(ROW); // INSERT
      const item = await service.createItem('parent-1', {
        title: 'Math p.12',
        dueDate: '2026-09-12',
        assigneeId: 'kid-1',
      });
      expect(item.userId).toBe('kid-1');
    });

    it('throws bad-assignee for a non-family assignee', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId
        .mockResolvedValueOnce(null); // membership check fails
      await expect(
        service.createItem('parent-1', {
          title: 'x',
          dueDate: '2026-09-12',
          assigneeId: 'stranger',
        }),
      ).rejects.toThrow('bad-assignee');
    });

    it('throws bad-due-date for a non-ISO date', async () => {
      await expect(
        service.createItem('kid-1', { title: 'x', dueDate: '13/09/2026' }),
      ).rejects.toThrow('bad-due-date');
      await expect(
        service.createItem('kid-1', { title: 'x', dueDate: '2026-02-30' }),
      ).rejects.toThrow('bad-due-date');
      expect(mockQueryOne).not.toHaveBeenCalled();
    });
  });

  describe('getItems', () => {
    it('mine scope: 7-day + overdue + completed-today window, maps status flags', async () => {
      mockQueryOne.mockResolvedValueOnce({ timezone: 'America/Denver' }); // familyTz
      mockQuery.mockResolvedValueOnce({
        rows: [
          { ...ROW, id: 'a', assignee_name: 'Krish', added_by_name: 'Mom', is_overdue: true },
          {
            ...ROW,
            id: 'b',
            completed_at: new Date().toISOString(),
            assignee_name: 'Krish',
            added_by_name: null,
            is_overdue: false,
          },
        ],
      });
      const items = await service.getItems('kid-1', 'mine');
      expect(items).toHaveLength(2);
      expect(items[0].isOverdue).toBe(true);
      expect(items[0].completed).toBe(false);
      expect(items[0].assigneeName).toBe('Krish');
      expect(items[1].completed).toBe(true);
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toMatch(/\(now\(\) AT TIME ZONE \$1\)::date \+ 7/);
      expect(mockQuery.mock.calls[0][1]).toEqual(['America/Denver', 'kid-1']);
    });

    it('family scope: needs a family, widens to open + last 30 days', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce({ family_id: 'fam-1' }); // familyId
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await service.getItems('parent-1', 'family');
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toMatch(/family_members WHERE family_id = \$2/);
      expect(sql).toMatch(/::date - 30/);
    });

    it('family scope returns [] when the viewer is in no family', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce(null); // familyId → null
      const items = await service.getItems('nobody', 'family');
      expect(items).toEqual([]);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('completeItem', () => {
    it('awards flat points and never applies a multiplier', async () => {
      mockQueryOne.mockResolvedValueOnce({ points_value: 10, completed_at: null }); // SELECT
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE
      const res = await service.completeItem('kid-1', 'hw-1');
      expect(res.pointsEarned).toBe(10);
      expect(mockAddPoints).toHaveBeenCalledWith('kid-1', 10, 'homework', 'Homework: hw-1');
    });

    it('throws not-found for a missing / foreign item', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      await expect(service.completeItem('kid-1', 'nope')).rejects.toThrow('not-found');
      expect(mockAddPoints).not.toHaveBeenCalled();
    });

    it('throws already-completed', async () => {
      mockQueryOne.mockResolvedValueOnce({
        points_value: 10,
        completed_at: new Date().toISOString(),
      });
      await expect(service.completeItem('kid-1', 'hw-1')).rejects.toThrow('already-completed');
      expect(mockAddPoints).not.toHaveBeenCalled();
    });
  });

  describe('uncompleteItem', () => {
    it('clears the completion and reverses the points', async () => {
      mockQueryOne.mockResolvedValueOnce({ id: 'hw-1' }); // UPDATE ... RETURNING
      const ok = await service.uncompleteItem('kid-1', 'hw-1');
      expect(ok).toBe(true);
      expect(mockRemovePoints).toHaveBeenCalledWith('kid-1', 'homework', 'Homework: hw-1');
    });

    it('returns false when there was nothing to undo', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      const ok = await service.uncompleteItem('kid-1', 'hw-1');
      expect(ok).toBe(false);
      expect(mockRemovePoints).not.toHaveBeenCalled();
    });
  });

  describe('deleteItem', () => {
    it('reverses points for a completed item, then deletes', async () => {
      mockQueryOne.mockResolvedValueOnce({
        ...ROW,
        user_id: 'kid-1',
        completed_at: new Date().toISOString(),
      }); // SELECT (caller === assignee → sharesFamily short-circuits)
      mockQuery.mockResolvedValueOnce({ rows: [] }); // DELETE
      const ok = await service.deleteItem('kid-1', 'hw-1');
      expect(ok).toBe(true);
      expect(mockRemovePoints).toHaveBeenCalledWith('kid-1', 'homework', 'Homework: hw-1');
    });

    it('returns false when the caller is outside the assignee\'s family', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ ...ROW, user_id: 'kid-1' }) // SELECT
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId(caller)
        .mockResolvedValueOnce(null); // membership check fails
      const ok = await service.deleteItem('stranger', 'hw-1');
      expect(ok).toBe(false);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('rejects a bad due date without writing', async () => {
      mockQueryOne.mockResolvedValueOnce({ ...ROW, user_id: 'parent-1' }); // SELECT (caller===assignee)
      await expect(
        service.updateItem('parent-1', 'hw-1', { due_date: 'nope' }),
      ).rejects.toThrow('bad-due-date');
    });

    it('applies a whitelisted change', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ ...ROW, user_id: 'parent-1' }) // SELECT
        .mockResolvedValueOnce({ ...ROW, title: 'Renamed' }); // UPDATE
      const item = await service.updateItem('parent-1', 'hw-1', { title: 'Renamed' });
      expect(item?.title).toBe('Renamed');
    });

    it('returns null when the item is not found', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      const item = await service.updateItem('parent-1', 'nope', { title: 'x' });
      expect(item).toBeNull();
    });
  });
});
