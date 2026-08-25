import { getReminderService } from '../../services/reminders';
import * as connection from '../../database/connection';

jest.mock('../../database/connection');

describe('ReminderService', () => {
  const service = getReminderService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRemindersForUser', () => {
    it('should query with just user_id when no filter given', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await service.getRemindersForUser('user-1');

      const [sql, params] = (connection.query as jest.Mock).mock.calls[0];
      expect(sql).toContain('user_id = $1');
      expect(sql).not.toContain('is_dismissed');
      expect(params).toEqual(['user-1']);
    });

    it('should add is_dismissed=false for pending filter', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await service.getRemindersForUser('user-1', 'pending');

      const [sql] = (connection.query as jest.Mock).mock.calls[0];
      expect(sql).toContain('is_dismissed = false');
    });

    it('should add is_dismissed=true for dismissed filter', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await service.getRemindersForUser('user-1', 'dismissed');

      const [sql] = (connection.query as jest.Mock).mock.calls[0];
      expect(sql).toContain('is_dismissed = true');
    });

    it('should rethrow on failure', async () => {
      (connection.query as jest.Mock).mockRejectedValueOnce(new Error('db error'));

      await expect(service.getRemindersForUser('user-1')).rejects.toThrow('db error');
    });
  });

  describe('getUpcomingReminders', () => {
    it('should query a 24-hour window of non-dismissed reminders', async () => {
      const rows = [{ id: 'r1' }];
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows });

      const result = await service.getUpcomingReminders('user-1');

      const [sql, params] = (connection.query as jest.Mock).mock.calls[0];
      expect(sql).toContain('is_dismissed = false');
      expect(params[0]).toBe('user-1');
      expect(result).toEqual(rows);
    });
  });

  describe('createReminder', () => {
    it('should default remind_before_minutes and recurrence', async () => {
      const created = { id: 'r1', title: 'Take out trash' };
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(created);

      const result = await service.createReminder('user-1', {
        title: 'Take out trash',
        reminder_type: 'chore',
        scheduled_time: '2026-01-01T08:00:00Z',
      });

      expect(result).toEqual(created);
      const params = (connection.queryOne as jest.Mock).mock.calls[0][1];
      expect(params[7]).toBe(15); // remind_before_minutes default
      expect(params[8]).toBe('once'); // recurrence default
    });

    it('should throw if insert returns nothing', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.createReminder('user-1', {
          title: 'x',
          reminder_type: 'custom',
          scheduled_time: '2026-01-01T00:00:00Z',
        })
      ).rejects.toThrow('Failed to create reminder');
    });
  });

  describe('updateReminder', () => {
    it('should only update whitelisted columns', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce({ id: 'r1', title: 'New title' });

      await service.updateReminder('r1', {
        title: 'New title',
        user_id: 'attacker-controlled',
      } as never);

      const [sql, params] = (connection.queryOne as jest.Mock).mock.calls[0];
      expect(sql).toContain('title = $2');
      expect(sql).not.toContain('user_id');
      expect(params).toEqual(['r1', 'New title']);
    });

    it('should just fetch the row when no updatable columns are given', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce({ id: 'r1' });

      await service.updateReminder('r1', {} as never);

      expect(connection.queryOne).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM reminders'), ['r1']);
    });
  });

  describe('dismissReminder', () => {
    it('should mark the reminder dismissed', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({});

      await service.dismissReminder('r1');

      expect(connection.query).toHaveBeenCalledWith(expect.stringContaining('is_dismissed = true'), ['r1']);
    });
  });

  describe('deleteReminder', () => {
    it('should delete by id', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({});

      await service.deleteReminder('r1');

      expect(connection.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM reminders'), ['r1']);
    });
  });

  describe('markNotificationSent', () => {
    it('should mark the notification sent', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({});

      await service.markNotificationSent('r1');

      expect(connection.query).toHaveBeenCalledWith(expect.stringContaining('notification_sent = true'), ['r1']);
    });
  });

  describe('getRemindersNeedingNotification', () => {
    it('should return reminders due within the next hour', async () => {
      const rows = [{ id: 'r1' }];
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows });

      const result = await service.getRemindersNeedingNotification();

      const [sql] = (connection.query as jest.Mock).mock.calls[0];
      expect(sql).toContain('notification_sent = false');
      expect(result).toEqual(rows);
    });
  });
});
