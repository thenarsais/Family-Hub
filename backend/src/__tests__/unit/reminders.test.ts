import { getReminderService } from '../../services/reminders';
import * as connection from '../../database/connection';

jest.mock('../../database/connection');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;

/** A family_members + family_settings row as familyContext() reads it. */
const FAMILY = { family_id: 'fam-1', timezone: 'America/New_York' };

describe('ReminderService', () => {
  const service = getReminderService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('familyContext gating', () => {
    it('returns an empty list when the caller has no family', async () => {
      mockQueryOne.mockResolvedValueOnce(null); // familyContext

      const rows = await service.getRemindersForUser('user-1');

      expect(rows).toEqual([]);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('returns false from deleteReminder when the caller has no family', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      expect(await service.deleteReminder('user-1', 'r1')).toBe(false);
    });
  });

  describe('getRemindersForUser', () => {
    it('scopes the query to the family and rolls stale recurring rows first', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY); // familyContext
      mockQuery.mockResolvedValueOnce({ rows: [] }); // rollStale SELECT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'r1', assignee_name: 'Priya' }] }); // main SELECT

      const rows = await service.getRemindersForUser('user-1');

      const [sql, params] = mockQuery.mock.calls[1];
      expect(sql).toContain('r.family_id = $1');
      expect(sql).toContain('assignee_name');
      expect(sql).not.toContain('is_dismissed');
      expect(params).toEqual(['fam-1']);
      expect(rows).toEqual([{ id: 'r1', assignee_name: 'Priya' }]);
    });

    it('adds is_dismissed = false for the pending filter', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQuery.mockResolvedValueOnce({ rows: [] }); // rollStale
      mockQuery.mockResolvedValueOnce({ rows: [] }); // main

      await service.getRemindersForUser('user-1', 'pending');

      expect(mockQuery.mock.calls[1][0]).toContain('r.is_dismissed = false');
    });

    it('adds is_dismissed = true for the dismissed filter', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.getRemindersForUser('user-1', 'dismissed');

      expect(mockQuery.mock.calls[1][0]).toContain('r.is_dismissed = true');
    });

    it('rolls a stale daily reminder forward to its next occurrence', async () => {
      const stale = {
        id: 'r1',
        recurrence: 'daily',
        scheduled_time: '2020-01-01T13:00:00.000Z', // long past
        recurrence_end_date: null,
      };
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQuery.mockResolvedValueOnce({ rows: [stale] }); // rollStale SELECT
      mockQuery.mockResolvedValueOnce({}); // rollStale UPDATE
      mockQuery.mockResolvedValueOnce({ rows: [] }); // main SELECT

      await service.getRemindersForUser('user-1');

      const [sql, params] = mockQuery.mock.calls[1];
      expect(sql).toContain('SET scheduled_time = $1');
      expect(sql).toContain('scheduled_time = $3'); // compare-and-swap guard
      expect(new Date(params[0] as string).getTime()).toBeGreaterThan(Date.now());
      expect(params[1]).toBe('r1');
      expect(params[2]).toBe(stale.scheduled_time);
    });

    it('dismisses a stale recurring reminder that is past its end date', async () => {
      const stale = {
        id: 'r1',
        recurrence: 'daily',
        scheduled_time: '2020-01-01T13:00:00.000Z',
        recurrence_end_date: '2020-01-02',
      };
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQuery.mockResolvedValueOnce({ rows: [stale] });
      mockQuery.mockResolvedValueOnce({}); // rollStale UPDATE
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.getRemindersForUser('user-1');

      expect(mockQuery.mock.calls[1][0]).toContain('is_dismissed = true');
    });
  });

  describe('getUpcomingReminders / getDueReminders', () => {
    it('getUpcomingReminders queries a forward 24h window, not dismissed', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQuery.mockResolvedValueOnce({ rows: [] }); // rollStale
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'r1' }] }); // window

      const rows = await service.getUpcomingReminders('user-1');

      const [sql, params] = mockQuery.mock.calls[1];
      expect(sql).toContain('r.is_dismissed = false');
      expect(sql).toContain('r.scheduled_time >= $2');
      expect(sql).toContain('r.scheduled_time <= $3');
      expect(params[0]).toBe('fam-1');
      expect(new Date(params[2] as string).getTime()).toBeGreaterThan(new Date(params[1] as string).getTime());
      expect(rows).toEqual([{ id: 'r1' }]);
    });

    it('getDueReminders queries scheduled_time <= now, not dismissed', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQuery.mockResolvedValueOnce({ rows: [] }); // rollStale
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.getDueReminders('user-1');

      const [sql] = mockQuery.mock.calls[1];
      expect(sql).toContain('r.is_dismissed = false');
      expect(sql).toContain('r.scheduled_time <= $2');
    });
  });

  describe('createReminder', () => {
    it('defaults the assignee to the creator and stores recurrence "once"', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY); // familyContext
      mockQueryOne.mockResolvedValueOnce({ id: 'r1' }); // INSERT RETURNING id
      mockQueryOne.mockResolvedValueOnce({ id: 'r1', assignee_name: 'Priya' }); // getOne

      const result = await service.createReminder('user-1', {
        title: '  Take out trash  ',
        reminder_type: 'chore',
        scheduled_time: '2026-01-01T08:00:00Z',
      });

      const params = mockQueryOne.mock.calls[1][1];
      expect(params[0]).toBe('user-1'); // user_id = creator
      expect(params[1]).toBe('fam-1'); // family_id
      expect(params[2]).toBe('Take out trash'); // trimmed
      expect(params[6]).toBe('once'); // recurrence
      expect(result).toEqual({ id: 'r1', assignee_name: 'Priya' });
    });

    it('keeps a valid recurrence value', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQueryOne.mockResolvedValueOnce({ id: 'r1' });
      mockQueryOne.mockResolvedValueOnce({ id: 'r1' });

      await service.createReminder('user-1', {
        title: 'Water plants',
        scheduled_time: '2026-01-01T08:00:00Z',
        recurrence: 'weekly',
      });

      expect(mockQueryOne.mock.calls[1][1][6]).toBe('weekly');
    });

    it('returns null when the creator has no family', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const result = await service.createReminder('user-1', {
        title: 'x',
        scheduled_time: '2026-01-01T08:00:00Z',
      });

      expect(result).toBeNull();
    });

    it('returns "bad-assignee" when the assignee is not an active family member', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY); // familyContext
      mockQueryOne.mockResolvedValueOnce(null); // membership check

      const result = await service.createReminder('user-1', {
        title: 'x',
        scheduled_time: '2026-01-01T08:00:00Z',
        assignee_user_id: 'stranger',
      });

      expect(result).toBe('bad-assignee');
    });

    it('accepts an assignee who is an active family member', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQueryOne.mockResolvedValueOnce({ ok: 1 }); // membership check
      mockQueryOne.mockResolvedValueOnce({ id: 'r1' }); // INSERT
      mockQueryOne.mockResolvedValueOnce({ id: 'r1', assignee_name: 'Sam' }); // getOne

      const result = await service.createReminder('user-1', {
        title: 'x',
        scheduled_time: '2026-01-01T08:00:00Z',
        assignee_user_id: 'user-2',
      });

      expect(mockQueryOne.mock.calls[2][1][0]).toBe('user-2'); // stored as user_id
      expect(result).toEqual({ id: 'r1', assignee_name: 'Sam' });
    });

    it('stores the calendar-event link fields (related_item_id / type / lead minutes)', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQueryOne.mockResolvedValueOnce({ id: 'r1' });
      mockQueryOne.mockResolvedValueOnce({ id: 'r1' });

      await service.createReminder('user-1', {
        title: 'Dentist',
        scheduled_time: '2026-01-01T08:00:00Z',
        reminder_type: 'event',
        related_item_id: 'gcal-evt-123',
        related_item_type: 'calendar_event',
        remind_before_minutes: 60,
      });

      const [sql, params] = mockQueryOne.mock.calls[1];
      expect(sql).toContain('related_item_id');
      expect(params[8]).toBe('gcal-evt-123');
      expect(params[9]).toBe('calendar_event');
      expect(params[10]).toBe(60);
    });

    it('defaults the link fields to null / 0 when omitted', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQueryOne.mockResolvedValueOnce({ id: 'r1' });
      mockQueryOne.mockResolvedValueOnce({ id: 'r1' });

      await service.createReminder('user-1', {
        title: 'x',
        scheduled_time: '2026-01-01T08:00:00Z',
      });

      const params = mockQueryOne.mock.calls[1][1];
      expect(params[8]).toBeNull();
      expect(params[9]).toBeNull();
      expect(params[10]).toBe(0);
    });
  });

  describe('updateReminder', () => {
    it('only writes whitelisted columns and scopes to the family', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY); // familyContext
      mockQueryOne.mockResolvedValueOnce({ id: 'r1' }); // UPDATE RETURNING id
      mockQueryOne.mockResolvedValueOnce({ id: 'r1', title: 'New title' }); // getOne

      await service.updateReminder('user-1', 'r1', {
        title: 'New title',
        user_id: 'attacker-controlled',
      } as never);

      const [sql, params] = mockQueryOne.mock.calls[1];
      expect(sql).toContain('title = $3');
      expect(sql).toContain('WHERE id = $1 AND family_id = $2');
      expect(sql).not.toContain('user_id');
      expect(params).toEqual(['r1', 'fam-1', 'New title']);
    });

    it('just fetches the row when no updatable columns are given', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY); // familyContext
      mockQueryOne.mockResolvedValueOnce({ id: 'r1' }); // getOne

      await service.updateReminder('user-1', 'r1', {} as never);

      expect(mockQueryOne).toHaveBeenCalledTimes(2);
      expect(mockQueryOne.mock.calls[1][0]).toContain('WHERE r.id = $1 AND r.family_id = $2');
    });

    it('returns null when the row is not in the family', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQueryOne.mockResolvedValueOnce(null); // UPDATE matched nothing

      const result = await service.updateReminder('user-1', 'r1', { title: 'x' } as never);

      expect(result).toBeNull();
    });
  });

  describe('dismissReminder', () => {
    it('marks a one-off reminder dismissed', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY); // familyContext
      mockQueryOne.mockResolvedValueOnce({ id: 'r1', recurrence: 'once' }); // getOne
      mockQuery.mockResolvedValueOnce({}); // UPDATE is_dismissed
      mockQueryOne.mockResolvedValueOnce({ id: 'r1', is_dismissed: true }); // getOne

      await service.dismissReminder('user-1', 'r1');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('is_dismissed = true');
      expect(params).toEqual(['r1', 'fam-1']);
    });

    it('rolls a recurring reminder forward instead of hiding it', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQueryOne.mockResolvedValueOnce({
        id: 'r1',
        recurrence: 'daily',
        scheduled_time: '2026-01-01T13:00:00.000Z',
        recurrence_end_date: null,
      });
      mockQuery.mockResolvedValueOnce({}); // UPDATE scheduled_time
      mockQueryOne.mockResolvedValueOnce({ id: 'r1' }); // getOne

      await service.dismissReminder('user-1', 'r1');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('SET scheduled_time = $1');
      expect(sql).not.toContain('is_dismissed = true');
      expect(params[1]).toBe('r1');
      expect(params[2]).toBe('fam-1');
    });

    it('returns null when the reminder is not in the family', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQueryOne.mockResolvedValueOnce(null); // getOne

      expect(await service.dismissReminder('user-1', 'r1')).toBeNull();
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('restoreReminder', () => {
    it('un-dismisses a family reminder', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQueryOne.mockResolvedValueOnce({ id: 'r1' }); // UPDATE RETURNING id
      mockQueryOne.mockResolvedValueOnce({ id: 'r1', is_dismissed: false }); // getOne

      await service.restoreReminder('user-1', 'r1');

      const [sql, params] = mockQueryOne.mock.calls[1];
      expect(sql).toContain('is_dismissed = false');
      expect(params).toEqual(['r1', 'fam-1']);
    });
  });

  describe('deleteReminder', () => {
    it('deletes within the family and reports whether a row went', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const removed = await service.deleteReminder('user-1', 'r1');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('DELETE FROM reminders WHERE id = $1 AND family_id = $2');
      expect(params).toEqual(['r1', 'fam-1']);
      expect(removed).toBe(true);
    });

    it('returns false when no row matched', async () => {
      mockQueryOne.mockResolvedValueOnce(FAMILY);
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      expect(await service.deleteReminder('user-1', 'r1')).toBe(false);
    });
  });
});
