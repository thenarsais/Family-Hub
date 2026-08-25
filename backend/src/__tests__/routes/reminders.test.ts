import request from 'supertest';
import express from 'express';

const mockReminderService = {
  getRemindersForUser: jest.fn(),
  getUpcomingReminders: jest.fn(),
  createReminder: jest.fn(),
  updateReminder: jest.fn(),
  dismissReminder: jest.fn(),
  deleteReminder: jest.fn(),
};

jest.mock('../../services/reminders', () => ({ getReminderService: () => mockReminderService }));

import remindersRoutes from '../../routes/reminders';

const app = express();
app.use(express.json());
app.use('/api/reminders', remindersRoutes);

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

      const res = await request(app).get('/api/reminders').set('x-user-id', 'user-1').expect(200);

      expect(mockReminderService.getRemindersForUser).toHaveBeenCalledWith('user-1', 'all');
      expect(res.body.count).toBe(1);
    });

    it('should pass through a pending filter', async () => {
      mockReminderService.getRemindersForUser.mockResolvedValueOnce([]);

      await request(app).get('/api/reminders?filter=pending').set('x-user-id', 'user-1').expect(200);

      expect(mockReminderService.getRemindersForUser).toHaveBeenCalledWith('user-1', 'pending');
    });

    it('should return 500 on service failure', async () => {
      mockReminderService.getRemindersForUser.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/reminders').set('x-user-id', 'user-1').expect(500);
      expect(res.body.message).toBe('Failed to fetch reminders');
    });
  });

  describe('GET /api/reminders/upcoming', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/reminders/upcoming').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should return upcoming reminders', async () => {
      mockReminderService.getUpcomingReminders.mockResolvedValueOnce([{ id: 'r1' }]);

      const res = await request(app).get('/api/reminders/upcoming').set('x-user-id', 'user-1').expect(200);

      expect(res.body.count).toBe(1);
    });

    it('should return 500 on service failure', async () => {
      mockReminderService.getUpcomingReminders.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/reminders/upcoming').set('x-user-id', 'user-1').expect(500);
      expect(res.body.message).toBe('Failed to fetch upcoming reminders');
    });
  });

  describe('POST /api/reminders', () => {
    it('should require a user id', async () => {
      const res = await request(app)
        .post('/api/reminders')
        .send({ title: 't', reminder_type: 'chore', scheduled_time: '2026-01-01T00:00:00Z' })
        .expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should require title, reminder_type, and scheduled_time', async () => {
      const res = await request(app)
        .post('/api/reminders')
        .set('x-user-id', 'user-1')
        .send({})
        .expect(400);
      expect(res.body.message).toBe('Missing required fields: title, reminder_type, scheduled_time');
    });

    it('should create a reminder', async () => {
      const reminder = { id: 'r1' };
      mockReminderService.createReminder.mockResolvedValueOnce(reminder);

      const res = await request(app)
        .post('/api/reminders')
        .set('x-user-id', 'user-1')
        .send({ title: 'Take out trash', reminder_type: 'chore', scheduled_time: '2026-01-01T08:00:00Z' })
        .expect(201);

      expect(mockReminderService.createReminder).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ title: 'Take out trash', reminder_type: 'chore' })
      );
      expect(res.body.data).toEqual(reminder);
    });

    it('should return 500 on service failure', async () => {
      mockReminderService.createReminder.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app)
        .post('/api/reminders')
        .set('x-user-id', 'user-1')
        .send({ title: 't', reminder_type: 'chore', scheduled_time: '2026-01-01T00:00:00Z' })
        .expect(500);
      expect(res.body.message).toBe('Failed to create reminder');
    });
  });

  describe('PATCH /api/reminders/:id', () => {
    it('should update a reminder', async () => {
      const updated = { id: 'r1', title: 'New' };
      mockReminderService.updateReminder.mockResolvedValueOnce(updated);

      const res = await request(app).patch('/api/reminders/r1').send({ title: 'New' }).expect(200);

      expect(mockReminderService.updateReminder).toHaveBeenCalledWith('r1', { title: 'New' });
      expect(res.body.data).toEqual(updated);
    });

    it('should return 500 on service failure', async () => {
      mockReminderService.updateReminder.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).patch('/api/reminders/r1').send({}).expect(500);
      expect(res.body.message).toBe('Failed to update reminder');
    });
  });

  describe('POST /api/reminders/:id/dismiss', () => {
    it('should dismiss a reminder', async () => {
      mockReminderService.dismissReminder.mockResolvedValueOnce(undefined);

      const res = await request(app).post('/api/reminders/r1/dismiss').expect(200);

      expect(mockReminderService.dismissReminder).toHaveBeenCalledWith('r1');
      expect(res.body.message).toBe('Reminder dismissed');
    });

    it('should return 500 on service failure', async () => {
      mockReminderService.dismissReminder.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).post('/api/reminders/r1/dismiss').expect(500);
      expect(res.body.message).toBe('Failed to dismiss reminder');
    });
  });

  describe('DELETE /api/reminders/:id', () => {
    it('should delete a reminder', async () => {
      mockReminderService.deleteReminder.mockResolvedValueOnce(undefined);

      const res = await request(app).delete('/api/reminders/r1').expect(200);

      expect(mockReminderService.deleteReminder).toHaveBeenCalledWith('r1');
      expect(res.body.message).toBe('Reminder deleted');
    });

    it('should return 500 on service failure', async () => {
      mockReminderService.deleteReminder.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).delete('/api/reminders/r1').expect(500);
      expect(res.body.message).toBe('Failed to delete reminder');
    });
  });
});
