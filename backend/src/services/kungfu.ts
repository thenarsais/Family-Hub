import { query, queryOne } from '../database/connection';
import * as PointsRepository from '../database/repositories/PointsRepository';

/**
 * Kung Fu tracker (FR-025 / T-22). Unlike homework/reading, multiple logs per
 * day are allowed — this is a free-form training log, not a daily check-in.
 * The belt is parent-set manually (a real belt comes from an instructor's
 * test, not an app formula). Points are flat per log type — NO streak
 * multiplier, consistent with every other section this session.
 */

export type SessionType = 'class' | 'practice';

export interface KungFuProfile {
  belt: string | null;
  beltSince: string | null;
  pointsPerClass: number;
  pointsPerPractice: number;
}

export interface KungFuLog {
  id: string;
  sessionType: SessionType;
  pointsEarned: number;
  loggedAt: string;
}

export interface KungFuToday {
  profile: KungFuProfile;
  todayLogs: KungFuLog[];
  weekCounts: { class: number; practice: number };
}

const DEFAULT_PROFILE: KungFuProfile = {
  belt: null,
  beltSince: null,
  pointsPerClass: 15,
  pointsPerPractice: 5,
};

interface ProfileRow {
  user_id: string;
  belt: string | null;
  belt_since: string | null; // selected as ::text — never depends on pg's Date parsing
  points_per_class: number;
  points_per_practice: number;
}

// belt_since is a DATE column; cast to text so it always comes back as 'YYYY-MM-DD'.
const PROFILE_COLS = 'user_id, belt, belt_since::text AS belt_since, points_per_class, points_per_practice';

const UPDATABLE_PROFILE_COLUMNS = [
  'belt',
  'belt_since',
  'points_per_class',
  'points_per_practice',
];

