/**
 * Commute / school-run card (T-16 / FR-083 + FR-084 + FR-085).
 *
 * One row per kid's route: a label + destination address + the school's
 * arrive-by ("bell") time + a buffer. "Leave by" = arriveBy − durationInTraffic
 * − buffer, computed fresh from Google Directions (see ./directions) each
 * read, using the family's home address as the shared origin.
 *
 * Visibility (FR-084) and traffic colour (FR-085) are display logic and stay
 * on the frontend — this service just returns the numbers.
 */

import { query, queryOne } from '../database/connection';
import { getDrivingTime, isConfigured as directionsConfigured, DirectionsConfigError } from './directions';
import { partsInTz, zonedWallTimeToUtc } from './recurrence';

export interface CommuteRoute {
  id: string;
  label: string;
  destinationAddress: string;
  arriveByTime: string; // "HH:MM"
  bufferMinutes: number;
}

export interface CommuteRouteStatus extends CommuteRoute {
  durationInTrafficMin: number | null;
  distanceMi: number | null;
  leaveByTime: string | null; // "HH:MM" local to the family's timezone
  minutesUntilLeave: number | null;
  trafficDelayMin: number | null;
  error?: string;
}

export interface CommuteSummary {
  configured: boolean; // GOOGLE_MAPS_API_KEY set AND a home address configured
  homeAddress: string | null;
  noSchoolToday: boolean;
  routes: CommuteRouteStatus[];
}

interface RouteRow {
  id: string;
  label: string;
  destination_address: string;
  arrive_by_time: string;
  buffer_minutes: number;
}

function mapRoute(row: RouteRow): CommuteRoute {
  return {
    id: row.id,
    label: row.label,
    destinationAddress: row.destination_address,
    arriveByTime: row.arrive_by_time.slice(0, 5),
    bufferMinutes: row.buffer_minutes,
  };
}

