import crypto from 'crypto';
import { query, queryOne } from '../database/connection';

/** One family member as shown on the kiosk profile picker. */
export interface KioskProfile {
  userId: string;
  name: string;
  role: string;
  color: string | null;
}

/** The payload a wall display boots with — no user login involved. */
export interface KioskBootstrap {
  family: { id: string; name: string };
  members: KioskProfile[];
  hasPin: boolean;
  idleMinutes: number;
}

/** A registered display, safe to list back to a parent (never the token). */
export interface KioskDevicePublic {
  id: string;
  label: string;
  lastSeenAt: string | null;
  createdAt: string;
}

/** Result of enrolling this device — `token` is shown exactly once. */
export interface EnrolledDevice {
  token: string;
  deviceId: string;
  familyId: string;
}

const PIN_RE = /^\d{4}$/;

interface DeviceRow {
  id: string;
  label: string;
  last_seen_at: string | null;
  created_at: string;
}

export class KioskService {
  private sha256(s: string): string {
    return crypto.createHash('sha256').update(s).digest('hex');
  }

  private newRawToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /** scrypt hash stored as "salthex:hashhex". */
  hashPin(pin: string): string {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(pin, salt, 64);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  /** Constant-time check of a 4-digit PIN against a stored "salt:hash". */
  verifyPinHash(pin: string, stored: string | null): boolean {
    if (!stored) return false;
    const [saltHex, hashHex] = stored.split(':');
    if (!saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    if (expected.length === 0) return false;
    let actual: Buffer;
    try {
      actual = crypto.scryptSync(pin, Buffer.from(saltHex, 'hex'), expected.length);
    } catch {
      return false;
    }
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }

  /** Active parent/admin in any family. */
  async isParent(userId: string): Promise<boolean> {
    const row = await queryOne<{ ok: number }>(
      `SELECT 1 AS ok FROM family_members
       WHERE user_id = $1 AND is_active = true AND role IN ('parent', 'admin') LIMIT 1`,
      [userId],
    );
    return !!row;
  }

  /** The caller's active family id, or null. */
  private async familyIdOf(userId: string): Promise<string | null> {
    const row = await queryOne<{ family_id: string }>(
      `SELECT family_id FROM family_members WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [userId],
    );
    return row?.family_id ?? null;
  }

  /** The caller's family id — throws 'not-allowed' unless they're an active parent/admin. */
  private async parentFamilyId(callerId: string): Promise<string> {
    const row = await queryOne<{ family_id: string }>(
      `SELECT family_id FROM family_members
       WHERE user_id = $1 AND is_active = true AND role IN ('parent', 'admin') LIMIT 1`,
      [callerId],
    );
    if (!row) throw new Error('not-allowed');
    return row.family_id;
  }

  /** Register this device for the caller's household. Parent only. */
  async enrollDevice(callerId: string, label: string): Promise<EnrolledDevice> {
    const familyId = await this.parentFamilyId(callerId);
    const token = this.newRawToken();
    const row = await queryOne<{ id: string }>(
      `INSERT INTO kiosk_devices (family_id, label, token_hash, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [familyId, (label || '').trim() || 'Family display', this.sha256(token), callerId],
    );
    if (!row) throw new Error('Failed to enrol device');
    return { token, deviceId: row.id, familyId };
  }

  /** Registered displays for the caller's household. Parent only. */
  async listDevices(callerId: string): Promise<KioskDevicePublic[]> {
    const familyId = await this.parentFamilyId(callerId);
    const res = await query<DeviceRow>(
      `SELECT id, label, last_seen_at, created_at FROM kiosk_devices
       WHERE family_id = $1 ORDER BY created_at DESC`,
      [familyId],
    );
    return res.rows.map((r) => ({
      id: r.id,
      label: r.label,
      lastSeenAt: r.last_seen_at,
      createdAt: r.created_at,
    }));
  }

  /** Revoke a display. Parent only, and only within the caller's household. */
  async revokeDevice(callerId: string, deviceId: string): Promise<boolean> {
    const familyId = await this.parentFamilyId(callerId);
    const removed = await queryOne<{ id: string }>(
      `DELETE FROM kiosk_devices WHERE id = $1 AND family_id = $2 RETURNING id`,
      [deviceId, familyId],
    );
    return !!removed;
  }

  /** Exchange a raw device token for its household id, bumping last_seen_at. */
  async resolveDevice(rawToken: string): Promise<{ familyId: string } | null> {
    if (!rawToken) return null;
    const row = await queryOne<{ family_id: string }>(
      `UPDATE kiosk_devices SET last_seen_at = now()
       WHERE token_hash = $1
       RETURNING family_id`,
      [this.sha256(rawToken)],
    );
    return row ? { familyId: row.family_id } : null;
  }

  /** The wall-display boot payload for a household. */
  async getBootstrap(familyId: string): Promise<KioskBootstrap | null> {
    const family = await queryOne<{ id: string; name: string }>(
      `SELECT id, name FROM families WHERE id = $1 LIMIT 1`,
      [familyId],
    );
    if (!family) return null;

    const membersRes = await query<{
      user_id: string;
      name: string | null;
      role: string;
      color: string | null;
    }>(
      `SELECT fm.user_id, fm.role, fm.color, u.name
       FROM family_members fm
       LEFT JOIN users u ON u.id = fm.user_id
       WHERE fm.family_id = $1 AND fm.is_active = true
       ORDER BY CASE fm.role WHEN 'admin' THEN 0 WHEN 'parent' THEN 1 ELSE 2 END, u.name`,
      [familyId],
    );

    const settings = await queryOne<{ pin_hash: string | null; kiosk_idle_minutes: number | null }>(
      `SELECT pin_hash, kiosk_idle_minutes FROM family_settings WHERE family_id = $1 LIMIT 1`,
      [familyId],
    );

    return {
      family: { id: family.id, name: family.name },
      members: membersRes.rows.map((r) => ({
        userId: r.user_id,
        name: r.name || 'Member',
        role: r.role,
        color: r.color,
      })),
      hasPin: !!settings?.pin_hash,
      idleMinutes: settings?.kiosk_idle_minutes ?? 5,
    };
  }

  /** Set (or replace) the household PIN. Parent only. Throws 'bad-pin' if not 4 digits. */
  async setPin(callerId: string, pin: string): Promise<void> {
    if (!PIN_RE.test(pin)) throw new Error('bad-pin');
    const familyId = await this.parentFamilyId(callerId);
    await query(
      `INSERT INTO family_settings (family_id, pin_hash)
       VALUES ($1, $2)
       ON CONFLICT (family_id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, updated_at = CURRENT_TIMESTAMP`,
      [familyId, this.hashPin(pin)],
    );
  }

  /** Remove the household PIN. Parent only. */
  async clearPin(callerId: string): Promise<void> {
    const familyId = await this.parentFamilyId(callerId);
    await query(
      `UPDATE family_settings SET pin_hash = NULL, updated_at = CURRENT_TIMESTAMP WHERE family_id = $1`,
      [familyId],
    );
  }

  /** Check a PIN attempt against the caller's household. Any member may attempt; rate-limited at the route. */
  async verifyPin(callerId: string, pin: string): Promise<boolean> {
    if (!PIN_RE.test(pin)) return false;
    const familyId = await this.familyIdOf(callerId);
    if (!familyId) return false;
    const row = await queryOne<{ pin_hash: string | null }>(
      `SELECT pin_hash FROM family_settings WHERE family_id = $1 LIMIT 1`,
      [familyId],
    );
    return this.verifyPinHash(pin, row?.pin_hash ?? null);
  }
}

let kioskService: KioskService | null = null;

export function getKioskService(): KioskService {
  if (!kioskService) kioskService = new KioskService();
  return kioskService;
}