export class KungFuService {
  private async familyId(userId: string): Promise<string | null> {
    const row = await queryOne<{ family_id: string }>(
      `SELECT family_id FROM family_members WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [userId],
    );
    return row?.family_id ?? null;
  }

  private async familyTz(userId: string): Promise<string> {
    const row = await queryOne<{ timezone: string | null }>(
      `SELECT fs.timezone
       FROM family_members fm
       LEFT JOIN family_settings fs ON fs.family_id = fm.family_id
       WHERE fm.user_id = $1 AND fm.is_active = true
       LIMIT 1`,
      [userId],
    );
    return row?.timezone || 'America/Denver';
  }

  private async sharesFamily(caller: string, other: string): Promise<boolean> {
    if (caller === other) return true;
    const fid = await this.familyId(caller);
    if (!fid) return false;
    const row = await queryOne<{ ok: number }>(
      `SELECT 1 AS ok FROM family_members
       WHERE user_id = $1 AND family_id = $2 AND is_active = true LIMIT 1`,
      [other, fid],
    );
    return !!row;
  }

  private mapProfile(row: ProfileRow | null): KungFuProfile {
    if (!row) return { ...DEFAULT_PROFILE };
    return {
      belt: row.belt,
      beltSince: row.belt_since,
      pointsPerClass: row.points_per_class,
      pointsPerPractice: row.points_per_practice,
    };
  }

  /** A user's kung fu profile, defaulting to no belt / 15 / 5. */
  async getProfile(userId: string): Promise<KungFuProfile> {
    const row = await queryOne<ProfileRow>(
      `SELECT ${PROFILE_COLS} FROM kungfu_profiles WHERE user_id = $1`,
      [userId],
    );
    return this.mapProfile(row);
  }

  /** Every active family member's profile — the parent Manage panel. */
  async getFamilyProfiles(
    viewerId: string,
  ): Promise<Array<{ userId: string; name: string | null } & KungFuProfile>> {
    const fid = await this.familyId(viewerId);
    if (!fid) return [];
    const members = await query<{ user_id: string; name: string | null }>(
      `SELECT fm.user_id, u.name
       FROM family_members fm
       LEFT JOIN users u ON u.id = fm.user_id
       WHERE fm.family_id = $1 AND fm.is_active = true
       ORDER BY u.name`,
      [fid],
    );
    const rows = await query<ProfileRow>(
      `SELECT ${PROFILE_COLS} FROM kungfu_profiles WHERE user_id = ANY($1)`,
      [members.rows.map((m) => m.user_id)],
    );
    const byUser = new Map(rows.rows.map((r) => [r.user_id, r]));
    return members.rows.map((m) => ({
      userId: m.user_id,
      name: m.name,
      ...this.mapProfile(byUser.get(m.user_id) ?? null),
    }));
  }

  /**
   * Upsert a user's profile. The caller must share a family with
   * `targetUserId` (or be editing their own). Throws 'bad-assignee' otherwise.
   */
  async setProfile(
    callerId: string,
    targetUserId: string,
    updates: Record<string, unknown>,
  ): Promise<KungFuProfile> {
    if (!(await this.sharesFamily(callerId, targetUserId))) {
      throw new Error('bad-assignee');
    }
    const columns = Object.keys(updates || {}).filter((k) =>
      UPDATABLE_PROFILE_COLUMNS.includes(k),
    );
    const current = await this.getProfile(targetUserId);
    if (columns.length === 0) return current;

    const next = {
      belt: 'belt' in updates ? (updates.belt as string | null) : current.belt,
      belt_since:
        'belt_since' in updates ? (updates.belt_since as string | null) : current.beltSince,
      points_per_class: (updates.points_per_class as number) ?? current.pointsPerClass,
      points_per_practice:
        (updates.points_per_practice as number) ?? current.pointsPerPractice,
    };

    const row = await queryOne<ProfileRow>(
      `INSERT INTO kungfu_profiles (user_id, belt, belt_since, points_per_class, points_per_practice)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         belt = $2, belt_since = $3, points_per_class = $4, points_per_practice = $5,
         updated_at = CURRENT_TIMESTAMP
       RETURNING ${PROFILE_COLS}`,
      [targetUserId, next.belt, next.belt_since, next.points_per_class, next.points_per_practice],
    );
    if (!row) throw new Error('Failed to save kung fu profile');
    return this.mapProfile(row);
  }

  /** Today's board: profile, today's individual log entries, this week's counts. */
  async getToday(userId: string): Promise<KungFuToday> {
    const [profile, tz] = await Promise.all([this.getProfile(userId), this.familyTz(userId)]);

    const todayRows = await query<{
      id: string;
      session_type: SessionType;
      points_earned: number;
      logged_at: string;
    }>(
      `SELECT id, session_type, points_earned, logged_at FROM kungfu_logs
       WHERE user_id = $1 AND log_date = (now() AT TIME ZONE $2)::date
       ORDER BY logged_at`,
      [userId, tz],
    );

    const weekRows = await query<{ session_type: SessionType; n: string }>(
      `SELECT session_type, count(*) AS n FROM kungfu_logs
       WHERE user_id = $1
         AND date_trunc('week', log_date::timestamp)
             = date_trunc('week', (now() AT TIME ZONE $2))
       GROUP BY session_type`,
      [userId, tz],
    );
    const weekCounts = { class: 0, practice: 0 };
    for (const r of weekRows.rows) weekCounts[r.session_type] = parseInt(r.n, 10);

    return {
      profile,
      todayLogs: todayRows.rows.map((r) => ({
        id: r.id,
        sessionType: r.session_type,
        pointsEarned: r.points_earned,
        loggedAt: r.logged_at,
      })),
      weekCounts,
    };
  }

  /** Log a class or practice session for today. Throws 'bad-type' otherwise. */
  async logSession(userId: string, type: string): Promise<KungFuToday> {
    if (type !== 'class' && type !== 'practice') {
      throw new Error('bad-type');
    }
    const tz = await this.familyTz(userId);
    const profile = await this.getProfile(userId);
    const points = type === 'class' ? profile.pointsPerClass : profile.pointsPerPractice;

    const inserted = await queryOne<{ id: string }>(
      `INSERT INTO kungfu_logs (user_id, session_type, log_date, points_earned)
       VALUES ($1, $2, (now() AT TIME ZONE $3)::date, $4)
       RETURNING id`,
      [userId, type, tz, points],
    );

    if (points > 0 && inserted) {
      await PointsRepository.addPoints(
        userId,
        points,
        'kungfu',
        `Kung Fu ${type}: ${inserted.id}`,
      );
    }

    return this.getToday(userId);
  }

  /**
   * Undo one of today's logs — removes it and reverses its points. Restricted
   * to today's entries (the log_date filter is the guard). Returns false when
   * nothing matched.
   */
  async undoSession(userId: string, logId: string): Promise<boolean> {
    const tz = await this.familyTz(userId);
    const removed = await queryOne<{ session_type: SessionType; points_earned: number }>(
      `DELETE FROM kungfu_logs
       WHERE id = $1 AND user_id = $2 AND log_date = (now() AT TIME ZONE $3)::date
       RETURNING session_type, points_earned`,
      [logId, userId, tz],
    );
    if (!removed) return false;

    if (removed.points_earned > 0) {
      await PointsRepository.removePoints(
        userId,
        'kungfu',
        `Kung Fu ${removed.session_type}: ${logId}`,
      );
    }
    return true;
  }
}

let kungFuService: KungFuService | null = null;

export function getKungFuService(): KungFuService {
  if (!kungFuService) {
    kungFuService = new KungFuService();
  }
  return kungFuService;
}
