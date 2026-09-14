/**
 * Commute / trips card (T-16 + T-26 / FR-083 + FR-084 + FR-085 + FR-158).
 *
 * Two kinds of route:
 *  - FIXED-SCHEDULE (the original T-16 shape): a stored arrive-by ("bell")
 *    time, applies every weekday. `event_title_pattern` is null.
 *  - EVENT-LINKED (T-26): `event_title_pattern` is set instead of a stored
 *    arrive-by time. Each day, the summary checks whether a calendar event
 *    with that exact title occurs today — if so, the route's arrive-by is
 *    that event's own start time and its destination is the event's own
 *    `location` (falling back to the route's saved destination when the
 *    event has none); if not, the route simply doesn't appear that day. A
 *    cancelled/moved Google event naturally drops out with no extra logic.
 *
 * "Leave by" = arriveBy − durationInTraffic − buffer, computed fresh from
 * Google Directions (see ./directions) each read, using the family's home
 * address as the default origin (overridable per-route via origin_override
 * for the rare case of leaving from somewhere other than home).
 *
 * Visibility (FR-084) and traffic colour (FR-085) are display logic and stay
 * on the frontend — this service just returns the numbers.
 */

import { query, queryOne } from '../database/connection';
import { getDrivingTime, isConfigured as directionsConfigured, DirectionsConfigError } from './directions';
import { partsInTz, zonedWallTimeToUtc } from './recurrence';

interface DateParts {
  year: number;
  month: number;
  day: number;
}
import { getGoogleOAuthService, type GoogleCalendarEvent } from './google-oauth';
import { getCalendarService } from './calendar';

export interface CommuteRoute {
  id: string;
  label: string;
  destinationAddress: string;
  arriveByTime: string | null; // "HH:MM" — null for event-linked routes
  bufferMinutes: number;
  familyMemberId: string | null;
  eventTitlePattern: string | null;
  originOverride: string | null;
}

export interface CommuteRouteStatus extends CommuteRoute {
  durationInTrafficMin: number | null;
  distanceMi: number | null;
  leaveByTime: string | null; // "HH:MM" local to the family's timezone
  minutesUntilLeave: number | null;
  trafficDelayMin: number | null;
  /** Today's actually-matched calendar event title, for event-linked routes. */
  matchedEventTitle: string | null;
  error?: string;
}

export interface CommuteSummary {
  configured: boolean; // GOOGLE_MAPS_API_KEY set AND a home address configured
  homeAddress: string | null;
  noSchoolToday: boolean;
  routes: CommuteRouteStatus[];
}

export interface TripSuggestion {
  titlePattern: string;
  matchedKeyword: string;
  occurrenceCount: number;
  nextDate: string | null; // "YYYY-MM-DD"
  suggestedLocation: string | null;
}

interface RouteRow {
  id: string;
  label: string;
  destination_address: string;
  arrive_by_time: string | null;
  buffer_minutes: number;
  family_member_id: string | null;
  event_title_pattern: string | null;
  origin_override: string | null;
}

function mapRoute(row: RouteRow): CommuteRoute {
  return {
    id: row.id,
    label: row.label,
    destinationAddress: row.destination_address,
    arriveByTime: row.arrive_by_time ? row.arrive_by_time.slice(0, 5) : null,
    bufferMinutes: row.buffer_minutes,
    familyMemberId: row.family_member_id,
    eventTitlePattern: row.event_title_pattern,
    originOverride: row.origin_override,
  };
}

const ROUTE_COLUMNS = `id, label, destination_address, arrive_by_time::text AS arrive_by_time,
       buffer_minutes, family_member_id, event_title_pattern, origin_override`;

/**
 * T-26 keyword list, ordered most- to least-specific — only used to pick
 * which matched word names a suggestion prompt. A title that matches several
 * keywords still produces exactly one suggestion (deduped by event).
 */
const TRIP_KEYWORDS = [
  'cardiologist', 'orthodontist', 'orthopedist', 'dermatologist', 'optometrist', 'ophthalmologist',
  'pediatrician', 'physical therapy', 'therapist', 'dentist', 'doctor',
  'swim', 'swimming', 'kung fu', 'martial arts', 'karate', 'taekwondo',
  'piano', 'dance', 'gymnastics',
  'practice', 'lesson', 'lessons', 'appointment', 'class',
];

