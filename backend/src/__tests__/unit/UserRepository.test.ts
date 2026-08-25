import * as UserRepository from '../../database/repositories/UserRepository';
import * as db from '../../database/db';
import * as cache from '../../database/cache';

jest.mock('../../database/db');
jest.mock('../../database/cache');

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cache.getOrSet as jest.Mock).mockImplementation((_key: string, callback: () => unknown) => callback());
    (cache.del as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getUserById', () => {
    it('should query through the cache and return the user', async () => {
      const user = { id: 'u1', email: 'a@b.com' };
      (db.queryOne as jest.Mock).mockResolvedValueOnce(user);

      const result = await UserRepository.getUserById('u1');

      expect(cache.getOrSet).toHaveBeenCalledWith('user:u1', expect.any(Function), 3600);
      expect(db.queryOne).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', ['u1']);
      expect(result).toEqual(user);
    });
  });

  describe('getUserByEmail', () => {
    it('should lowercase the email before querying', async () => {
      const user = { id: 'u1', email: 'a@b.com' };
      (db.queryOne as jest.Mock).mockResolvedValueOnce(user);

      const result = await UserRepository.getUserByEmail('A@B.COM');

      expect(db.queryOne).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['a@b.com']);
      expect(result).toEqual(user);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = [{ id: 'u1' }];
      (db.queryAll as jest.Mock).mockResolvedValueOnce(users);

      const result = await UserRepository.getAllUsers();

      expect(result).toEqual(users);
    });
  });

  describe('getParents', () => {
    it('should filter by role=parent', async () => {
      const parents = [{ id: 'p1' }];
      (db.queryAll as jest.Mock).mockResolvedValueOnce(parents);

      const result = await UserRepository.getParents();

      expect(db.queryAll).toHaveBeenCalledWith(expect.any(String), ['parent']);
      expect(result).toEqual(parents);
    });
  });

  describe('getChildrenByParentId', () => {
    it('should query through the cache with a 30-minute TTL', async () => {
      const children = [{ id: 'c1' }];
      (db.queryAll as jest.Mock).mockResolvedValueOnce(children);

      const result = await UserRepository.getChildrenByParentId('p1');

      expect(cache.getOrSet).toHaveBeenCalledWith('parent:p1:children', expect.any(Function), 1800);
      expect(result).toEqual(children);
    });
  });

  describe('createUser', () => {
    it('should insert a lowercased-email user and clear the cache', async () => {
      const created = { id: 'u1', email: 'a@b.com' };
      (db.queryOne as jest.Mock).mockResolvedValueOnce(created);

      const result = await UserRepository.createUser({
        email: 'A@B.COM',
        name: 'Alice',
        role: 'parent',
        account_type: 'primary',
        password_hash: 'hash',
      });

      const params = (db.queryOne as jest.Mock).mock.calls[0][1];
      expect(params[0]).toBe('a@b.com');
      expect(params[5]).toBeNull(); // birth_year defaults to null
      expect(params[6]).toBeNull(); // is_under_13 defaults to null
      expect(cache.del).toHaveBeenCalledWith('user:u1');
      expect(result).toEqual(created);
    });

    it('should pass through birth_year and is_under_13 when given', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ id: 'c1' });

      await UserRepository.createUser({
        email: 'kid@b.com',
        name: 'Kid',
        role: 'child',
        account_type: 'child',
        password_hash: 'hash',
        birth_year: 2018,
        is_under_13: true,
      });

      const params = (db.queryOne as jest.Mock).mock.calls[0][1];
      expect(params[5]).toBe(2018);
      expect(params[6]).toBe(true);
    });

    it('should throw when the insert returns nothing', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        UserRepository.createUser({
          email: 'a@b.com',
          name: 'Alice',
          role: 'parent',
          account_type: 'primary',
          password_hash: 'hash',
        })
      ).rejects.toThrow('Failed to create user');
    });
  });

  describe('updateUser', () => {
    it('should build SET clauses only for provided fields, and lowercase email', async () => {
      const updated = { id: 'u1', email: 'new@b.com' };
      (db.queryOne as jest.Mock).mockResolvedValueOnce(updated);

      const result = await UserRepository.updateUser('u1', { email: 'NEW@B.COM' });

      const [sql, values] = (db.queryOne as jest.Mock).mock.calls[0];
      expect(sql).toContain('email = $1');
      expect(sql).toContain('updated_at = NOW()');
      expect(sql).toContain('WHERE id = $2');
      expect(values).toEqual(['new@b.com', 'u1']);
      expect(cache.del).toHaveBeenCalledWith('user:u1');
      expect(result).toEqual(updated);
    });

    it('should build multiple SET clauses in field order', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ id: 'u1' });

      await UserRepository.updateUser('u1', { name: 'New Name', is_active: false, password_hash: 'newhash' });

      const [sql, values] = (db.queryOne as jest.Mock).mock.calls[0];
      expect(sql).toContain('name = $1');
      expect(sql).toContain('is_active = $2');
      expect(sql).toContain('password_hash = $3');
      expect(values).toEqual(['New Name', false, 'newhash', 'u1']);
    });

    it('should throw when the user is not found', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(UserRepository.updateUser('u1', { name: 'x' })).rejects.toThrow('User not found');
    });
  });

  describe('updateLastLogin', () => {
    it('should update last_login and clear the cache', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({});

      await UserRepository.updateLastLogin('u1');

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('last_login = NOW()'), ['u1']);
      expect(cache.del).toHaveBeenCalledWith('user:u1');
    });
  });

  describe('deleteUser', () => {
    it('should soft-delete and clear the cache', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({});

      await UserRepository.deleteUser('u1');

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('is_active = false'), ['u1']);
      expect(cache.del).toHaveBeenCalledWith('user:u1');
    });
  });

  describe('emailExists', () => {
    it('should return true when the email exists', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ exists: true });

      const result = await UserRepository.emailExists('A@B.COM');

      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), ['a@b.com']);
      expect(result).toBe(true);
    });

    it('should return false when there is no result', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await UserRepository.emailExists('a@b.com');

      expect(result).toBe(false);
    });
  });

  describe('verifyPassword', () => {
    it('should return true when the hash matches', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ id: 'u1', password_hash: 'hash1' });

      const result = await UserRepository.verifyPassword('u1', 'hash1');

      expect(result).toBe(true);
    });

    it('should return false when the hash does not match', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ id: 'u1', password_hash: 'hash1' });

      const result = await UserRepository.verifyPassword('u1', 'wrong-hash');

      expect(result).toBe(false);
    });

    it('should return false when the user does not exist', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await UserRepository.verifyPassword('u1', 'hash1');

      expect(result).toBe(false);
    });
  });

  describe('getUserCountByRole', () => {
    it('should parse the count', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ count: '7' });

      const result = await UserRepository.getUserCountByRole('parent');

      expect(result).toBe(7);
    });

    it('should return 0 when there is no result', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await UserRepository.getUserCountByRole('child');

      expect(result).toBe(0);
    });
  });
});
