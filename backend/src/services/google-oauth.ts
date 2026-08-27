import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { getSupabase } from './supabase';

interface GoogleAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface GoogleCalendarEvent {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
  location?: string | null;
  attendees?: Array<{ email?: string }> | null;
  calendarId?: string;
  calendarName?: string;
  calendarColor?: string;
}

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
}

// Shape the calendar routes hand to createEvent / updateEvent after validating
// the request body. Dates/times are wall-clock parts kept separate from the
// timezone, exactly how Google's API wants them for a timed event
// ({ dateTime, timeZone }); an all-day event uses startDate only.
export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  allDay: boolean;
  startDate: string; // 'YYYY-MM-DD'
  startTime?: string; // 'HH:MM' — required when !allDay
  endDate?: string; // 'YYYY-MM-DD' — defaults to startDate
  endTime?: string; // 'HH:MM' — defaults to startTime + 1h
  timeZone: string; // IANA, e.g. 'America/New_York'
  attendees?: string[]; // email addresses
}

export type GoogleSendUpdates = 'all' | 'none';

// Add one hour to a wall-clock date+time, rolling the date over midnight.
// Uses a UTC base purely for the arithmetic — the parts come back out as
// wall-clock again and are paired with an explicit timeZone downstream.
function addOneHour(dateStr: string, timeStr: string): { date: string; time: string } {
  const base = new Date(`${dateStr}T${timeStr}:00Z`);
  base.setUTCHours(base.getUTCHours() + 1);
  return { date: base.toISOString().slice(0, 10), time: base.toISOString().slice(11, 16) };
}

