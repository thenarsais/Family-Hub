import { KioskService } from '../../services/kiosk';
import * as connection from '../../database/connection';

jest.mock('../../database/connection');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;

describe('KioskService', () => {
  let service: KioskService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new KioskService();
  });

  describe('PIN hashing', () => {
    it('round-trips a correct 4-digit PIN', () => {
      const stored = service.hashPin('1234');
      expect(stored).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
      expect(service.verifyPinHash('1234', stored)).toBe(true);
    });

    it('rejects a wrong PIN', () => {
      const stored = service.hashPin('1234');
      expect(service.verifyPinHash('9999', stored)).toBe(false);
    });

    it('rejects against a null / malformed hash', () => {
      expect(service.verifyPinHash('1234', null)).toBe(false);
      expect(service.verifyPinHash('1234', 'not-a-hash')).toBe(false);
    });

    it('rejects when the stored hash half is unusable (scrypt throws)', () => {
      // valid-looking salt, but a hash half that yields a zero-length buffer
      expect(service.verifyPinHash('1234', 'abcd:zz')).toBe(false);
    });

    it('rejects when the stored hash length differs', () => {
      const [salt] = service.hashPin('1234').split(':');
      expect(service.verifyPinHash('1234', `${salt}:abcd`)).toBe(false);
    });

    it('produces a different salt each call', () => {
      expect(service.hashPin('1234')).not.toEqual(service.hashPin('1234'));
    });
  });

  describe('isParent', () => {
    it('is true for an active parent/admin', async () => {
      mockQueryOne.mockResolvedValueOnce({ ok: 1 });
      expect(await service.isParent('p1')).toBe(true);
    });
    it('is false otherwise', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      expect(await service.isParent('kid1')).toBe(false);
    });
  });

  describe('enrollDevice', () => {
    it('requires the caller to be a parent', async () => {
      mockQueryOne.mockResolvedValueOnce(null); // parentFamilyId → no row
      await expect(service.enrollDevice('kid1', 'Kitchen')).rejects.toThrow('not-allowed');
    });

    it('inserts a hashed token and returns the raw token once', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // parentFamilyId
        .mockResolvedValueOnce({ id: 'dev-1' }); // INSERT ... RETURNING id
      const out = await service.enrollDevice('p1', '  Kitchen wall  ');
      expect(out).toEqual({ token: expect.any(String), deviceId: 'dev-1', familyId: 'fam-1' });
      expect(out.token.length).toBeGreaterThan(20);
      const [sql, params] = mockQueryOne.mock.calls[1];
      expect(sql).toContain('INSERT INTO kiosk_devices');
      expect(params[0]).toBe('fam-1');
      expect(params[1]).toBe('Kitchen wall'); // trimmed
      expect(params[2]).toMatch(/^[0-9a-f]{64}$/); // sha256 hex, not the raw token
      expect(params[2]).not.toBe(out.token);
      expect(params[3]).toBe('p1');
    });

    it('throws if the insert returns nothing', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' })
        .mockResolvedValueOnce(null);
      await expect(service.enrollDevice('p1', 'x')).rejects.toThrow('Failed to enrol device');
    });

    it('falls back to a default label', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' })
        .mockResolvedValueOnce({ id: 'dev-1' });
      await service.enrollDevice('p1', '   ');
      expect(mockQueryOne.mock.calls[1][1][1]).toBe('Family display');
    });
  });

  describe('resolveDevice', () => {
    it('returns null for an empty or unknown token', async () => {
      expect(await service.resolveDevice('')).toBeNull();
      mockQueryOne.mockResolvedValueOnce(null);
      expect(await service.resolveDevice('nope')).toBeNull();
    });

    it('looks up by token hash and bumps last_seen_at', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-9' });
      const out = await service.resolveDevice('raw-token');
      expect(out).toEqual({ familyId: 'fam-9' });
      const [sql, params] = mockQueryOne.mock.calls[0];
      expect(sql).toContain('UPDATE kiosk_devices SET last_seen_at = now()');
      expect(params[0]).toMatch(/^[0-9a-f]{64}$/);
      expect(params[0]).not.toBe('raw-token');
    });
  });

  describe('getBootstrap', () => {
    it('returns null when the family is gone', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      expect(await service.getBootstrap('fam-x')).toBeNull();
    });

    it('assembles family + members + pin flag + idle minutes', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ id: 'fam-1', name: 'Narsai' }) // families
        .mockResolvedValueOnce({ pin_hash: 'abc:def', kiosk_idle_minutes: 7 }); // settings
      mockQuery.mockResolvedValueOnce({
        rows: [
          { user_id: 'p1', name: 'Priya', role: 'parent', color: 'priya' },
          { user_id: 'k1', name: null, role: 'child', color: null },
        ],
        rowCount: 2,
      });
      const out = await service.getBootstrap('fam-1');
      expect(out).toEqual({
        family: { id: 'fam-1', name: 'Narsai' },
        members: [
          { userId: 'p1', name: 'Priya', role: 'parent', color: 'priya' },
          { userId: 'k1', name: 'Member', role: 'child', color: null },
        ],
        hasPin: true,
        idleMinutes: 7,
      });
    });

    it('defaults idle minutes to 5 and hasPin to false with no settings row', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ id: 'fam-1', name: 'Narsai' })
        .mockResolvedValueOnce(null);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const out = await service.getBootstrap('fam-1');
      expect(out?.hasPin).toBe(false);
      expect(out?.idleMinutes).toBe(5);
    });
  });

  describe('setPin / clearPin', () => {
    it('rejects a non-4-digit PIN before touching the DB', async () => {
      await expect(service.setPin('p1', '12')).rejects.toThrow('bad-pin');
      await expect(service.setPin('p1', 'abcd')).rejects.toThrow('bad-pin');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('upserts the hash for a parent', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' }); // parentFamilyId
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
      await service.setPin('p1', '4321');
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('ON CONFLICT (family_id) DO UPDATE');
      expect(params[0]).toBe('fam-1');
      expect(params[1]).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    });

    it('clearPin requires a parent', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      await expect(service.clearPin('kid1')).rejects.toThrow('not-allowed');
    });
  });

  describe('verifyPin', () => {
    it('is false for a bad shape without a query', async () => {
      expect(await service.verifyPin('u1', '12')).toBe(false);
      expect(mockQueryOne).not.toHaveBeenCalled();
    });

    it('is false when the caller has no family', async () => {
      mockQueryOne.mockResolvedValueOnce(null); // familyIdOf
      expect(await service.verifyPin('u1', '1234')).toBe(false);
    });

    it('compares against the stored family hash', async () => {
      const stored = service.hashPin('1234');
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyIdOf
        .mockResolvedValueOnce({ pin_hash: stored }); // settings
      expect(await service.verifyPin('u1', '1234')).toBe(true);
    });

    it('is false when the family has no PIN set', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' })
        .mockResolvedValueOnce({ pin_hash: null });
      expect(await service.verifyPin('u1', '1234')).toBe(false);
    });
  });

  describe('listDevices / revokeDevice', () => {
    it('listDevices requires a parent', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      await expect(service.listDevices('kid1')).rejects.toThrow('not-allowed');
    });

    it('lists the household displays without tokens', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'd1', label: 'Kitchen', last_seen_at: null, created_at: '2026-09-09' }],
        rowCount: 1,
      });
      const out = await service.listDevices('p1');
      expect(out).toEqual([
        { id: 'd1', label: 'Kitchen', lastSeenAt: null, createdAt: '2026-09-09' },
      ]);
    });

    it('revokeDevice scopes the delete to the caller family and reports a miss', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // parentFamilyId
        .mockResolvedValueOnce(null); // DELETE ... RETURNING → nothing
      expect(await service.revokeDevice('p1', 'other-fam-device')).toBe(false);
      const [sql, params] = mockQueryOne.mock.calls[1];
      expect(sql).toContain('DELETE FROM kiosk_devices WHERE id = $1 AND family_id = $2');
      expect(params).toEqual(['other-fam-device', 'fam-1']);
    });
  });
});
