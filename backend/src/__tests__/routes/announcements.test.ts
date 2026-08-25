import request from 'supertest';
import express from 'express';

const mockAnnouncementService = {
  getAnnouncementsForUser: jest.fn(),
  createAnnouncement: jest.fn(),
  updateAnnouncement: jest.fn(),
  deleteAnnouncement: jest.fn(),
  markAsRead: jest.fn(),
  getReadCount: jest.fn(),
};

jest.mock('../../services/announcements', () => ({ getAnnouncementService: () => mockAnnouncementService }));

import announcementsRoutes from '../../routes/announcements';

const app = express();
app.use(express.json());
app.use('/api/announcements', announcementsRoutes);

describe('Announcements Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/announcements', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/announcements').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should list announcements for the user', async () => {
      mockAnnouncementService.getAnnouncementsForUser.mockResolvedValueOnce([{ id: 'a1' }]);

      const res = await request(app).get('/api/announcements').set('x-user-id', 'user-1').expect(200);

      expect(res.body.count).toBe(1);
    });

    it('should return 500 on service failure', async () => {
      mockAnnouncementService.getAnnouncementsForUser.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/announcements').set('x-user-id', 'user-1').expect(500);
      expect(res.body.message).toBe('Failed to fetch announcements');
    });
  });

  describe('POST /api/announcements', () => {
    it('should require a user id', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .send({ family_id: 'f1', title: 't', message: 'm' })
        .expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should require family_id, title, and message', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('x-user-id', 'user-1')
        .send({})
        .expect(400);
      expect(res.body.message).toBe('Missing required fields: family_id, title, message');
    });

    it('should create an announcement', async () => {
      const created = { id: 'a1' };
      mockAnnouncementService.createAnnouncement.mockResolvedValueOnce(created);

      const res = await request(app)
        .post('/api/announcements')
        .set('x-user-id', 'user-1')
        .send({ family_id: 'f1', title: 'Movie night', message: 'Fun!' })
        .expect(201);

      expect(mockAnnouncementService.createAnnouncement).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ family_id: 'f1', title: 'Movie night', message: 'Fun!' })
      );
      expect(res.body.data).toEqual(created);
    });

    it('should return 500 on service failure', async () => {
      mockAnnouncementService.createAnnouncement.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app)
        .post('/api/announcements')
        .set('x-user-id', 'user-1')
        .send({ family_id: 'f1', title: 't', message: 'm' })
        .expect(500);
      expect(res.body.message).toBe('Failed to create announcement');
    });
  });

  describe('PATCH /api/announcements/:id', () => {
    it('should update an announcement', async () => {
      const updated = { id: 'a1', title: 'New' };
      mockAnnouncementService.updateAnnouncement.mockResolvedValueOnce(updated);

      const res = await request(app)
        .patch('/api/announcements/a1')
        .send({ title: 'New' })
        .expect(200);

      expect(mockAnnouncementService.updateAnnouncement).toHaveBeenCalledWith('a1', { title: 'New' });
      expect(res.body.data).toEqual(updated);
    });

    it('should return 500 on service failure', async () => {
      mockAnnouncementService.updateAnnouncement.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).patch('/api/announcements/a1').send({}).expect(500);
      expect(res.body.message).toBe('Failed to update announcement');
    });
  });

  describe('DELETE /api/announcements/:id', () => {
    it('should delete an announcement', async () => {
      mockAnnouncementService.deleteAnnouncement.mockResolvedValueOnce(undefined);

      const res = await request(app).delete('/api/announcements/a1').expect(200);

      expect(mockAnnouncementService.deleteAnnouncement).toHaveBeenCalledWith('a1');
      expect(res.body.message).toBe('Announcement deleted');
    });

    it('should return 500 on service failure', async () => {
      mockAnnouncementService.deleteAnnouncement.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).delete('/api/announcements/a1').expect(500);
      expect(res.body.message).toBe('Failed to delete announcement');
    });
  });

  describe('POST /api/announcements/:id/read', () => {
    it('should require a user id', async () => {
      const res = await request(app).post('/api/announcements/a1/read').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should mark as read', async () => {
      mockAnnouncementService.markAsRead.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/announcements/a1/read')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(mockAnnouncementService.markAsRead).toHaveBeenCalledWith('a1', 'user-1');
      expect(res.body.message).toBe('Announcement marked as read');
    });

    it('should return 500 on service failure', async () => {
      mockAnnouncementService.markAsRead.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app)
        .post('/api/announcements/a1/read')
        .set('x-user-id', 'user-1')
        .expect(500);
      expect(res.body.message).toBe('Failed to mark announcement as read');
    });
  });

  describe('GET /api/announcements/:id/readers', () => {
    it('should return the read count', async () => {
      mockAnnouncementService.getReadCount.mockResolvedValueOnce(4);

      const res = await request(app).get('/api/announcements/a1/readers').expect(200);

      expect(res.body.data).toEqual({ announcement_id: 'a1', read_count: 4 });
    });

    it('should return 500 on service failure', async () => {
      mockAnnouncementService.getReadCount.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/announcements/a1/readers').expect(500);
      expect(res.body.message).toBe('Failed to get read count');
    });
  });
});