function matchKeyword(title: string): string | null {
  const lower = title.toLowerCase();
  for (const kw of TRIP_KEYWORDS) {
    if (lower.includes(kw)) return kw;
  }
  return null;
}

/** Skip video-call events — a URL in the location field, not a physical address. */
function isVirtualLocation(location: string | null | undefined): boolean {
  return !!location && /^https?:\/\//i.test(location.trim());
}

function ymd(p: { year: number; month: number; day: number }): string {
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Pure calendar-day arithmetic (no timezone attached) — safe for rolling a Y/M/D forward. */
function addDays(p: DateParts, days: number): DateParts {
  const dt = new Date(Date.UTC(p.year, p.month - 1, p.day + days));
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
}

interface CandidateRoute {
  id: string;
  label: string;
  destinationAddress: string;
  arriveByTime: string; // effective "HH:MM"
  bufferMinutes: number;
  familyMemberId: string | null;
  eventTitlePattern: string | null;
  originOverride: string | null;
  matchedEventTitle: string | null;
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

  /** T-26: the family member whose Google account is connected, if any — the source for both the live calendar scan and event-linked leave-by resolution. */
  private async connectedGoogleUserId(familyId: string): Promise<string | null> {
    const row = await queryOne<{ user_id: string }>(
      `SELECT ui.user_id
         FROM user_integrations ui
         JOIN family_members fm ON fm.user_id::text = ui.user_id
        WHERE fm.family_id = $1 AND ui.provider = 'google_calendar' AND ui.is_active = true
        LIMIT 1`,
      [familyId],
    );
    return row?.user_id ?? null;
  }

  async getRoutes(userId: string): Promise<CommuteRoute[]> {
    const fid = await this.familyId(userId);
    if (!fid) return [];
    const { rows } = await query<RouteRow>(
      `SELECT ${ROUTE_COLUMNS} FROM commute_routes WHERE family_id = $1 ORDER BY arrive_by_time ASC NULLS LAST, created_at ASC`,
      [fid],
    );
    return rows.map(mapRoute);
  }

  /** T-26: event-title patterns a parent has declined a suggestion for — never re-suggested. */
  private async getDismissedPatterns(familyId: string): Promise<Set<string>> {
    const { rows } = await query<{ title_pattern: string }>(
      `SELECT title_pattern FROM commute_dismissed_suggestions WHERE family_id = $1`,
      [familyId],
    );
    return new Set(rows.map((r) => r.title_pattern));
  }

  /**
   * T-26 — scans the next 14 days of the connected Google Calendar for
   * events whose title matches a trip keyword and isn't already a confirmed
   * route or a dismissed pattern. All-day and virtual (video-link location)
   * events are excluded — no clock time / no physical trip respectively.
   */
  async getSuggestions(userId: string): Promise<TripSuggestion[]> {
    const fid = await this.familyId(userId);
    if (!fid) return [];

    const connectedUserId = await this.connectedGoogleUserId(fid);
    if (!connectedUserId) return [];

    const [routes, dismissed] = await Promise.all([this.getRoutes(userId), this.getDismissedPatterns(fid)]);
    const confirmed = new Set(routes.filter((r) => r.eventTitlePattern).map((r) => r.eventTitlePattern!.trim().toLowerCase()));

    let events: GoogleCalendarEvent[];
    try {
      const now = new Date();
      const scanEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      events = await getGoogleOAuthService().getCalendarEvents(connectedUserId, now.toISOString(), scanEnd.toISOString(), 250);
    } catch (err: unknown) {
      console.warn('Failed to scan calendar for commute suggestions:', err);
      return [];
    }

    const byPattern = new Map<string, { originalTitle: string; keyword: string; location: string | null; dates: string[] }>();
    for (const ev of events) {
      if (!ev.start?.dateTime) continue; // all-day event -- no clock time to derive a leave-by from
      if (isVirtualLocation(ev.location)) continue;
      const title = (ev.summary || '').trim();
      if (!title) continue;
      const normalized = title.toLowerCase();
      if (confirmed.has(normalized) || dismissed.has(normalized)) continue;
      const keyword = matchKeyword(title);
      if (!keyword) continue;

      const entry = byPattern.get(normalized) ?? { originalTitle: title, keyword, location: ev.location ?? null, dates: [] };
      entry.dates.push(ev.start.dateTime.slice(0, 10));
      byPattern.set(normalized, entry);
    }

    return [...byPattern.values()]
      .map((e): TripSuggestion => ({
        titlePattern: e.originalTitle,
        matchedKeyword: e.keyword,
        occurrenceCount: e.dates.length,
        nextDate: e.dates[0] ?? null,
        suggestedLocation: e.location,
      }))
      .sort((a, b) => (a.nextDate ?? '').localeCompare(b.nextDate ?? ''));
  }

  /** T-26 — remember a declined suggestion by its normalized title so it doesn't keep re-asking. */
  async dismissSuggestion(userId: string, titlePattern: string): Promise<void> {
    const familyId = await this.familyId(userId);
    if (!familyId) throw new Error('no-family');
    await query(
      `INSERT INTO commute_dismissed_suggestions (family_id, title_pattern)
       VALUES ($1, $2)
       ON CONFLICT (family_id, title_pattern) DO NOTHING`,
      [familyId, titlePattern.trim().toLowerCase()],
    );
  }

  /**
   * T-26 — for today only: which event-linked routes have a matching
   * calendar event today, and what that event's real start time / location /
   * "Going" person is. Routes with no match today are simply omitted.
   */
  private async resolveEventLinkedToday(
    familyId: string,
    eventLinked: CommuteRoute[],
    today: ReturnType<typeof partsInTz>,
    tz: string,
  ): Promise<CandidateRoute[]> {
    if (eventLinked.length === 0) return [];
    const connectedUserId = await this.connectedGoogleUserId(familyId);
    if (!connectedUserId) return [];

    try {
      const tomorrow = addDays(today, 1);
      const dayStart = zonedWallTimeToUtc({ ...today, hour: 0, minute: 0 }, tz);
      const dayEnd = zonedWallTimeToUtc({ ...tomorrow, hour: 0, minute: 0 }, tz);
      const [events, eventPeople] = await Promise.all([
        getGoogleOAuthService().getCalendarEvents(connectedUserId, dayStart.toISOString(), dayEnd.toISOString(), 250),
        getCalendarService().getEventPeople(familyId),
      ]);

      const candidates: CandidateRoute[] = [];
      for (const r of eventLinked) {
        const pattern = r.eventTitlePattern!.trim().toLowerCase();
        const match = events.find((ev) => ev.start?.dateTime && (ev.summary || '').trim().toLowerCase() === pattern);
        if (!match?.start?.dateTime) continue; // doesn't occur today -- omit entirely

        // T-26: live "Going" tag on today's event wins over the route's saved default person.
        const goingTag = match.id ? eventPeople.find((p) => p.event_id === match.id && p.role === 'going') : undefined;

        candidates.push({
          id: r.id,
          label: r.label,
          destinationAddress: match.location || r.destinationAddress,
          arriveByTime: match.start.dateTime.slice(11, 16),
          bufferMinutes: r.bufferMinutes,
          familyMemberId: goingTag?.family_member_id ?? r.familyMemberId,
          eventTitlePattern: r.eventTitlePattern,
          originOverride: r.originOverride,
          matchedEventTitle: match.summary || r.label,
        });
      }
      return candidates;
    } catch (err: unknown) {
      console.warn('Failed to resolve event-linked commute routes for today:', err);
      return []; // event-linked routes just don't show today -- fixed routes are unaffected
    }
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
    const todayYmd = ymd(today);
    const noSchoolToday = !!noSchoolDate && noSchoolDate.slice(0, 10) === todayYmd;

    const configured = directionsConfigured() && !!homeAddress;
    if (!configured) {
      // Event-linked routes need a live calendar match to mean anything, and the
      // frontend doesn't render the route list at all while unconfigured (it shows
      // the "add a home address" message instead) — skip the calendar scan entirely.
      return {
        configured,
        homeAddress,
        noSchoolToday,
        routes: routes
          .filter((r) => !r.eventTitlePattern)
          .map((r) => ({
            ...r,
            matchedEventTitle: null,
            durationInTrafficMin: null,
            distanceMi: null,
            leaveByTime: null,
            minutesUntilLeave: null,
            trafficDelayMin: null,
          })),
      };
    }

    const fixed = routes.filter((r) => !r.eventTitlePattern);
    const eventLinked = routes.filter((r) => r.eventTitlePattern);

    const fixedCandidates: CandidateRoute[] = fixed.map((r) => ({
      id: r.id,
      label: r.label,
      destinationAddress: r.destinationAddress,
      arriveByTime: r.arriveByTime as string,
      bufferMinutes: r.bufferMinutes,
      familyMemberId: r.familyMemberId,
      eventTitlePattern: null,
      originOverride: r.originOverride,
      matchedEventTitle: null,
    }));
    const eventCandidates = await this.resolveEventLinkedToday(fid, eventLinked, today, tz);
    const candidates = [...fixedCandidates, ...eventCandidates];

    const now = Date.now();
    const statuses = await Promise.all(
      candidates.map(async (r): Promise<CommuteRouteStatus> => {
        const origin = r.originOverride || (homeAddress as string);
        try {
          const drive = await getDrivingTime(origin, r.destinationAddress);
          const [hh, mm] = r.arriveByTime.split(':').map(Number);
          const arriveAt = zonedWallTimeToUtc({ year: today.year, month: today.month, day: today.day, hour: hh, minute: mm }, tz);
          const leaveAtMs = arriveAt.getTime() - drive.durationInTrafficMin * 60_000 - r.bufferMinutes * 60_000;
          const leaveParts = partsInTz(new Date(leaveAtMs), tz);
          return {
            id: r.id,
            label: r.label,
            destinationAddress: r.destinationAddress,
            arriveByTime: r.arriveByTime,
            bufferMinutes: r.bufferMinutes,
            familyMemberId: r.familyMemberId,
            eventTitlePattern: r.eventTitlePattern,
            originOverride: r.originOverride,
            matchedEventTitle: r.matchedEventTitle,
            durationInTrafficMin: drive.durationInTrafficMin,
            distanceMi: drive.distanceMi,
            leaveByTime: `${String(leaveParts.hour).padStart(2, '0')}:${String(leaveParts.minute).padStart(2, '0')}`,
            minutesUntilLeave: Math.round((leaveAtMs - now) / 60_000),
            trafficDelayMin: drive.durationInTrafficMin - drive.durationMin,
          };
        } catch (err: unknown) {
          return {
            id: r.id,
            label: r.label,
            destinationAddress: r.destinationAddress,
            arriveByTime: r.arriveByTime,
            bufferMinutes: r.bufferMinutes,
            familyMemberId: r.familyMemberId,
            eventTitlePattern: r.eventTitlePattern,
            originOverride: r.originOverride,
            matchedEventTitle: r.matchedEventTitle,
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

    // Soonest-to-leave first, regardless of whether it's a fixed or event-linked route.
    statuses.sort((a, b) => (a.minutesUntilLeave ?? Infinity) - (b.minutesUntilLeave ?? Infinity));

    return { configured, homeAddress, noSchoolToday, routes: statuses };
  }

  async addRoute(
    userId: string,
    input: {
      label: string;
      destinationAddress: string;
      arriveByTime?: string;
      bufferMinutes?: number;
      familyMemberId?: string;
      eventTitlePattern?: string;
      originOverride?: string;
    },
  ): Promise<CommuteRoute> {
    const familyId = await this.familyId(userId);
    if (!familyId) throw new Error('no-family');

    const row = await queryOne<RouteRow>(
      `INSERT INTO commute_routes
         (family_id, family_member_id, label, destination_address, arrive_by_time, buffer_minutes, event_title_pattern, origin_override)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 10), $7, $8)
       RETURNING ${ROUTE_COLUMNS}`,
      [
        familyId,
        input.familyMemberId ?? null,
        input.label,
        input.destinationAddress,
        input.arriveByTime ?? null,
        input.bufferMinutes ?? null,
        input.eventTitlePattern ?? null,
        input.originOverride ?? null,
      ],
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
      familyMemberId: 'family_member_id',
      eventTitlePattern: 'event_title_pattern',
      originOverride: 'origin_override',
    };
    const columns = Object.keys(updates || {}).filter((k) => columnMap[k]);
    if (columns.length === 0) {
      const row = await queryOne<RouteRow>(`SELECT ${ROUTE_COLUMNS} FROM commute_routes WHERE id = $1`, [routeId]);
      return row ? mapRoute(row) : null;
    }

    const setClauses = columns.map((k, i) => `${columnMap[k]} = $${i + 2}`);
    const values = columns.map((k) => updates[k]);
    const row = await queryOne<RouteRow>(
      `UPDATE commute_routes SET ${setClauses.join(', ')}, updated_at = now()
       WHERE id = $1
       RETURNING ${ROUTE_COLUMNS}`,
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
    const todayYmd = ymd(today);
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
