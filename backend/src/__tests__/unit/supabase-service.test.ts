// Fake, non-functional fixture value -- not a real credential.
const FAKE_SERVICE_ROLE_KEY = ['fake', 'service', 'role', 'key'].join('-');

const mockSingle = jest.fn();
const mockChain: Record<string, jest.Mock> & { then?: (resolve: (v: unknown) => void) => void } = {} as never;
['from', 'select', 'insert', 'update', 'delete', 'eq'].forEach((m) => {
  mockChain[m] = jest.fn().mockReturnValue(mockChain);
});
mockChain.single = mockSingle;
let mockThenResult: { data: unknown; error: unknown } = { data: [], error: null };
mockChain.then = (resolve) => resolve(mockThenResult);

const mockAuth = {
  admin: {
    createUser: jest.fn(),
    getUserById: jest.fn(),
    updateUserById: jest.fn(),
    deleteUser: jest.fn(),
    listUsers: jest.fn(),
  },
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  getUser: jest.fn(),
  getSession: jest.fn(),
};

const mockSupabaseClient = { auth: mockAuth, from: jest.fn(() => mockChain) };
const mockCreateClient = jest.fn((_url?: string, _key?: string) => mockSupabaseClient);

jest.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }));

describe('supabase service', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: FAKE_SERVICE_ROLE_KEY,
    };
    Object.keys(mockChain).forEach((k) => {
      if (typeof mockChain[k]?.mockReturnValue === 'function') mockChain[k].mockReturnValue(mockChain);
    });
    mockThenResult = { data: [], error: null };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('initSupabase / getSupabase', () => {
    it('should throw when SUPABASE_URL is missing', () => {
      delete process.env.SUPABASE_URL;
      const { initSupabase } = require('../../services/supabase');

      expect(() => initSupabase()).toThrow('Supabase credentials not configured');
    });

    it('should throw when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      const { initSupabase } = require('../../services/supabase');

      expect(() => initSupabase()).toThrow('Supabase credentials not configured');
    });

    it('should create the client once and reuse it on subsequent calls', () => {
      const { initSupabase, getSupabase } = require('../../services/supabase');

      const client1 = initSupabase();
      const client2 = getSupabase();

      expect(mockCreateClient).toHaveBeenCalledTimes(1);
      expect(mockCreateClient).toHaveBeenCalledWith('https://test.supabase.co', FAKE_SERVICE_ROLE_KEY);
      expect(client1).toBe(client2);
    });

    it('getSupabase should initialize on first call when not yet initialized', () => {
      const { getSupabase } = require('../../services/supabase');

      getSupabase();

      expect(mockCreateClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('signUp', () => {
    it('should return the created user', async () => {
      const { signUp } = require('../../services/supabase');
      mockAuth.admin.createUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });

      const result = await signUp('a@b.com', 'pw');

      expect(mockAuth.admin.createUser).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw', email_confirm: true });
      expect(result).toEqual({ id: 'u1' });
    });

    it('should throw on error', async () => {
      const { signUp } = require('../../services/supabase');
      mockAuth.admin.createUser.mockResolvedValueOnce({ data: null, error: new Error('exists') });

      await expect(signUp('a@b.com', 'pw')).rejects.toThrow('exists');
    });
  });

  describe('signIn', () => {
    it('should return the session data', async () => {
      const { signIn } = require('../../services/supabase');
      const data = { user: { id: 'u1' }, session: { access_token: 'tok' } };
      mockAuth.signInWithPassword.mockResolvedValueOnce({ data, error: null });

      const result = await signIn('a@b.com', 'pw');

      expect(result).toEqual(data);
    });

    it('should throw on error', async () => {
      const { signIn } = require('../../services/supabase');
      mockAuth.signInWithPassword.mockResolvedValueOnce({ data: null, error: new Error('bad creds') });

      await expect(signIn('a@b.com', 'pw')).rejects.toThrow('bad creds');
    });
  });

  describe('signOut', () => {
    it('should resolve on success', async () => {
      const { signOut } = require('../../services/supabase');
      mockAuth.signOut.mockResolvedValueOnce({ error: null });

      await expect(signOut('tok')).resolves.toBeUndefined();
    });

    it('should throw on error', async () => {
      const { signOut } = require('../../services/supabase');
      mockAuth.signOut.mockResolvedValueOnce({ error: new Error('failed') });

      await expect(signOut('tok')).rejects.toThrow('failed');
    });
  });

  describe('getUser', () => {
    it('should return the user', async () => {
      const { getUser } = require('../../services/supabase');
      mockAuth.admin.getUserById.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });

      const result = await getUser('u1');

      expect(result).toEqual({ id: 'u1' });
    });

    it('should return null on error (not throw)', async () => {
      const { getUser } = require('../../services/supabase');
      mockAuth.admin.getUserById.mockResolvedValueOnce({ data: null, error: new Error('not found') });

      const result = await getUser('u1');

      expect(result).toBeNull();
    });
  });

  describe('verifyToken', () => {
    it('should return the user on a valid token', async () => {
      const { verifyToken } = require('../../services/supabase');
      mockAuth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });

      const result = await verifyToken('tok');

      expect(result).toEqual({ id: 'u1' });
    });

    it('should return null when there is an error', async () => {
      const { verifyToken } = require('../../services/supabase');
      mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('bad token') });

      const result = await verifyToken('tok');

      expect(result).toBeNull();
    });

    it('should return null when there is no user despite no error', async () => {
      const { verifyToken } = require('../../services/supabase');
      mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      const result = await verifyToken('tok');

      expect(result).toBeNull();
    });
  });

  describe('updateUserEmail', () => {
    it('should return the updated user', async () => {
      const { updateUserEmail } = require('../../services/supabase');
      mockAuth.admin.updateUserById.mockResolvedValueOnce({ data: { user: { id: 'u1', email: 'new@b.com' } }, error: null });

      const result = await updateUserEmail('u1', 'new@b.com');

      expect(mockAuth.admin.updateUserById).toHaveBeenCalledWith('u1', { email: 'new@b.com' });
      expect(result).toEqual({ id: 'u1', email: 'new@b.com' });
    });

    it('should throw on error', async () => {
      const { updateUserEmail } = require('../../services/supabase');
      mockAuth.admin.updateUserById.mockResolvedValueOnce({ data: null, error: new Error('failed') });

      await expect(updateUserEmail('u1', 'new@b.com')).rejects.toThrow('failed');
    });
  });

  describe('updateUserPassword', () => {
    it('should resolve on success', async () => {
      const { updateUserPassword } = require('../../services/supabase');
      mockAuth.admin.updateUserById.mockResolvedValueOnce({ error: null });

      await expect(updateUserPassword('u1', 'newpw')).resolves.toBeUndefined();
      expect(mockAuth.admin.updateUserById).toHaveBeenCalledWith('u1', { password: 'newpw' });
    });

    it('should throw on error', async () => {
      const { updateUserPassword } = require('../../services/supabase');
      mockAuth.admin.updateUserById.mockResolvedValueOnce({ error: new Error('failed') });

      await expect(updateUserPassword('u1', 'newpw')).rejects.toThrow('failed');
    });
  });

  describe('deleteUser', () => {
    it('should resolve on success', async () => {
      const { deleteUser } = require('../../services/supabase');
      mockAuth.admin.deleteUser.mockResolvedValueOnce({ error: null });

      await expect(deleteUser('u1')).resolves.toBeUndefined();
    });

    it('should throw on error', async () => {
      const { deleteUser } = require('../../services/supabase');
      mockAuth.admin.deleteUser.mockResolvedValueOnce({ error: new Error('failed') });

      await expect(deleteUser('u1')).rejects.toThrow('failed');
    });
  });

  describe('listUsers', () => {
    it('should return users with a default limit of 10', async () => {
      const { listUsers } = require('../../services/supabase');
      mockAuth.admin.listUsers.mockResolvedValueOnce({ data: { users: [{ id: 'u1' }] }, error: null });

      const result = await listUsers();

      expect(mockAuth.admin.listUsers).toHaveBeenCalledWith({ perPage: 10 });
      expect(result).toEqual([{ id: 'u1' }]);
    });

    it('should return an empty array on error', async () => {
      const { listUsers } = require('../../services/supabase');
      mockAuth.admin.listUsers.mockResolvedValueOnce({ data: null, error: new Error('failed') });

      const result = await listUsers(5);

      expect(mockAuth.admin.listUsers).toHaveBeenCalledWith({ perPage: 5 });
      expect(result).toEqual([]);
    });
  });

  describe('queryDatabase', () => {
    it('should return rows for a plain select', async () => {
      const { queryDatabase } = require('../../services/supabase');
      mockThenResult = { data: [{ id: 1 }], error: null };

      const result = await queryDatabase('chores');

      expect(result).toEqual([{ id: 1 }]);
    });

    it('should apply an optional query transform', async () => {
      const { queryDatabase } = require('../../services/supabase');
      mockThenResult = { data: [{ id: 1 }], error: null };
      const transform = jest.fn((q) => q.eq('user_id', 'u1'));

      await queryDatabase('chores', transform);

      expect(transform).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'u1');
    });

    it('should default to an empty array when data is null', async () => {
      const { queryDatabase } = require('../../services/supabase');
      mockThenResult = { data: null, error: null };

      const result = await queryDatabase('chores');

      expect(result).toEqual([]);
    });

    it('should throw on error', async () => {
      const { queryDatabase } = require('../../services/supabase');
      mockThenResult = { data: null, error: new Error('query failed') };

      await expect(queryDatabase('chores')).rejects.toThrow('query failed');
    });
  });

  describe('insertDatabase', () => {
    it('should return the inserted row', async () => {
      const { insertDatabase } = require('../../services/supabase');
      mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });

      const result = await insertDatabase('chores', { name: 'x' });

      expect(mockChain.insert).toHaveBeenCalledWith([{ name: 'x' }]);
      expect(result).toEqual({ id: 1 });
    });

    it('should throw on error', async () => {
      const { insertDatabase } = require('../../services/supabase');
      mockSingle.mockResolvedValueOnce({ data: null, error: new Error('insert failed') });

      await expect(insertDatabase('chores', { name: 'x' })).rejects.toThrow('insert failed');
    });
  });

  describe('updateDatabase', () => {
    it('should update by id and return the row', async () => {
      const { updateDatabase } = require('../../services/supabase');
      mockSingle.mockResolvedValueOnce({ data: { id: 1, name: 'y' }, error: null });

      const result = await updateDatabase('chores', '1', { name: 'y' });

      expect(mockChain.update).toHaveBeenCalledWith({ name: 'y' });
      expect(mockChain.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual({ id: 1, name: 'y' });
    });

    it('should throw on error', async () => {
      const { updateDatabase } = require('../../services/supabase');
      mockSingle.mockResolvedValueOnce({ data: null, error: new Error('update failed') });

      await expect(updateDatabase('chores', '1', { name: 'y' })).rejects.toThrow('update failed');
    });
  });

  describe('deleteDatabase', () => {
    it('should delete by id', async () => {
      const { deleteDatabase } = require('../../services/supabase');
      mockThenResult = { data: null, error: null };

      await expect(deleteDatabase('chores', '1')).resolves.toBeUndefined();
      expect(mockChain.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw on error', async () => {
      const { deleteDatabase } = require('../../services/supabase');
      mockThenResult = { data: null, error: new Error('delete failed') };

      await expect(deleteDatabase('chores', '1')).rejects.toThrow('delete failed');
    });
  });

  describe('healthCheck', () => {
    it('should return true when the session check succeeds', async () => {
      const { healthCheck } = require('../../services/supabase');
      mockAuth.getSession.mockResolvedValueOnce({ error: null });

      const result = await healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when the session check returns an error', async () => {
      const { healthCheck } = require('../../services/supabase');
      mockAuth.getSession.mockResolvedValueOnce({ error: new Error('down') });

      const result = await healthCheck();

      expect(result).toBe(false);
    });

    it('should return false when getSupabase throws (missing credentials)', async () => {
      delete process.env.SUPABASE_URL;
      const { healthCheck } = require('../../services/supabase');

      const result = await healthCheck();

      expect(result).toBe(false);
    });
  });
});
