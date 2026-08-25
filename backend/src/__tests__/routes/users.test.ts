import request from 'supertest';
import express from 'express';

jest.mock('../../database/repositories/UserRepository', () => ({
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  getChildrenByParentId: jest.fn(),
  getParents: jest.fn(),
  getAllUsers: jest.fn(),
  deleteUser: jest.fn(),
}));
import * as UserRepository from '../../database/repositories/UserRepository';

import usersRoutes from '../../routes/users';

const app = express();
app.use(express.json());
app.use('/api/users', usersRoutes);

const AUTH = 'Bearer test-token';

describe('Users Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('auth middleware', () => {
    it('should reject requests without a Bearer token', async () => {
      const res = await request(app).get('/api/users/me?userId=u1').expect(401);
      expect(res.body.error).toBe('Missing authorization header');
    });
  });

  describe('GET /api/users/me', () => {
    it('should require a userId query param', async () => {
      const res = await request(app).get('/api/users/me').set('Authorization', AUTH).expect(400);
      expect(res.body.error).toBe('Missing userId parameter');
    });

    it('should return 404 when the user does not exist', async () => {
      (UserRepository.getUserById as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app).get('/api/users/me?userId=u1').set('Authorization', AUTH).expect(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return the current user profile', async () => {
      (UserRepository.getUserById as jest.Mock).mockResolvedValueOnce({
        id: 'u1',
        email: 'a@b.com',
        name: 'Alice',
        role: 'parent',
        account_type: 'parent',
        created_at: '2026-01-01',
        updated_at: '2026-01-02',
      });

      const res = await request(app).get('/api/users/me?userId=u1').set('Authorization', AUTH).expect(200);
      expect(res.body.user.email).toBe('a@b.com');
    });

    it('should return 500 on repository failure', async () => {
      (UserRepository.getUserById as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/users/me?userId=u1').set('Authorization', AUTH).expect(500);
      expect(res.body.error).toBe('Failed to get user');
    });
  });

  describe('GET /api/users/role/parents', () => {
    it('should list parent users', async () => {
      (UserRepository.getParents as jest.Mock).mockResolvedValueOnce([
        { id: 'p1', name: 'Alice', email: 'a@b.com', account_type: 'parent', created_at: '2026-01-01' },
      ]);

      const res = await request(app).get('/api/users/role/parents').set('Authorization', AUTH).expect(200);
      expect(res.body.count).toBe(1);
    });

    it('should return 500 on repository failure', async () => {
      (UserRepository.getParents as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/users/role/parents').set('Authorization', AUTH).expect(500);
      expect(res.body.error).toBe('Failed to get parents');
    });
  });

  describe('GET /api/users', () => {
    it('should list all users', async () => {
      (UserRepository.getAllUsers as jest.Mock).mockResolvedValueOnce([
        { id: 'u1', name: 'Alice', email: 'a@b.com', role: 'parent', created_at: '2026-01-01' },
      ]);

      const res = await request(app).get('/api/users').set('Authorization', AUTH).expect(200);
      expect(res.body.count).toBe(1);
    });

    it('should return 500 on repository failure', async () => {
      (UserRepository.getAllUsers as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/users').set('Authorization', AUTH).expect(500);
      expect(res.body.error).toBe('Failed to get users');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return 404 when the user does not exist', async () => {
      (UserRepository.getUserById as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app).get('/api/users/u1').set('Authorization', AUTH).expect(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return the user', async () => {
      (UserRepository.getUserById as jest.Mock).mockResolvedValueOnce({
        id: 'u1',
        email: 'a@b.com',
        name: 'Alice',
        role: 'parent',
        created_at: '2026-01-01',
      });

      const res = await request(app).get('/api/users/u1').set('Authorization', AUTH).expect(200);
      expect(res.body.user.id).toBe('u1');
    });

    it('should return 500 on repository failure', async () => {
      (UserRepository.getUserById as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/users/u1').set('Authorization', AUTH).expect(500);
      expect(res.body.error).toBe('Failed to get user');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should require at least one field to update', async () => {
      const res = await request(app).put('/api/users/u1').set('Authorization', AUTH).send({}).expect(400);
      expect(res.body.error).toBe('No fields to update');
    });

    it('should update only the provided fields', async () => {
      (UserRepository.updateUser as jest.Mock).mockResolvedValueOnce({
        id: 'u1',
        email: 'new@b.com',
        name: 'Alice',
        role: 'parent',
      });

      const res = await request(app)
        .put('/api/users/u1')
        .set('Authorization', AUTH)
        .send({ email: 'new@b.com' })
        .expect(200);

      expect(UserRepository.updateUser).toHaveBeenCalledWith('u1', { email: 'new@b.com' });
      expect(res.body.user.email).toBe('new@b.com');
    });

    it('should return 500 on repository failure', async () => {
      (UserRepository.updateUser as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      const res = await request(app)
        .put('/api/users/u1')
        .set('Authorization', AUTH)
        .send({ name: 'New' })
        .expect(500);
      expect(res.body.error).toBe('Failed to update user');
    });
  });

  describe('GET /api/users/:parentId/children', () => {
    it('should list a parent\'s children', async () => {
      (UserRepository.getChildrenByParentId as jest.Mock).mockResolvedValueOnce([
        { id: 'c1', name: 'Kid', email: 'kid@b.com', role: 'child', created_at: '2026-01-01' },
      ]);

      const res = await request(app).get('/api/users/p1/children').set('Authorization', AUTH).expect(200);
      expect(res.body.children).toHaveLength(1);
      expect(res.body.parent_id).toBe('p1');
    });

    it('should return 500 on repository failure', async () => {
      (UserRepository.getChildrenByParentId as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/users/p1/children').set('Authorization', AUTH).expect(500);
      expect(res.body.error).toBe('Failed to get children');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete the user', async () => {
      (UserRepository.deleteUser as jest.Mock).mockResolvedValueOnce(undefined);

      const res = await request(app).delete('/api/users/u1').set('Authorization', AUTH).expect(200);
      expect(res.body.message).toBe('User deleted successfully');
    });

    it('should return 500 on repository failure', async () => {
      (UserRepository.deleteUser as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).delete('/api/users/u1').set('Authorization', AUTH).expect(500);
      expect(res.body.error).toBe('Failed to delete user');
    });
  });
});
