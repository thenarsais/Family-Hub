import { google } from 'googleapis';
import axios from 'axios';
import { getSupabase } from './supabase';

interface GoogleAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleCalendarEvent {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
  location?: string | null;
  attendees?: Array<{ email?: string }> | null;
}

class GoogleOAuthService {
  private oauth2Client: any;

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
    const scopes = ['https://www.googleapis.com/auth/calendar.readonly'];
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
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
      return tokens;
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
      const { error } = await getSupabase()
        .from('user_integrations')
        .upsert({
          user_id: userId,
          provider: 'google_calendar',
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          token_expires_at: new Date(Date.now() + (token.expires_in * 1000)).toISOString(),
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
  async refreshAccessToken(refreshToken: string): Promise<GoogleAuthToken> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  /**
   * Fetch user's Google Calendar events
   */
  async getCalendarEvents(
    userId: string,
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 10,
  ): Promise<GoogleCalendarEvent[]> {
    try {
      let token = await this.getUserToken(userId);
      if (!token) {
        console.warn(`No Google Calendar token found for user ${userId}`);
        return [];
      }

      // Check if token is expired and refresh if needed
      if (token.expires_in < 300) {
        if (token.refresh_token) {
          const newToken = await this.refreshAccessToken(token.refresh_token);
          await this.storeUserToken(userId, newToken);
          token = newToken;
        } else {
          console.warn(`Cannot refresh token for user ${userId}, no refresh token available`);
          return [];
        }
      }

      // Fetch events from Google Calendar API
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      this.oauth2Client.setCredentials({ access_token: token.access_token });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return (response.data.items as GoogleCalendarEvent[]) || [];
    } catch (error) {
      console.error(`Failed to fetch Google Calendar events for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect user's Google Calendar (revoke token)
   */
  async disconnectCalendar(userId: string): Promise<void> {
    try {
      // Revoke the token
      const token = await this.getUserToken(userId);
      if (token?.access_token) {
        await axios.post('https://oauth2.googleapis.com/revoke', null, {
          params: { token: token.access_token },
        });
      }

      // Mark as inactive in database
      const { error } = await getSupabase()
        .from('user_integrations')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('provider', 'google_calendar');

      if (error) throw error;
    } catch (error) {
      console.error('Failed to disconnect Google Calendar:', error);
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
