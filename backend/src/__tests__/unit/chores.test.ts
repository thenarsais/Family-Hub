import { ChoreService } from '../../services/chores';
import * as connection from '../../database/connection';
import * as PointsRepository from '../../database/repositories/PointsRepository';

jest.mock('../../database/connection');
jest.mock('../../database/repositories/PointsRepository');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;

const CHORE_ROW = {
  id: 'chore-1',
  user_id: 'kid-1',
  name: 'Take out trash',
  description: 'Move trash to curb',
  time_slot: 'morning',
  points_value: 10,
  enabled: true,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('ChoreService', () => {
  let service: ChoreService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChoreService();
  });

  describe('createChore', () => {
    it('creates for the caller when no assignee is given', async () => {
      mockQueryOne.mockResolvedValueOnce({ ...CHORE_ROW, user_id: 'parent-1' }); // INSERT

      const result = await service.createChore('parent-1', 'Take out trash', 'desc', 'morning', 10);

      expect(result.name).toBe('Take out trash');
      expect(result.timeSlot).toBe('morning');
      expect(mockQueryOne.mock.calls[0][1][0]).toBe('parent-1'); // user_id = creator
    });

    it('validates a different assignee against the family and stores them as user_id', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId(creator)
        .mockResolvedValueOnce({ ok: 1 }) // membership check
        .mockResolvedValueOnce(CHORE_ROW); // INSERT

      const result = await service.createChore('parent-1', 'Trash', undefined, 'morning', 10, 'kid-1');

      expect(mockQueryOne.mock.calls[2][1][0]).toBe('kid-1'); // stored as user_id
      expect(result.userId).toBe('kid-1');
    });

    it("throws 'bad-assignee' when the assignee is not in the caller's family", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId
        .mockResolvedValueOnce(null); // membership check → not a member

      await expect(
        service.createChore('parent-1', 'Trash', undefined, 'morning', 10, 'stranger'),
      ).rejects.toThrow('bad-assignee');
    });

    it('throws when the insert returns nothing', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      await expect(
        service.createChore('parent-1', 'Chore', undefined, 'morning', 10),
      ).rejects.toThrow('Failed to create chore');
    });
  });

  describe('updateChore', () => {
    it('writes only whitelisted columns for a family-shared chore', async () => {
      mockQueryOne
        .mockResolvedValueOnce(CHORE_ROW) // SELECT the chore
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId(caller) — caller !== chore.user_id
        .mockResolvedValueOnce({ ok: 1 }) // membership check
        .mockResolvedValueOnce({ ...CHORE_ROW, points_value: 25, enabled: false }); // UPDATE

      const result = await service.updateChore('parent-1', 'chore-1', {
        points_value: 25,
        enabled: false,
        user_id: 'hacker', // ignored — not whitelisted
      });

      const [sql, params] = mockQueryOne.mock.calls[3];
      expect(sql).toContain('points_value = $2');
      expect(sql).not.toContain('user_id =');
      expect(params).toEqual(['chore-1', 25, false]);
      expect(result?.pointsValue).toBe(25);
    });

    it('returns null when the chore is not in the caller family', async () => {
      mockQueryOne
        .mockResolvedValueOnce(CHORE_ROW) // SELECT
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId
        .mockResolvedValueOnce(null); // membership check → no

      expect(await service.updateChore('outsider', 'chore-1', { name: 'x' })).toBeNull();
    });

    it('returns null when the chore does not exist', async () => {
      mockQueryOne.mockResolvedValueOnce(null); // SELECT → none
      expect(await service.updateChore('parent-1', 'nope', { name: 'x' })).toBeNull();
    });
  });

  describe('getChores', () => {
    it("scope 'mine' — enabled chores + today's completion state", async () => {
      mockQueryOne.mockResolvedValueOnce({ timezone: 'America/Denver' }); // familyTz
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...CHORE_ROW, assignee_name: 'Krish', completion_id: 'comp-9' }],
      });

      const rows = await service.getChores('kid-1', 'mine');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('c.user_id = $2 AND c.enabled = true');
      expect(params).toEqual(['America/Denver', 'kid-1']);
      expect(rows[0]).toMatchObject({ completedToday: true, completionId: 'comp-9', assigneeName: 'Krish' });
    });

    it("scope 'family' — all members' chores incl. disabled, keyed to the family", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce({ family_id: 'fam-1' }); // familyId
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...CHORE_ROW, enabled: false, assignee_name: 'Krish', completion_id: null }],
      });

      const rows = await service.getChores('parent-1', 'family');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('c.user_id IN (');
      expect(params).toEqual(['America/Denver', 'fam-1']);
      expect(rows[0]).toMatchObject({ enabled: false, completedToday: false });
    });

    it("scope 'family' — empty when the caller has no family", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: null }) // familyTz → default
        .mockResolvedValueOnce(null); // familyId → none

      expect(await service.getChores('lonely', 'family')).toEqual([]);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('completeChore', () => {
    it('records the completion and awards points once per day', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ points_value: 20 }) // chore lookup
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce(null) // no existing completion today
        .mockResolvedValueOnce({
          id: 'comp-1',
          chore_id: 'chore-1',
          user_id: 'kid-1',
          completed_at: new Date(),
          points_earned: 20,
        }); // INSERT
      mockQuery.mockResolvedValueOnce({ rows: [{ len: '1' }] }); // getDailyStreak → 1 day, ×1

      const result = await service.completeChore('kid-1', 'chore-1');

      expect(result.pointsEarned).toBe(20);
      expect(PointsRepository.addPoints).toHaveBeenCalledWith(
        'kid-1',
        20,
        'chore',
        expect.stringContaining('chore-1'),
      );
    });

    it('scales the award by the daily streak (FR-035) and rewrites the row', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ points_value: 20 }) // chore lookup
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce(null) // no existing completion today
        .mockResolvedValueOnce({
          id: 'comp-1',
          chore_id: 'chore-1',
          user_id: 'kid-1',
          completed_at: new Date(),
          points_earned: 20,
        }); // INSERT
      mockQuery
        .mockResolvedValueOnce({ rows: [{ len: '7' }] }) // getDailyStreak → 7 days, ×1.2
        .mockResolvedValueOnce({ rows: [] }); // UPDATE chore_completions

      const result = await service.completeChore('kid-1', 'chore-1');

      expect(result.pointsEarned).toBe(24);
      expect(mockQuery.mock.calls[1][0]).toContain('UPDATE chore_completions SET points_earned');
      expect(PointsRepository.addPoints).toHaveBeenCalledWith('kid-1', 24, 'chore', expect.any(String));
    });

    it("throws 'already-completed-today' when there is a completion for the family-local day", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ points_value: 20 }) // chore lookup
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce({ id: 'comp-earlier' }); // existing completion today

      await expect(service.completeChore('kid-1', 'chore-1')).rejects.toThrow(
        'already-completed-today',
      );
      expect(PointsRepository.addPoints).not.toHaveBeenCalled();
    });

    it("throws 'Chore not found' when it isn't the caller's chore", async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      await expect(service.completeChore('kid-1', 'not-mine')).rejects.toThrow('Chore not found');
    });
  });

  describe('undoCompletion', () => {
    it("removes today's completion and reverses the points", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce({ id: 'comp-1' }); // DELETE ... RETURNING

      const ok = await service.undoCompletion('kid-1', 'chore-1');

      expect(ok).toBe(true);
      expect(PointsRepository.removePoints).toHaveBeenCalledWith(
        'kid-1',
        'chore',
        'Completed: chore-1',
      );
    });

    it('returns false when there is nothing to undo today', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce(null); // DELETE matched nothing

      expect(await service.undoCompletion('kid-1', 'chore-1')).toBe(false);
      expect(PointsRepository.removePoints).not.toHaveBeenCalled();
    });
  });

  describe('getChoreProgress', () => {
    it('returns progress statistics', async () => {
      mockQueryOne.mockResolvedValueOnce({
        total_completed: '15',
        this_week: '3',
        this_month: '10',
        points_earned: '150',
      });

      const result = await service.getChoreProgress('kid-1');

      expect(result).toEqual({ totalCompleted: 15, thisWeek: 3, thisMonth: 10, pointsEarned: 150 });
    });

    it('handles null results', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      expect(await service.getChoreProgress('kid-1')).toEqual({
        totalCompleted: 0,
        thisWeek: 0,
        thisMonth: 0,
        pointsEarned: 0,
      });
    });
  });

  describe('getPointsSummary', () => {
    it('reads the one real ledger (activity_points) via PointsRepository', async () => {
      (PointsRepository.getTotalPoints as jest.Mock).mockResolvedValueOnce(500);
      (PointsRepository.getPointsToday as jest.Mock).mockResolvedValueOnce(50);
      (PointsRepository.getPointsThisWeek as jest.Mock).mockResolvedValueOnce(200);
      (PointsRepository.getPointsThisMonth as jest.Mock).mockResolvedValueOnce(400);

      expect(await service.getPointsSummary('kid-1')).toEqual({
        totalPoints: 500,
        dailyPoints: 50,
        weeklyPoints: 200,
        monthlyPoints: 400,
      });
    });
  });

  describe('getTransactionHistory', () => {
    it('delegates to PointsRepository', async () => {
      (PointsRepository.getPointsHistory as jest.Mock).mockResolvedValueOnce([
        { user_id: 'kid-1', activity_type: 'chore', points: 20, reason: 'x', created_at: new Date() },
      ]);

      const result = await service.getTransactionHistory('kid-1', 50);

      expect(PointsRepository.getPointsHistory).toHaveBeenCalledWith('kid-1', 50);
      expect(result).toHaveLength(1);
    });
  });
});