export class CommuteService {
  private async familyId(userId: string): Promise<string | null> {
    const row = await queryOne<{ family_id: string }>(
      `SELECT family_id FROM family_members WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [userId],
    );
    return row?.family_id ?? null;
  }

  /** Same default as chores/habits/etc — the family this app was built for. */
  private async familyTimezone(familyId: string): Promise<string> {
    const row = await queryOne<{ timezone: string | null }>(
      `SELECT timezone FROM family_settings WHERE family_id = $1 LIMIT 1`,
      [familyId],
    );
    return row?.timezone || 'America/Denver';
  }

  private async settingsFor(familyId: string): Promise<{ homeAddress: string | null; noSchoolDate: string | null }> {
    const row = await queryOne<{ commute_home_address: string | null; commute_no_school_date: string | null }>(
      `SELECT commute_home_address, commute_no_school_date::text AS commute_no_school_date
       FROM family_settings WHERE family_id = $1 LIMIT 1`,
      [familyId],
    );
    return { homeAddress: row?.commute_home_address ?? null, noSchoolDate: row?.commute_no_school_date ?? null };
  }

  async getRoutes(userId: string): Promise<CommuteRoute[]> {
    const fid = await this.familyId(userId);
    if (!fid) return [];
    const { rows } = await query<RouteRow>(
      `SELECT id, label, destination_address, arrive_by_time::text AS arrive_by_time, buffer_minutes
       FROM commute_routes WHERE family_id = $1 ORDER BY arrive_by_time ASC`,
      [fid],
    );
    return rows.map(mapRoute);
  }

  /** The dashboard card's read model — routes plus live traffic-derived leave-by times. */
  async getSummary(userId: string): Promise<CommuteSummary> {
    const fid = await this.familyId(userId);
    if (!fid) return { configured: false, homeAddress: null, noSchoolToday: false, routes: [] };

    const [{ homeAddress, noSchoolDate }, tz, routes] = await Promise.all([
      this.settingsFor(fid),
      this.familyTimezone(fid),
      this.getRoutes(userId),
    ]);

    const today = partsInTz(new Date(), tz);
    const todayYmd = `${today.year}-${String(today.month).padStart(2, '0')}-${String(today.day).padStart(2, '0')}`;
    const noSchoolToday = !!noSchoolDate && noSchoolDate.slice(0, 10) === todayYmd;

    const configured = directionsConfigured() && !!homeAddress;
    if (!configured) {
      return {
        configured,
        homeAddress,
        noSchoolToday,
        routes: routes.map((r) => ({
          ...r,
          durationInTrafficMin: null,
          distanceMi: null,
          leaveByTime: null,
          minutesUntilLeave: null,
          trafficDelayMin: null,
        })),
      };
    }

    const now = Date.now();
    const statuses = await Promise.all(
      routes.map(async (r): Promise<CommuteRouteStatus> => {
        try {
          const drive = await getDrivingTime(homeAddress as string, r.destinationAddress);
          const [hh, mm] = r.arriveByTime.split(':').map(Number);
          const arriveAt = zonedWallTimeToUtc({ year: today.year, month: today.month, day: today.day, hour: hh, minute: mm }, tz);
          const leaveAtMs = arriveAt.getTime() - drive.durationInTrafficMin * 60_000 - r.bufferMinutes * 60_000;
          const leaveParts = partsInTz(new Date(leaveAtMs), tz);
          return {
            ...r,
            durationInTrafficMin: drive.durationInTrafficMin,
            distanceMi: drive.distanceMi,
            leaveByTime: `${String(leaveParts.hour).padStart(2, '0')}:${String(leaveParts.minute).padStart(2, '0')}`,
            minutesUntilLeave: Math.round((leaveAtMs - now) / 60_000),
            trafficDelayMin: drive.durationInTrafficMin - drive.durationMin,
          };
        } catch (err: unknown) {
          return {
            ...r,
            durationInTrafficMin: null,
            distanceMi: null,
            leaveByTime: null,
            minutesUntilLeave: null,
            trafficDelayMin: null,
            error: err instanceof DirectionsConfigError ? 'not-configured' : 'directions-failed',
          };
        }
      }),
    );

    return { configured, homeAddress, noSchoolToday, routes: statuses };
  }

  async addRoute(
    userId: string,
    input: { label: string; destinationAddress: string; arriveByTime: string; bufferMinutes?: number; familyMemberId?: string },
  ): Promise<CommuteRoute> {
    const familyId = await this.familyId(userId);
    if (!familyId) throw new Error('no-family');

    const row = await queryOne<RouteRow>(
      `INSERT INTO commute_routes (family_id, family_member_id, label, destination_address, arrive_by_time, buffer_minutes)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 10))
       RETURNING id, label, destination_address, arrive_by_time::text AS arrive_by_time, buffer_minutes`,
      [familyId, input.familyMemberId ?? null, input.label, input.destinationAddress, input.arriveByTime, input.bufferMinutes ?? null],
    );
    if (!row) throw new Error('Failed to add commute route');
    return mapRoute(row);
  }

  async updateRoute(userId: string, routeId: string, updates: Record<string, unknown>): Promise<CommuteRoute | null> {
    if (!(await this.ownsRoute(userId, routeId))) return null;

    const columnMap: Record<string, string> = {
      label: 'label',
      destinationAddress: 'destination_address',
      arriveByTime: 'arrive_by_time',
      bufferMinutes: 'buffer_minutes',
    };
    const columns = Object.keys(updates || {}).filter((k) => columnMap[k]);
    if (columns.length === 0) {
      const row = await queryOne<RouteRow>(
        `SELECT id, label, destination_address, arrive_by_time::text AS arrive_by_time, buffer_minutes
         FROM commute_routes WHERE id = $1`,
        [routeId],
      );
      return row ? mapRoute(row) : null;
    }

    const setClauses = columns.map((k, i) => `${columnMap[k]} = $${i + 2}`);
    const values = columns.map((k) => updates[k]);
    const row = await queryOne<RouteRow>(
      `UPDATE commute_routes SET ${setClauses.join(', ')}, updated_at = now()
       WHERE id = $1
       RETURNING id, label, destination_address, arrive_by_time::text AS arrive_by_time, buffer_minutes`,
      [routeId, ...values],
    );
    return row ? mapRoute(row) : null;
  }

  async deleteRoute(userId: string, routeId: string): Promise<boolean> {
    if (!(await this.ownsRoute(userId, routeId))) return false;
    await query(`DELETE FROM commute_routes WHERE id = $1`, [routeId]);
    return true;
  }

  private async ownsRoute(userId: string, routeId: string): Promise<boolean> {
    const route = await queryOne<{ family_id: string }>(`SELECT family_id FROM commute_routes WHERE id = $1`, [routeId]);
    if (!route) return false;
    const callerFamily = await this.familyId(userId);
    return !!callerFamily && callerFamily === route.family_id;
  }

  async setHomeAddress(userId: string, homeAddress: string): Promise<void> {
    const familyId = await this.familyId(userId);
    if (!familyId) throw new Error('no-family');
    await query(
      `UPDATE family_settings SET commute_home_address = $2, updated_at = CURRENT_TIMESTAMP WHERE family_id = $1`,
      [familyId, homeAddress],
    );
  }

  /** true = hide the card for today only; naturally stops applying tomorrow. */
  async setNoSchoolToday(userId: string, noSchool: boolean): Promise<void> {
    const familyId = await this.familyId(userId);
    if (!familyId) throw new Error('no-family');
    const tz = await this.familyTimezone(familyId);
    const today = partsInTz(new Date(), tz);
    const todayYmd = `${today.year}-${String(today.month).padStart(2, '0')}-${String(today.day).padStart(2, '0')}`;
    await query(
      `UPDATE family_settings SET commute_no_school_date = $2, updated_at = CURRENT_TIMESTAMP WHERE family_id = $1`,
      [familyId, noSchool ? todayYmd : null],
    );
  }
}

let commuteService: CommuteService | null = null;

export function getCommuteService(): CommuteService {
  if (!commuteService) {
    commuteService = new CommuteService();
  }
  return commuteService;
}
