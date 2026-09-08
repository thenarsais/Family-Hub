import { HabitService } from '../../services/habits';
import * as connection from '../../database/connection';
import * as PointsRepository from '../../database/repositories/PointsRepository';

jest.mock('../../database/connection');
jest.mock('../../database/repositories/PointsRepository');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;

const HABIT_ROW = {
  id: 'habit-1',
  user_id: 'kid-1',
  title: 'Meditate',
  description: '10 minutes',
  weekly_target: 5,
  points_value: 10,
  enabled: true,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('HabitService', () => {
  let service: HabitService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HabitService();
  });

  describe('createHabit', () => {
    it('creates for the caller when no assignee is given', async () => {
      mockQueryOne.mockResolvedValueOnce({ ...HABIT_ROW, user_id: 'parent-1' }); // INSERT
      const result = await service.createHabit('parent-1', 'Meditate', 'desc', 5, 10);
      expect(result.title).toBe('Meditate');
      expect(result.weeklyTarget).toBe(5);
      expect(mockQueryOne.mock.calls[0][1][0]).toBe('parent-1');
    });

    it('validates a different assignee against the family and stores them as user_id', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId(creator)
        .mockResolvedValueOnce({ ok: 1 }) // membership check
        .mockResolvedValueOnce(HABIT_ROW); // INSERT
      const result = await service.createHabit('parent-1', 'Meditate', undefined, 7, 10, 'kid-1');
      expect(mockQueryOne.mock.calls[2][1][0]).toBe('kid-1');
      expect(result.userId).toBe('kid-1');
    });

    it("throws 'bad-assignee' when the assignee is not in the caller's family", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' })
        .mockResolvedValueOnce(null);
      await expect(
        service.createHabit('parent-1', 'x', undefined, 7, 10, 'stranger'),
      ).rejects.toThrow('bad-assignee');
    });

    it('throws when the insert returns nothing', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      await expect(service.createHabit('p', 'x', undefined, 7, 10)).rejects.toThrow(
        'Failed to create habit',
      );
    });
  });

  describe('updateHabit', () => {
    it('writes only whitelisted columns for a family-shared habit', async () => {
      mockQueryOne
        .mockResolvedValueOnce(HABIT_ROW) // SELECT
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId(caller)
        .mockResolvedValueOnce({ ok: 1 }) // membership
        .mockResolvedValueOnce({ ...HABIT_ROW, weekly_target: 3, enabled: false }); // UPDATE

      const result = await service.updateHabit('parent-1', 'habit-1', {
        weekly_target: 3,
        enabled: false,
        user_id: 'hacker',
      });

      const [sql, params] = mockQueryOne.mock.calls[3];
      expect(sql).toContain('weekly_target = $2');
      expect(sql).not.toContain('user_id =');
      expect(params).toEqual(['habit-1', 3, false]);
      expect(result?.weeklyTarget).toBe(3);
    });

    it('returns null when the habit is not in the caller family', async () => {
      mockQueryOne
        .mockResolvedValueOnce(HABIT_ROW)
        .mockResolvedValueOnce({ family_id: 'fam-1' })
        .mockResolvedValueOnce(null);
      expect(await service.updateHabit('outsider', 'habit-1', { title: 'x' })).toBeNull();
    });

    it('returns null when the habit does not exist', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      expect(await service.updateHabit('p', 'nope', { title: 'x' })).toBeNull();
    });
  });

  describe('getHabits', () => {
    it("scope 'mine' — enabled habits + week progress + streak", async () => {
      mockQueryOne.mockResolvedValueOnce({ timezone: 'America/Denver' }); // familyTz
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            ...HABIT_ROW,
            assignee_name: 'Krish',
            completion_id: 'c-9',
            week_completions: '3',
            week_streak: '2',
          },
        ],
      });

      const rows = await service.getHabits('kid-1', 'mine');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('h.user_id = $2 AND h.enabled = true');
      expect(params).toEqual(['America/Denver', 'kid-1']);
      expect(rows[0]).toMatchObject({
        completedToday: true,
        completionId: 'c-9',
        weekCompletions: 3,
        weekStreak: 2,
        assigneeName: 'Krish',
      });
    });

    it("scope 'family' — keyed to the family, includes disabled", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce({ family_id: 'fam-1' }); // familyId
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...HABIT_ROW, enabled: false, week_completions: '0', week_streak: '0', completion_id: null }],
      });

      const rows = await service.getHabits('parent-1', 'family');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('h.user_id IN (');
      expect(params).toEqual(['America/Denver', 'fam-1']);
      expect(rows[0]).toMatchObject({ enabled: false, completedToday: false });
    });

    it("scope 'family' — empty when the caller has no family", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: null })
        .mockResolvedValueOnce(null);
      expect(await service.getHabits('lonely', 'family')).toEqual([]);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('completeHabit', () => {
    it('records the completion and awards streak-scaled points', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ points_value: 10 }) // habit lookup
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce(null) // no existing completion today
        .mockResolvedValueOnce({ id: 'hc-1' }); // INSERT
      mockQuery
        .mockResolvedValueOnce({ rows: [{ len: '3' }] }) // getDailyStreak → ×1.1
        .mockResolvedValueOnce({ rows: [] }); // UPDATE points_earned

      const result = await service.completeHabit('kid-1', 'habit-1');

      expect(result.pointsEarned).toBe(11);
      expect(PointsRepository.addPoints).toHaveBeenCalledWith('kid-1', 11, 'habit', 'Habit: habit-1');
    });

    it("throws 'already-completed-today'", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ points_value: 10 })
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce({ id: 'earlier' });
      await expect(service.completeHabit('kid-1', 'habit-1')).rejects.toThrow(
        'already-completed-today',
      );
      expect(PointsRepository.addPoints).not.toHaveBeenCalled();
    });

    it("throws 'Habit not found' when it isn't the caller's", async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      await expect(service.completeHabit('kid-1', 'nope')).rejects.toThrow('Habit not found');
    });
  });

  describe('undoHabitCompletion', () => {
    it("removes today's completion and reverses the points", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce({ id: 'hc-1' }); // DELETE ... RETURNING
      const ok = await service.undoHabitCompletion('kid-1', 'habit-1');
      expect(ok).toBe(true);
      expect(PointsRepository.removePoints).toHaveBeenCalledWith('kid-1', 'habit', 'Habit: habit-1');
    });

    it('returns false when there is nothing to undo', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce(null);
      expect(await service.undoHabitCompletion('kid-1', 'habit-1')).toBe(false);
      expect(PointsRepository.removePoints).not.toHaveBeenCalled();
    });
  });

  describe('mood check-in', () => {
    it('getTodayMood maps a row', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce({
          id: 'm1',
          user_id: 'kid-1',
          mood: 'good',
          emoji: '🙂',
          note: null,
          recorded_at: new Date(),
        });
      const mood = await service.getTodayMood('kid-1');
      expect(mood).toMatchObject({ id: 'm1', mood: 'good', emoji: '🙂' });
    });

    it('getTodayMood returns null when nothing logged', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce(null);
      expect(await service.getTodayMood('kid-1')).toBeNull();
    });

    it('setMood inserts when there is no entry today', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId
        .mockResolvedValueOnce(null) // no existing entry
        .mockResolvedValueOnce({
          id: 'm2',
          user_id: 'kid-1',
          mood: 'great',
          emoji: null,
          note: null,
          recorded_at: new Date(),
        }); // INSERT

      const entry = await service.setMood('kid-1', 'great');
      expect(entry.mood).toBe('great');
      expect(mockQueryOne.mock.calls[3][0]).toContain('INSERT INTO mood_entries');
    });

    it('setMood updates the existing entry for today', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce({ family_id: 'fam-1' })
        .mockResolvedValueOnce({ id: 'm3' }) // existing
        .mockResolvedValueOnce({
          id: 'm3',
          user_id: 'kid-1',
          mood: 'low',
          emoji: null,
          note: 'tired',
          recorded_at: new Date(),
        }); // UPDATE

      const entry = await service.setMood('kid-1', 'low', undefined, 'tired');
      expect(entry.mood).toBe('low');
      expect(mockQueryOne.mock.calls[3][0]).toContain('UPDATE mood_entries');
    });

    it('getFamilyMoodHistory refuses a non-parent', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1', role: 'child' });
      await expect(service.getFamilyMoodHistory('kid-1')).rejects.toThrow('not-parent');
    });

    it('getFamilyMoodHistory returns one row per member per day for a parent', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1', role: 'parent' }) // caller
        .mockResolvedValueOnce({ timezone: 'America/Denver' }); // familyTz
      mockQuery.mockResolvedValueOnce({
        rows: [
          { user_id: 'kid-1', assignee_name: 'Krish', day: '2026-09-08', mood: 'good', emoji: '🙂' },
        ],
      });
      const history = await service.getFamilyMoodHistory('parent-1', 30);
      expect(history).toEqual([
        { userId: 'kid-1', assigneeName: 'Krish', day: '2026-09-08', mood: 'good', emoji: '🙂' },
      ]);
    });

    it('getFamilyMoodHistory returns [] when the caller has no family', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      expect(await service.getFamilyMoodHistory('nobody')).toEqual([]);
    });
  });
});
