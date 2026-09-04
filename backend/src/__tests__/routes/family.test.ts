import request from 'supertest';
import express from 'express';

const mockFamilyService = {
  getUserFamily: jest.fn(),
  createFamily: jest.fn(),
  getFamilyMembers: jest.fn(),
  inviteFamilyMember: jest.fn(),
  addMember: jest.fn(),
  acceptInvitation: jest.fn(),
  updateMemberRole: jest.fn(),
  updateMemberColor: jest.fn(),
  removeMember: jest.fn(),
  getFamilySettings: jest.fn(),
  updateFamilySettings: jest.fn(),
};
jest.mock('../../services/family', () => ({ getFamilyService: () => mockFamilyService }));

const mockCreateUser = jest.fn();
const mockSupabase = {
  auth: { admin: { createUser: mockCreateUser } },
};
jest.mock('../../services/supabase', () => ({ getSupabase: () => mockSupabase }));

jest.mock('../../database/repositories/UserRepository', () => ({ createUser: jest.fn() }));
import * as UserRepository from '../../database/repositories/UserRepository';

import familyRoutes from '../../routes/family';

const app = express();
app.use(express.json());
app.use('/api/family', familyRoutes);

const CURRENT_YEAR = new Date().getFullYear();

describe('Family Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/family', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/family').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should return 404 when there is no family', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/family').set('x-user-id', 'user-1').expect(404);
      expect(res.body.message).toBe('No family found for user');
    });

    it('should return the family', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({ id: 'family-1' });

      const res = await request(app).get('/api/family').set('x-user-id', 'user-1').expect(200);
      expect(res.body.data).toEqual({ id: 'family-1' });
    });

    it('should return 500 on service failure', async () => {
      mockFamilyService.getUserFamily.mockRejectedValueOnce(new Error('down'));

      const res = await request(app).get('/api/family').set('x-user-id', 'user-1').expect(500);
      expect(res.body.message).toBe('Failed to fetch family');
    });
  });

  describe('POST /api/family', () => {
    it('should require a user id', async () => {
      const res = await request(app).post('/api/family').send({ name: 'Smiths' }).expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should require a name', async () => {
      const res = await request(app).post('/api/family').set('x-user-id', 'user-1').send({}).expect(400);
      expect(res.body.message).toBe('Missing required field: name');
    });

    it('should create a family', async () => {
      const created = { id: 'family-1' };
      mockFamilyService.createFamily.mockResolvedValueOnce(created);

      const res = await request(app)
        .post('/api/family')
        .set('x-user-id', 'user-1')
        .send({ name: 'Smiths' })
        .expect(201);

      expect(mockFamilyService.createFamily).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ name: 'Smiths' })
      );
      expect(res.body.data).toEqual(created);
    });

    it('should return 500 on service failure', async () => {
      mockFamilyService.createFamily.mockRejectedValueOnce(new Error('down'));

      const res = await request(app)
        .post('/api/family')
        .set('x-user-id', 'user-1')
        .send({ name: 'Smiths' })
        .expect(500);
      expect(res.body.message).toBe('Failed to create family');
    });
  });

  describe('GET /api/family/members', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/family/members').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should return 404 when there is no family', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/family/members').set('x-user-id', 'user-1').expect(404);
      expect(res.body.message).toBe('No family found');
    });

    it('should list family members', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({ id: 'family-1' });
      mockFamilyService.getFamilyMembers.mockResolvedValueOnce([{ id: 'm1' }]);

      const res = await request(app).get('/api/family/members').set('x-user-id', 'user-1').expect(200);
      expect(res.body.count).toBe(1);
    });
  });

  describe('POST /api/family/members/invite', () => {
    it('should require a user id', async () => {
      const res = await request(app)
        .post('/api/family/members/invite')
        .send({ email: 'a@b.com', role: 'parent' })
        .expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should require email and role', async () => {
      const res = await request(app)
        .post('/api/family/members/invite')
        .set('x-user-id', 'user-1')
        .send({})
        .expect(400);
      expect(res.body.message).toBe('Missing required fields: email, role');
    });

    it('should return 404 when there is no family', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/family/members/invite')
        .set('x-user-id', 'user-1')
        .send({ email: 'a@b.com', role: 'parent' })
        .expect(404);
      expect(res.body.message).toBe('No family found');
    });

    it('should create an invitation', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({ id: 'family-1' });
      mockFamilyService.inviteFamilyMember.mockResolvedValueOnce('token-abc');

      const res = await request(app)
        .post('/api/family/members/invite')
        .set('x-user-id', 'user-1')
        .send({ email: 'a@b.com', role: 'parent' })
        .expect(201);

      expect(mockFamilyService.inviteFamilyMember).toHaveBeenCalledWith('family-1', 'user-1', 'a@b.com', 'parent');
      expect(res.body.data).toEqual({
        invite_token: 'token-abc',
        email: 'a@b.com',
        role: 'parent',
        expires_in: '7 days',
      });
    });

    it('should return 500 on service failure', async () => {
      mockFamilyService.getUserFamily.mockRejectedValueOnce(new Error('down'));

      const res = await request(app)
        .post('/api/family/members/invite')
        .set('x-user-id', 'user-1')
        .send({ email: 'a@b.com', role: 'parent' })
        .expect(500);
      expect(res.body.message).toBe('Failed to invite member');
    });
  });

  describe('POST /api/family/children', () => {
    const validBody = { name: 'Kid', email: 'kid@b.com', password: 'pw', birth_year: CURRENT_YEAR - 8 };

    it('should require a user id', async () => {
      const res = await request(app).post('/api/family/children').send(validBody).expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should require name, email, password, and birth_year', async () => {
      const res = await request(app)
        .post('/api/family/children')
        .set('x-user-id', 'user-1')
        .send({})
        .expect(400);
      expect(res.body.message).toBe('Missing required fields: name, email, password, birth_year');
    });

    it('should reject an out-of-range birth_year', async () => {
      const res = await request(app)
        .post('/api/family/children')
        .set('x-user-id', 'user-1')
        .send({ ...validBody, birth_year: CURRENT_YEAR - 30 })
        .expect(400);
      expect(res.body.message).toBe('birth_year must be a valid year for a child (0-17 years old)');
    });

    it('should return 404 when the caller has no family', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/family/children')
        .set('x-user-id', 'user-1')
        .send(validBody)
        .expect(404);
      expect(res.body.message).toBe('No family found for this user');
    });

    it('should reject a caller who is not a parent/admin member', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({
        id: 'family-1',
        members: [{ user_id: 'user-1', role: 'child' }],
      });

      const res = await request(app)
        .post('/api/family/children')
        .set('x-user-id', 'user-1')
        .send(validBody)
        .expect(403);
      expect(res.body.message).toBe('Only a parent or admin can add a child to the family');
    });

    it('should reject when the caller is not even a member', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({ id: 'family-1', members: [] });

      await request(app)
        .post('/api/family/children')
        .set('x-user-id', 'user-1')
        .send(validBody)
        .expect(403);
    });

    it('should surface a Supabase auth error as 400', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({
        id: 'family-1',
        members: [{ user_id: 'user-1', role: 'parent' }],
      });
      mockCreateUser.mockResolvedValueOnce({ data: null, error: { message: 'email exists' } });

      const res = await request(app)
        .post('/api/family/children')
        .set('x-user-id', 'user-1')
        .send(validBody)
        .expect(400);
      expect(res.body.message).toBe('email exists');
    });

    it('should create a child account and link it to the family', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({
        id: 'family-1',
        members: [{ user_id: 'user-1', role: 'admin' }],
      });
      mockCreateUser.mockResolvedValueOnce({ data: { user: { id: 'auth-1' } }, error: null });
      (UserRepository.createUser as jest.Mock).mockResolvedValueOnce({
        id: 'child-1',
        name: 'Kid',
        email: 'kid@b.com',
        role: 'child',
      });
      mockFamilyService.addMember.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/family/children')
        .set('x-user-id', 'user-1')
        .send(validBody)
        .expect(201);

      expect(UserRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'kid@b.com', role: 'child', is_under_13: true })
      );
      expect(mockFamilyService.addMember).toHaveBeenCalledWith('family-1', 'child-1', 'child', 'user-1');
      expect(res.body.data).toEqual({
        id: 'child-1',
        name: 'Kid',
        email: 'kid@b.com',
        role: 'child',
        is_under_13: true,
      });
    });

    it('should mark is_under_13 false for a 15 year old', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({
        id: 'family-1',
        members: [{ user_id: 'user-1', role: 'parent' }],
      });
      mockCreateUser.mockResolvedValueOnce({ data: { user: { id: 'auth-1' } }, error: null });
      (UserRepository.createUser as jest.Mock).mockResolvedValueOnce({ id: 'child-1', name: 'Teen', email: 'teen@b.com', role: 'child' });
      mockFamilyService.addMember.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/family/children')
        .set('x-user-id', 'user-1')
        .send({ ...validBody, birth_year: CURRENT_YEAR - 15 })
        .expect(201);

      expect(res.body.data.is_under_13).toBe(false);
    });

    it('should return 500 on unexpected failure', async () => {
      mockFamilyService.getUserFamily.mockRejectedValueOnce(new Error('down'));

      const res = await request(app)
        .post('/api/family/children')
        .set('x-user-id', 'user-1')
        .send(validBody)
        .expect(500);
      expect(res.body.message).toBe('Failed to add child');
    });
  });

  describe('POST /api/family/members/accept-invitation', () => {
    it('should require a user id', async () => {
      const res = await request(app)
        .post('/api/family/members/accept-invitation')
        .send({ invite_token: 't1' })
        .expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should require invite_token', async () => {
      const res = await request(app)
        .post('/api/family/members/accept-invitation')
        .set('x-user-id', 'user-1')
        .send({})
        .expect(400);
      expect(res.body.message).toBe('Missing required field: invite_token');
    });

    it('should accept the invitation', async () => {
      mockFamilyService.acceptInvitation.mockResolvedValueOnce({ id: 'm1' });

      const res = await request(app)
        .post('/api/family/members/accept-invitation')
        .set('x-user-id', 'user-1')
        .send({ invite_token: 't1' })
        .expect(200);

      expect(mockFamilyService.acceptInvitation).toHaveBeenCalledWith('t1', 'user-1');
      expect(res.body.data).toEqual({ id: 'm1' });
    });

    it('should return 400 (not 500) when acceptance fails', async () => {
      mockFamilyService.acceptInvitation.mockRejectedValueOnce(new Error('token expired'));

      const res = await request(app)
        .post('/api/family/members/accept-invitation')
        .set('x-user-id', 'user-1')
        .send({ invite_token: 't1' })
        .expect(400);
      expect(res.body.message).toBe('token expired');
    });
  });

  describe('PATCH /api/family/members/:memberId/role', () => {
    it('should require a user id', async () => {
      const res = await request(app)
        .patch('/api/family/members/m1/role')
        .send({ role: 'parent' })
        .expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should require a role', async () => {
      const res = await request(app)
        .patch('/api/family/members/m1/role')
        .set('x-user-id', 'user-1')
        .send({})
        .expect(400);
      expect(res.body.message).toBe('Missing required field: role');
    });

    it('should return 404 when there is no family', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce(null);

      const res = await request(app)
        .patch('/api/family/members/m1/role')
        .set('x-user-id', 'user-1')
        .send({ role: 'parent' })
        .expect(404);
      expect(res.body.message).toBe('No family found');
    });

    it('should update the member role', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({ id: 'family-1' });
      mockFamilyService.updateMemberRole.mockResolvedValueOnce({ id: 'm1', role: 'parent' });

      const res = await request(app)
        .patch('/api/family/members/m1/role')
        .set('x-user-id', 'user-1')
        .send({ role: 'parent' })
        .expect(200);

      expect(mockFamilyService.updateMemberRole).toHaveBeenCalledWith('family-1', 'm1', 'parent');
      expect(res.body.data).toEqual({ id: 'm1', role: 'parent' });
    });
  });

  describe('PATCH /api/family/members/:memberId/color', () => {
    it('should require a user id', async () => {
      const res = await request(app)
        .patch('/api/family/members/u2/color')
        .send({ color: 'krish' })
        .expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('rejects an unknown colour key with 400', async () => {
      const res = await request(app)
        .patch('/api/family/members/u2/color')
        .set('x-user-id', 'user-1')
        .send({ color: 'chartreuse' })
        .expect(400);
      expect(res.body.message).toMatch(/color must be null or one of/);
    });

    it('returns 403 for a non parent/admin caller', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({
        id: 'family-1',
        members: [{ user_id: 'user-1', role: 'child' }],
      });

      const res = await request(app)
        .patch('/api/family/members/u2/color')
        .set('x-user-id', 'user-1')
        .send({ color: 'krish' })
        .expect(403);
      expect(res.body.message).toMatch(/parent or admin/);
    });

    it('sets a colour for a parent caller', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({
        id: 'family-1',
        members: [{ user_id: 'user-1', role: 'parent' }],
      });
      mockFamilyService.updateMemberColor.mockResolvedValueOnce({ user_id: 'u2', color: 'anand' });

      const res = await request(app)
        .patch('/api/family/members/u2/color')
        .set('x-user-id', 'user-1')
        .send({ color: 'anand' })
        .expect(200);

      expect(mockFamilyService.updateMemberColor).toHaveBeenCalledWith('family-1', 'u2', 'anand');
      expect(res.body.data).toEqual({ user_id: 'u2', color: 'anand' });
    });

    it('accepts null to clear the colour', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({
        id: 'family-1',
        members: [{ user_id: 'user-1', role: 'admin' }],
      });
      mockFamilyService.updateMemberColor.mockResolvedValueOnce({ user_id: 'u2', color: null });

      await request(app)
        .patch('/api/family/members/u2/color')
        .set('x-user-id', 'user-1')
        .send({ color: null })
        .expect(200);

      expect(mockFamilyService.updateMemberColor).toHaveBeenCalledWith('family-1', 'u2', null);
    });
  });

  describe('DELETE /api/family/members/:memberId', () => {
    it('should require a user id', async () => {
      const res = await request(app).delete('/api/family/members/m1').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should return 404 when there is no family', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce(null);

      const res = await request(app).delete('/api/family/members/m1').set('x-user-id', 'user-1').expect(404);
      expect(res.body.message).toBe('No family found');
    });

    it('should remove the member', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({ id: 'family-1' });
      mockFamilyService.removeMember.mockResolvedValueOnce(undefined);

      const res = await request(app).delete('/api/family/members/m1').set('x-user-id', 'user-1').expect(200);

      expect(mockFamilyService.removeMember).toHaveBeenCalledWith('family-1', 'm1');
      expect(res.body.message).toBe('Member removed from family');
    });
  });

  describe('GET /api/family/settings', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/family/settings').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should return 404 when there is no family', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/family/settings').set('x-user-id', 'user-1').expect(404);
      expect(res.body.message).toBe('No family found');
    });

    it('should return the family settings', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({ id: 'family-1' });
      mockFamilyService.getFamilySettings.mockResolvedValueOnce({ theme: 'dark' });

      const res = await request(app).get('/api/family/settings').set('x-user-id', 'user-1').expect(200);
      expect(res.body.data).toEqual({ theme: 'dark' });
    });
  });

  describe('PATCH /api/family/settings', () => {
    it('should require a user id', async () => {
      const res = await request(app).patch('/api/family/settings').send({ theme: 'dark' }).expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should return 404 when there is no family', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce(null);

      const res = await request(app)
        .patch('/api/family/settings')
        .set('x-user-id', 'user-1')
        .send({ theme: 'dark' })
        .expect(404);
      expect(res.body.message).toBe('No family found');
    });

    it('should update the family settings', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({ id: 'family-1' });
      mockFamilyService.updateFamilySettings.mockResolvedValueOnce({ theme: 'dark' });

      const res = await request(app)
        .patch('/api/family/settings')
        .set('x-user-id', 'user-1')
        .send({ theme: 'dark' })
        .expect(200);

      expect(mockFamilyService.updateFamilySettings).toHaveBeenCalledWith('family-1', { theme: 'dark' });
      expect(res.body.data).toEqual({ theme: 'dark' });
    });

    it('should return 500 on service failure', async () => {
      mockFamilyService.getUserFamily.mockRejectedValueOnce(new Error('down'));

      const res = await request(app)
        .patch('/api/family/settings')
        .set('x-user-id', 'user-1')
        .send({ theme: 'dark' })
        .expect(500);
      expect(res.body.message).toBe('Failed to update settings');
    });
  });
});