// Google's all-day `end.date` is EXCLUSIVE: a single-day event on the 30th is
// start.date=…-30, end.date=…-31. Sending them equal is a 400.
function nextDay(dateStr: string): string {
  const base = new Date(`${dateStr}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + 1);
  return base.toISOString().slice(0, 10);
}

function buildEventRequestBody(input: CalendarEventInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    summary: input.summary,
    description: input.description || undefined,
    location: input.location || undefined,
    attendees: input.attendees?.length ? input.attendees.map((email) => ({ email })) : undefined,
  };

  if (input.allDay) {
    const startDate = input.startDate;
    const endDate = input.endDate && input.endDate > startDate ? nextDay(input.endDate) : nextDay(startDate);
    body.start = { date: startDate };
    body.end = { date: endDate };
  } else {
    const startTime = input.startTime || '09:00';
    let endDate = input.endDate || input.startDate;
    let endTime = input.endTime;
    if (!endTime) {
      const bumped = addOneHour(input.startDate, startTime);
      endDate = bumped.date;
      endTime = bumped.time;
    }
    body.start = { dateTime: `${input.startDate}T${startTime}:00`, timeZone: input.timeZone };
    body.end = { dateTime: `${endDate}T${endTime}:00`, timeZone: input.timeZone };
  }

  return body;
}

// googleapis throws errors carrying an HTTP status on `.code` (number) and/or
// `.response.status`. Normalise to a number so callers can branch on 404/410/etc.
function googleErrorStatus(error: unknown): number | undefined {
  const e = error as { code?: unknown; response?: { status?: number }; status?: number };
  if (typeof e?.code === 'number') return e.code;
  if (typeof e?.status === 'number') return e.status;
  if (typeof e?.response?.status === 'number') return e.response.status;
  return undefined;
}

// google-auth-library's Credentials shape has `expiry_date` (absolute ms
// epoch timestamp), not `expires_in` (relative seconds) -- this codebase's
// GoogleAuthToken uses the latter throughout (storeUserToken persists an
// absolute expiry computed from it). Converting here, once, at the
// boundary, rather than letting each caller guess at a default when the
// field it expects isn't actually on the real Google response.
function credentialsToGoogleAuthToken(credentials: import('google-auth-library').Credentials): GoogleAuthToken {
  if (!credentials.access_token) {
    throw new Error('Google OAuth response is missing an access_token');
  }

  const expiresIn = credentials.expiry_date
    ? Math.max(0, Math.floor((credentials.expiry_date - Date.now()) / 1000))
    : 3600;

  return {
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token ?? undefined,
    expires_in: expiresIn,
    token_type: credentials.token_type || 'Bearer',
  };
}

class GoogleOAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/google/callback`,
    );
  }

  /**
   * Get the OAuth authorization URL for user to sign in
   */
  getAuthUrl(userId: string): string {
    // Both scopes, additively:
    //  - calendar.readonly: needed for calendarList.list() (enumerating the
    //    user's calendars) and reading events. calendar.events alone does NOT
    //    grant calendarList access, so a read-only scope set breaks the whole
    //    fetch path with a 403.
    //  - calendar.events: needed for the write — declining an invite (RSVP)
    //    when the user dismisses an event on the dashboard.
    // `prompt: 'consent'` forces the consent screen every time so scope changes
    // take effect for already-connected users and we always get a fresh
    // refresh token back.
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ];
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: userId,
    });
    return url;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<GoogleAuthToken> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return credentialsToGoogleAuthToken(tokens);
    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      throw error;
    }
  }

  /**
   * Store user's Google OAuth token in database
   */
  async storeUserToken(userId: string, token: GoogleAuthToken): Promise<void> {
    try {
      const expiresInSeconds = token.expires_in || 3600;
      const expiresAt = new Date(Date.now() + (expiresInSeconds * 1000));

      const { error } = await getSupabase()
        .from('user_integrations')
        .upsert({
          user_id: userId,
          provider: 'google_calendar',
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          is_active: true,
        }, {
          onConflict: 'user_id,provider',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store Google token:', error);
      throw error;
    }
  }

  /**
   * Get user's stored Google OAuth token
   */
  async getUserToken(userId: string): Promise<GoogleAuthToken | null> {
    try {
      const { data, error } = await getSupabase()
        .from('user_integrations')
        .select('access_token, refresh_token, token_expires_at')
        .eq('user_id', userId)
        .eq('provider', 'google_calendar')
        .eq('is_active', true)
        .single();

      if (error || !data) return null;
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: Math.floor((new Date(data.token_expires_at).getTime() - Date.now()) / 1000),
        token_type: 'Bearer',
      };
    } catch (error) {
      console.error('Failed to get user token:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string, userId?: string): Promise<GoogleAuthToken> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentialsToGoogleAuthToken(credentials);
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      // Mark integration as inactive if refresh fails (token revoked or expired)
      if (userId) {
        try {
          await getSupabase()
            .from('user_integrations')
            .update({ is_active: false })
            .eq('user_id', userId)
            .eq('provider', 'google_calendar');
        } catch (updateError) {
          console.error('Failed to mark integration as inactive:', updateError);
        }
      }
      throw error;
    }
  }

  /**
   * List all calendars for the user
   */
  async listCalendars(userId: string): Promise<GoogleCalendar[]> {
    try {
      let token = await this.getUserToken(userId);
      if (!token) {
        console.warn(`No Google Calendar token found for user ${userId}`);
        return [];
      }

      if (token.expires_in < 300) {
        if (token.refresh_token) {
          try {
            const newToken = await this.refreshAccessToken(token.refresh_token, userId);
            await this.storeUserToken(userId, newToken);
            token = newToken;
          } catch (refreshError) {
            console.error(`Token refresh failed for user ${userId}:`, refreshError);
            throw {
              code: 'TOKEN_REFRESH_FAILED',
              message: 'Google Calendar authorization expired. Please re-authenticate.',
              status: 401,
            };
          }
        } else {
          throw {
            code: 'NO_REFRESH_TOKEN',
            message: 'Google Calendar authorization expired. Please re-authenticate.',
            status: 401,
          };
        }
      }

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      this.oauth2Client.setCredentials({ access_token: token.access_token });

      const response = await calendar.calendarList.list();
      return (response.data.items as GoogleCalendar[]) || [];
    } catch (error) {
      console.error(`Failed to list calendars for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch user's Google Calendar events from ALL calendars
   */
  async getCalendarEvents(
    userId: string,
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 150,
  ): Promise<GoogleCalendarEvent[]> {
    try {
      let token = await this.getUserToken(userId);
      if (!token) {
        console.warn(`No Google Calendar token found for user ${userId}`);
        return [];
      }

      if (token.expires_in < 300) {
        if (token.refresh_token) {
          try {
            const newToken = await this.refreshAccessToken(token.refresh_token, userId);
            await this.storeUserToken(userId, newToken);
            token = newToken;
          } catch (refreshError) {
            console.error(`Token refresh failed for user ${userId}:`, refreshError);
            throw {
              code: 'TOKEN_REFRESH_FAILED',
              message: 'Google Calendar authorization expired. Please re-authenticate.',
              status: 401,
            };
          }
        } else {
          console.warn(`Cannot refresh token for user ${userId}, no refresh token available`);
          throw {
            code: 'NO_REFRESH_TOKEN',
            message: 'Google Calendar authorization expired. Please re-authenticate.',
            status: 401,
          };
        }
      }

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      this.oauth2Client.setCredentials({ access_token: token.access_token });

      // Get all calendars
      const calendarListResponse = await calendar.calendarList.list();
      const calendars = (calendarListResponse.data.items as GoogleCalendar[]) || [];

      // Fetch events from all calendars
      const allEvents: GoogleCalendarEvent[] = [];

      for (const cal of calendars) {
        try {
          const response = await calendar.events.list({
            calendarId: cal.id,
            timeMin: timeMin || new Date().toISOString(),
            timeMax: timeMax,
            maxResults: Math.floor(maxResults / calendars.length) || 10,
            singleEvents: true,
            orderBy: 'startTime',
          });

          const events = (response.data.items as GoogleCalendarEvent[]) || [];

          // Add calendar metadata to each event
          events.forEach(event => {
            event.calendarId = cal.id;
            event.calendarName = cal.summary;
            event.calendarColor = cal.backgroundColor;
          });

          allEvents.push(...events);
        } catch (err) {
          console.warn(`Failed to fetch events from calendar ${cal.summary}:`, err);
        }
      }

      // Sort by start time
      return allEvents.sort((a, b) => {
        const aTime = a.start?.dateTime || a.start?.date || '';
        const bTime = b.start?.dateTime || b.start?.date || '';
        return new Date(aTime).getTime() - new Date(bTime).getTime();
      });
    } catch (error) {
      console.error(`Failed to fetch Google Calendar events for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get an authed Google Calendar v3 client for the user, refreshing the
   * access token first if it's about to expire. Returns null when the user has
   * no stored token; throws a typed 401 when a refresh is needed but fails.
   */
  private async getAuthedCalendar(userId: string) {
    let token = await this.getUserToken(userId);
    if (!token) return null;

    if (token.expires_in < 300) {
      if (!token.refresh_token) {
        throw { code: 'NO_REFRESH_TOKEN', message: 'Google Calendar authorization expired. Please re-authenticate.', status: 401 };
      }
      try {
        const newToken = await this.refreshAccessToken(token.refresh_token, userId);
        await this.storeUserToken(userId, newToken);
        token = newToken;
      } catch (refreshError) {
        console.error(`Token refresh failed for user ${userId}:`, refreshError);
        throw { code: 'TOKEN_REFRESH_FAILED', message: 'Google Calendar authorization expired. Please re-authenticate.', status: 401 };
      }
    }

    this.oauth2Client.setCredentials({ access_token: token.access_token });
    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * If the given event has the connected user as an attendee, set their RSVP
   * to "declined" in Google Calendar. Events the user owns (or isn't invited
   * to) are left untouched — the caller falls back to a local-only hide.
   *
   * Returns `{ declined: true }` on a real decline, or `{ declined: false }`
   * with a reason otherwise. Google API errors (e.g. a stale readonly token
   * that predates the calendar.events scope) propagate to the caller.
   */
  async declineEventIfInvited(
    userId: string,
    calendarId: string,
    eventId: string,
  ): Promise<{ declined: boolean; reason?: 'no_token' | 'not_an_attendee' }> {
    const calendar = await this.getAuthedCalendar(userId);
    if (!calendar) return { declined: false, reason: 'no_token' };

    const { data: event } = await calendar.events.get({ calendarId, eventId });
    const attendees = event.attendees ?? [];
    const meIndex = attendees.findIndex((a) => a.self);
    if (meIndex === -1) return { declined: false, reason: 'not_an_attendee' };

    attendees[meIndex].responseStatus = 'declined';
    await calendar.events.patch({
      calendarId,
      eventId,
      sendUpdates: 'none',
      requestBody: { attendees },
    });
    return { declined: true };
  }

  /**
   * Create an event on one of the user's Google calendars. Google is the
   * source of truth for events made through the dashboard form — the caller
   * mirrors the returned event into calendar_events afterwards.
   *
   * Throws the same typed 401 as the read path when there's no usable token,
   * so the frontend's re-authorize banner fires.
   */
  async createEvent(
    userId: string,
    calendarId: string,
    input: CalendarEventInput,
    sendUpdates: GoogleSendUpdates,
  ): Promise<GoogleCalendarEvent> {
    const calendar = await this.getAuthedCalendar(userId);
    if (!calendar) {
      throw { code: 'NO_TOKEN', message: 'Google Calendar isn\'t connected. Please connect it first.', status: 401 };
    }

    const { data } = await calendar.events.insert({
      calendarId,
      sendUpdates,
      requestBody: buildEventRequestBody(input),
    });
    return data as GoogleCalendarEvent;
  }

  /**
   * Patch an existing Google event. A 404/410 (the event was already deleted
   * upstream) is re-thrown as a typed 404 so the route can drop the stale
   * mirror row and tell the user.
   */
  async updateEvent(
    userId: string,
    calendarId: string,
    eventId: string,
    input: CalendarEventInput,
    sendUpdates: GoogleSendUpdates,
  ): Promise<GoogleCalendarEvent> {
    const calendar = await this.getAuthedCalendar(userId);
    if (!calendar) {
      throw { code: 'NO_TOKEN', message: 'Google Calendar isn\'t connected. Please connect it first.', status: 401 };
    }

    try {
      const { data } = await calendar.events.patch({
        calendarId,
        eventId,
        sendUpdates,
        requestBody: buildEventRequestBody(input),
      });
      return data as GoogleCalendarEvent;
    } catch (error: unknown) {
      const status = googleErrorStatus(error);
      if (status === 404 || status === 410) {
        throw { code: 'NOT_FOUND', message: 'That event no longer exists in Google Calendar.', status: 404 };
      }
      throw error;
    }
  }

  /**
   * Delete a Google event. A 404/410 means it's already gone upstream — that's
   * the desired end state, so it resolves successfully and the caller still
   * clears the mirror row.
   */
  async deleteEvent(
    userId: string,
    calendarId: string,
    eventId: string,
    sendUpdates: GoogleSendUpdates,
  ): Promise<{ alreadyGone: boolean }> {
    const calendar = await this.getAuthedCalendar(userId);
    if (!calendar) {
      throw { code: 'NO_TOKEN', message: 'Google Calendar isn\'t connected. Please connect it first.', status: 401 };
    }

    try {
      await calendar.events.delete({ calendarId, eventId, sendUpdates });
      return { alreadyGone: false };
    } catch (error: unknown) {
      const status = googleErrorStatus(error);
      if (status === 404 || status === 410) return { alreadyGone: true };
      throw error;
    }
  }

  /**
   * Disconnect user's Google Calendar (revoke token)
   */
  async disconnectCalendar(userId: string): Promise<void> {
    // Best-effort revoke: an already-expired or invalid token makes Google's
    // revoke endpoint return 400, which must not block the user from actually
    // disconnecting — the token is effectively dead either way, and failing
    // here left the integration stuck "active" with no way to clear it.
    const token = await this.getUserToken(userId);
    if (token?.access_token) {
      try {
        await axios.post('https://oauth2.googleapis.com/revoke', null, {
          params: { token: token.access_token },
        });
      } catch (revokeError) {
        console.warn(`Google token revoke failed for user ${userId} (continuing with local disconnect):`, revokeError);
      }
    }

    // Mark as inactive in database
    const { error } = await getSupabase()
      .from('user_integrations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('provider', 'google_calendar');

    if (error) {
      console.error('Failed to mark Google Calendar integration inactive:', error);
      throw error;
    }
  }
}

// Singleton pattern
let googleOAuthService: GoogleOAuthService;

export function getGoogleOAuthService(): GoogleOAuthService {
  if (!googleOAuthService) {
    googleOAuthService = new GoogleOAuthService();
  }
  return googleOAuthService;
}
