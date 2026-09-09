import request from 'supertest';
import express from 'express';

const mockReminderService = {
  getRemindersForUser: jest.fn(),
  getUpcomingReminders: jest.fn(),
  getDueReminders: jest.fn(),
  createReminder: jest.fn(),
  updateReminder: jest.fn(),
  dismissReminder: jest.fn(),
  restoreReminder: jest.fn(),
  deleteReminder: jest.fn(),
};

jest.mock('../../services/reminders', () => ({ getReminderService: () => mockReminderService }));

import remindersRoutes from '../../routes/reminders';

const app = express();
app.use(express.json());
app.use('/api/reminders', remindersRoutes);

const U = (r: request.Test) => r.set('x-user-id', 'user-1');

describe('Reminders Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/reminders', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/reminders').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should default the filter to "all"', async () => {
      mockReminderService.getRemindersForUser.mockResolvedValueOnce([{ id: 'r1' }]);

      const res = await U(request(app).get('/api/reminders')).expect(200);

      expect(mockReminderService.getRemindersForUser).toHaveBeenCalledWith('user-1', 'all');
      expect(res.body.count).toBe(1);
      expect(res.body.data).toEqual([{ id: 'r1' }]);
    });

    it('should pass through a pending filter', async () => {
      mockReminderService.getRemindersForUser.mockResolvedValueOnce([]);

      await U(request(app).get('/api/reminders?filter=pending')).expect(200);

      expect(mockReminderService.getRemindersForUser).toHaveBeenCalledWith('user-1', 'pending');
    });

    it('should return 500 on service failure', async () => {
      mockReminderService.getRemindersForUser.mockRejectedValueOnce(new Error('db down'));

      const res = await U(request(app).get('/api/reminders')).expect(500);
      expect(res.body.message).toBe('Failed to fetch reminders');
    });
  });

  describe('GET /api/reminders/upcoming', () => {
    it('should require a user id', async () => {
      await request(app).get('/api/reminders/upcoming').expect(401);
    });

    it('should return upcoming reminders', async () => {
      mockReminderService.getUpcomingReminders.mockResolvedValueOnce([{ id: 'r1' }]);

      const res = await U(request(app).get('/api/reminders/upcoming')).expect(200);

      expect(res.body.count).toBe(1);
    });

    it('should return 500 on service failure', async () => {
      mockReminderService.getUpcomingReminders.mockRejectedValueOnce(new Error('db down'));

      const res = await U(request(app).get('/api/reminders/upcoming')).expect(500);
      expect(res.body.message).toBe('Failed to fetch upcoming reminders');
    });
  });

  describe('GET /api/reminders/due', () => {
    it('should require a user id', async () => {
      await request(app).get('/api/reminders/due').expect(401);
    });

    it('should return due reminders', async () => {
      mockReminderService.getDueReminders.mockResolvedValueOnce([{ id: 'r1' }, { id: 'r2' }]);

      const res = await U(request(app).get('/api/reminders/due')).expect(200);

      expect(mockReminderService.getDueReminders).toHaveBeenCalledWith('user-1');
      expect(res.body.count).toBe(2);
    });

    it('should return 500 on service failure', async () => {
      mockReminderService.getDueReminders.mockRejectedValueOnce(new Error('db down'));

      const res = await U(request(app).get('/api/reminders/due')).expect(500);
      expect(res.body.message).toBe('Failed to fetch due reminders');
    });
  });

  describe('POST /api/reminders', () => {
    const good = { title: 'Take out trash', scheduled_time: '2026-01-01T08:00:00Z' };

    it('should require a user id', async () => {
      await request(app).post('/api/reminders').send(good).expect(401);
    });

    it('should reject a missing title', async () => {
      const res = await U(request(app).post('/api/reminders')).send({ scheduled_time: good.scheduled_time }).expect(400);
      expect(res.body.message).toBe('title is required');
    });

    it('should reject a blank title', async () => {
      const res = await U(request(app).post('/api/reminders')).send({ ...good, title: '   ' }).expect(400);
      expect(res.body.message).toBe('title is required');
    });

    it('should reject an invalid scheduled_time', async () => {
      const res = await U(request(app).post('/api/reminders')).send({ title: 'x', scheduled_time: 'not-a-date' }).expect(400);
      expect(res.body.message).toBe('scheduled_time must be a valid date-time');
    });

    it('should reject an unknown recurrence value', async () => {
      const res = await U(request(app).post('/api/reminders')).send({ ...good, recurrence: 'yearly' }).expect(400);
      expect(res.body.message).toBe('recurrence must be once, daily, weekly or monthly');
    });

    it('should create a reminder and echo the assignee name', async () => {
      const reminder = { id: 'r1', title: 'Take out trash', assignee_name: 'Priya' };
      mockReminderService.createReminder.mockResolvedValueOnce(reminder);

      const res = await U(request(app).post('/api/reminders'))
        .send({ ...good, recurrence: 'weekly', assignee_user_id: 'user-2' })
        .expect(201);

      expect(mockReminderService.createReminder).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          title: 'Take out trash',
          recurrence: 'weekly',
          assignee_user_id: 'user-2',
        }),
      );
      expect(res.body.data).toEqual(reminder);
    });

    it('should default recurrence to "once"', async () => {
      mockReminderService.createReminder.mockResolvedValueOnce({ id: 'r1' });

      await U(request(app).post('/api/reminders')).send(good).expect(201);

      expect(mockReminderService.createReminder).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ recurrence: 'once' }),
      );
    });

    it('forwards the calendar-event link fields', async () => {
      mockReminderService.createReminder.mockResolvedValueOnce({ id: 'r1' });

      await U(request(app).post('/api/reminders'))
        .send({
          ...good,
          reminder_type: 'event',
          related_item_id: 'gcal-evt-123',
          related_item_type: 'calendar_event',
          remind_before_minutes: 60,
        })
        .expect(201);

      expect(mockReminderService.createReminder).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          related_item_id: 'gcal-evt-123',
          related_item_type: 'calendar_event',
          remind_before_minutes: 60,
        }),
      );
    });

    it('rejects a blank related_item_id and a negative lead time', async () => {
      const a = await U(request(app).post('/api/reminders')).send({ ...good, related_item_id: '  ' }).expect(400);
      expect(a.body.message).toMatch(/related_item_id/);
      const b = await U(request(app).post('/api/reminders'))
        .send({ ...good, remind_before_minutes: -5 })
        .expect(400);
      expect(b.body.message).toMatch(/remind_before_minutes/);
      expect(mockReminderService.createReminder).not.toHaveBeenCalled();
    });

    it('should 404 when the user has no family', async () => {
      mockReminderService.createReminder.mockResolvedValueOnce(null);

      const res = await U(request(app).post('/api/reminders')).send(good).expect(404);
      expect(res.body.message).toBe('No family for this user');
    });

    it('should 400 when the assignee is not in the family', async () => {
      mockReminderService.createReminder.mockResolvedValueOnce('bad-assignee');

      const res = await U(request(app).post('/api/reminders'))
        .send({ ...good, assignee_user_id: 'stranger' })
        .expect(400);
      expect(res.body.message).toBe('assignee_user_id is not a member of your family');
    });

    it('should return 500 on service failure', async () => {
      mockReminderService.createReminder.mockRejectedValueOnce(new Error('db down'));

      const res = await U(request(app).post('/api/reminders')).send(good).expect(500);
      expect(res.body.message).toBe('Failed to create reminder');
    });
  });

  describe('PATCH /api/reminders/:id', () => {
    it('should require a user id', async () => {
      await request(app).patch('/api/reminders/r1').send({ title: 'New' }).expect(401);
    });

    it('should update a reminder', async () => {
      const updated = { id: 'r1', title: 'New' };
      mockReminderService.updateReminder.mockResolvedValueOnce(updated);

      const res = await U(request(app).patch('/api/reminders/r1')).send({ title: 'New' }).expect(200);

      expect(mockReminderService.updateReminder).toHaveBeenCalledWith('user-1', 'r1', { title: 'New' });
      expect(res.body.data).toEqual(updated);
    });

    it('should 404 when the reminder is not in the family', async () => {
      mockReminderService.updateReminder.mockResolvedValueOnce(null);

      const res = await U(request(app).patch('/api/reminders/r1')).send({ title: 'New' }).expect(404);
      expect(res.body.message).toBe('Reminder not found');
    });

    it('should return 500 on service failure', async () => {
      mockReminderService.updateReminder.mockRejectedValueOnce(new Error('db down'));

      const res = await U(request(app).patch('/api/reminders/r1')).send({}).expect(500);
      expect(res.body.message).toBe('Failed to update reminder');
    });
  });

  describe('POST /api/reminders/:id/dismiss', () => {
    it('should require a user id', async () => {
      await request(app).post('/api/reminders/r1/dismiss').expect(401);
    });

    it('should dismiss a reminder and return the resulting row', async () => {
      const rolled = { id: 'r1', scheduled_time: '2026-01-08T08:00:00Z' };
      mockReminderService.dismissReminder.mockResolvedValueOnce(rolled);

      const res = await U(request(app).post('/api/reminders/r1/dismiss')).expect(200);

      expect(mockReminderService.dismissReminder).toHaveBeenCalledWith('user-1', 'r1');
      expect(res.body.data).toEqual(rolled);
    });

    it('should 404 when the reminder is not in the family', async () => {
      mockReminderService.dismissReminder.mockResolvedValueOnce(null);

      const res = await U(request(app).post('/api/reminders/r1/dismiss')).expect(404);
      expect(res.body.message).toBe('Reminder not found');
    });

    it('should return 500 on service failure', async () => {
      mockReminderService.dismissReminder.mockRejectedValueOnce(new Error('db down'));

      const res = await U(request(app).post('/api/reminders/r1/dismiss')).expect(500);
      expect(res.body.message).toBe('Failed to dismiss reminder');
    });
  });

  describe('POST /api/reminders/:id/restore', () => {
    it('should require a user id', async () => {
      await request(app).post('/api/reminders/r1/restore').expect(401);
    });

    it('should restore a reminder', async () => {
      const restored = { id: 'r1', is_dismissed: false };
      mockReminderService.restoreReminder.mockResolvedValueOnce(restored);

      const res = await U(request(app).post('/api/reminders/r1/restore')).expect(200);

      expect(mockReminderService.restoreReminder).toHaveBeenCalledWith('user-1', 'r1');
      expect(res.body.data).toEqual(restored);
    });

    it('should 404 when the reminder is not in the family', async () => {
      mockReminderService.restoreReminder.mockResolvedValueOnce(null);

      const res = await U(request(app).post('/api/reminders/r1/restore')).expect(404);
      expect(res.body.message).toBe('Reminder not found');
    });
  });

  describe('DELETE /api/reminders/:id', () => {
    it('should require a user id', async () => {
      await request(app).delete('/api/reminders/r1').expect(401);
    });

    it('should delete a reminder', async () => {
      mockReminderService.deleteReminder.mockResolvedValueOnce(true);

      const res = await U(request(app).delete('/api/reminders/r1')).expect(200);

      expect(mockReminderService.deleteReminder).toHaveBeenCalledWith('user-1', 'r1');
      expect(res.body.message).toBe('Reminder deleted');
    });

    it('should 404 when nothing was deleted', async () => {
      mockReminderService.deleteReminder.mockResolvedValueOnce(false);

      const res = await U(request(app).delete('/api/reminders/r1')).expect(404);
      expect(res.body.message).toBe('Reminder not found');
    });

    it('should return 500 on service failure', async () => {
      mockReminderService.deleteReminder.mockRejectedValueOnce(new Error('db down'));

      const res = await U(request(app).delete('/api/reminders/r1')).expect(500);
      expect(res.body.message).toBe('Failed to delete reminder');
    });
  });
});
