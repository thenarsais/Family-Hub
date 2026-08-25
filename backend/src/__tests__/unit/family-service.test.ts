import { getFamilyService } from '../../services/family';
import * as connection from '../../database/connection';

jest.mock('../../database/connection');

describe('FamilyService', () => {
  const service = getFamilyService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserFamily', () => {
    it('should return null when the user has no active family membership', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getUserFamily('user-1');

      expect(result).toBeNull();
    });

    it('should return null when the family row is missing', async () => {
      (connection.queryOne as jest.Mock)
        .mockResolvedValueOnce({ family_id: 'family-1' })
        .mockResolvedValueOnce(null);

      const result = await service.getUserFamily('user-1');

      expect(result).toBeNull();
    });

    it('should return the family with members and member_count', async () => {
      (connection.queryOne as jest.Mock)
        .mockResolvedValueOnce({ family_id: 'family-1' })
        .mockResolvedValueOnce({ id: 'family-1', name: 'Smiths' });
      (connection.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
      });

      const result = await service.getUserFamily('user-1');

      expect(result).toEqual({
        id: 'family-1',
        name: 'Smiths',
        member_count: 2,
        members: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
      });
    });

    it('should rethrow on failure', async () => {
      (connection.queryOne as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      await expect(service.getUserFamily('user-1')).rejects.toThrow('db down');
    });
  });

  describe('createFamily', () => {
    it('should create the family, admin member, and default settings', async () => {
      const family = { id: 'family-1', name: 'Smiths' };
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(family);
      (connection.query as jest.Mock).mockResolvedValue({});

      const result = await service.createFamily('user-1', { name: 'Smiths' });

      expect(result).toEqual(family);
      const createParams = (connection.queryOne as jest.Mock).mock.calls[0][1];
      expect(createParams).toEqual(['Smiths', null, 'user-1', 5, 2]);
      expect(connection.query).toHaveBeenCalledTimes(2);
      expect((connection.query as jest.Mock).mock.calls[0][1]).toEqual(['family-1', 'user-1']);
    });

    it('should throw if the insert returns nothing', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.createFamily('user-1', { name: 'x' })).rejects.toThrow('Failed to create family');
    });

    it('should rethrow on failure', async () => {
      (connection.queryOne as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      await expect(service.createFamily('user-1', { name: 'x' })).rejects.toThrow('db down');
    });
  });

  describe('getFamilyMembers', () => {
    it('should return active members ordered by role', async () => {
      const rows = [{ user_id: 'u1' }];
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows });

      const result = await service.getFamilyMembers('family-1');

      expect(result).toEqual(rows);
    });

    it('should rethrow on failure', async () => {
      (connection.query as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      await expect(service.getFamilyMembers('family-1')).rejects.toThrow('db down');
    });
  });

  describe('inviteFamilyMember', () => {
    it('should create an invitation and return the token', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce({ invite_token: 'tok-abc' });

      const result = await service.inviteFamilyMember('family-1', 'user-1', 'a@b.com', 'parent');

      expect(result).toBe('tok-abc');
      const params = (connection.queryOne as jest.Mock).mock.calls[0][1];
      expect(params[0]).toBe('family-1');
      expect(params[1]).toBe('a@b.com');
      expect(params[3]).toBe('parent');
    });

    it('should throw if the insert returns nothing', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.inviteFamilyMember('family-1', 'user-1', 'a@b.com', 'parent')
      ).rejects.toThrow('Failed to create invitation');
    });

    it('should rethrow on failure', async () => {
      (connection.queryOne as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      await expect(
        service.inviteFamilyMember('family-1', 'user-1', 'a@b.com', 'parent')
      ).rejects.toThrow('db down');
    });
  });

  describe('acceptInvitation', () => {
    it('should throw when the invitation does not exist', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.acceptInvitation('tok', 'user-1')).rejects.toThrow('Invalid or expired invitation');
    });

    it('should throw when the invitation is expired', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce({
        family_id: 'family-1',
        role: 'parent',
        inviting_parent_id: 'user-0',
        expires_at: new Date(Date.now() - 1000).toISOString(),
      });

      await expect(service.acceptInvitation('tok', 'user-1')).rejects.toThrow('Invitation expired');
    });

    it('should create the member and mark the invitation accepted', async () => {
      (connection.queryOne as jest.Mock)
        .mockResolvedValueOnce({
          family_id: 'family-1',
          role: 'parent',
          inviting_parent_id: 'user-0',
          expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        })
        .mockResolvedValueOnce({ id: 'member-1', family_id: 'family-1', user_id: 'user-1', role: 'parent' });
      (connection.query as jest.Mock).mockResolvedValueOnce({});

      const result = await service.acceptInvitation('tok', 'user-1');

      expect(result).toEqual({ id: 'member-1', family_id: 'family-1', user_id: 'user-1', role: 'parent' });
      expect(connection.query).toHaveBeenCalledWith(expect.stringContaining('accepted_at'), ['tok']);
    });

    it('should throw if the member insert returns nothing', async () => {
      (connection.queryOne as jest.Mock)
        .mockResolvedValueOnce({
          family_id: 'family-1',
          role: 'parent',
          inviting_parent_id: 'user-0',
          expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        })
        .mockResolvedValueOnce(null);

      await expect(service.acceptInvitation('tok', 'user-1')).rejects.toThrow('Failed to add family member');
    });
  });

  describe('addMember', () => {
    it('should insert a member directly', async () => {
      const member = { id: 'member-1' };
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(member);

      const result = await service.addMember('family-1', 'user-1', 'child', 'user-0');

      expect(result).toEqual(member);
      expect((connection.queryOne as jest.Mock).mock.calls[0][1]).toEqual(['family-1', 'user-1', 'child', 'user-0']);
    });

    it('should throw if the insert returns nothing', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.addMember('family-1', 'user-1', 'child', 'user-0')).rejects.toThrow(
        'Failed to add family member'
      );
    });
  });

  describe('updateMemberRole', () => {
    it('should update and return the member', async () => {
      const updated = { id: 'member-1', role: 'admin' };
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(updated);

      const result = await service.updateMemberRole('family-1', 'user-1', 'admin');

      expect(result).toEqual(updated);
    });

    it('should rethrow on failure', async () => {
      (connection.queryOne as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      await expect(service.updateMemberRole('family-1', 'user-1', 'admin')).rejects.toThrow('db down');
    });
  });

  describe('removeMember', () => {
    it('should soft-delete the member', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({});

      await service.removeMember('family-1', 'user-1');

      expect(connection.query).toHaveBeenCalledWith(expect.stringContaining('is_active = false'), [
        'family-1',
        'user-1',
      ]);
    });

    it('should rethrow on failure', async () => {
      (connection.query as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      await expect(service.removeMember('family-1', 'user-1')).rejects.toThrow('db down');
    });
  });

  describe('getFamilySettings', () => {
    it('should return the settings row', async () => {
      const settings = { family_id: 'family-1', theme: 'dark' };
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(settings);

      const result = await service.getFamilySettings('family-1');

      expect(result).toEqual(settings);
    });

    it('should rethrow on failure', async () => {
      (connection.queryOne as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      await expect(service.getFamilySettings('family-1')).rejects.toThrow('db down');
    });
  });

  describe('updateFamilySettings', () => {
    it('should only update whitelisted columns', async () => {
      const updated = { family_id: 'family-1', theme: 'dark' };
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(updated);

      const result = await service.updateFamilySettings('family-1', {
        theme: 'dark',
        family_id: 'attacker-controlled',
      } as never);

      const [sql, params] = (connection.queryOne as jest.Mock).mock.calls[0];
      expect(sql).toContain('theme = $2');
      expect(sql.match(/SET([^]*?)WHERE/)?.[1]).not.toContain('family_id');
      expect(params).toEqual(['family-1', 'dark']);
      expect(result).toEqual(updated);
    });

    it('should just fetch current settings when no updatable columns are given', async () => {
      const settings = { family_id: 'family-1' };
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(settings);

      const result = await service.updateFamilySettings('family-1', {} as never);

      expect(connection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM family_settings'),
        ['family-1']
      );
      expect(result).toEqual(settings);
    });

    it('should rethrow on failure', async () => {
      (connection.queryOne as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      await expect(service.updateFamilySettings('family-1', { theme: 'dark' } as never)).rejects.toThrow('db down');
    });
  });
});
