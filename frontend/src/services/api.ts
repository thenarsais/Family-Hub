import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * The `{ status, data, ... }` success envelope the "newer" routes wrap their
 * payload in (chores, learning, announcements, reminders, energy, calendar,
 * family, activity-log, smartthings). Fields other than `data` are optional
 * here so partial fallbacks like `{ data: { data: [] } }` still satisfy it.
 */
export interface ApiEnvelope<T> {
  status?: 'success' | 'error';
  data: T;
  count?: number;
  timestamp?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token and user ID to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;

        // Extract user ID from token (base64-encoded JSON)
        try {
          const decoded = JSON.parse(atob(token));
          console.log('[API] Token decoded:', decoded);
          if (decoded.sub) {
            config.headers['x-user-id'] = decoded.sub;
            console.log('[API] Set x-user-id header to:', decoded.sub);
          }
        } catch (e) {
          console.error('[API] Failed to decode token:', e.message);
        }
      }
      return config;
    });

    // Handle responses
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.log('[API] Response error:', error.response?.status, error.config?.url);
        if (error.response?.status === 401) {
          // Only redirect on auth endpoint failures, not on feature endpoints
          const url = error.config?.url || '';
          const isAuthEndpoint = url.includes('/auth/') || url.includes('/login');

          if (isAuthEndpoint) {
            console.error('[API] *** CRITICAL: Got 401 error from:', error.config?.url);
            console.error('[API] *** CRITICAL: Clearing token and doing HARD redirect to login');
            console.error('[API] *** CRITICAL: This will reload the page');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            // Hard redirect causes full page reload - clears console logs!
            window.location.href = '/login';
          } else {
            console.warn('[API] Got 401 from feature endpoint:', error.config?.url);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ============ Auth ============
  async signup(email: string, password: string, name: string) {
    const response = await this.client.post('/auth/signup', {
      email,
      password,
      name,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async logout() {
    return this.client.post('/auth/logout');
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // ============ Users ============
  async getUsers(limit = 20, offset = 0) {
    const response = await this.client.get('/users', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getUserById(userId: string) {
    const response = await this.client.get(`/users/${userId}`);
    return response.data;
  }

  async updateUser(userId: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/users/${userId}`, data);
    return response.data;
  }

  // ============ Badges ============
  async getBadges(limit = 50, offset = 0) {
    const response = await this.client.get('/badges', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getBadgeById(badgeId: string) {
    const response = await this.client.get(`/badges/${badgeId}`);
    return response.data;
  }

  async getBadgesByCategory(category: string) {
    const response = await this.client.get(`/badges/category/${category}`);
    return response.data;
  }

  async getUserBadges(userId: string) {
    const response = await this.client.get(`/badges/users/${userId}`);
    return response.data;
  }

  async getUserBadgesDetailed(userId: string) {
    const response = await this.client.get(`/badges/users/${userId}/detailed`);
    return response.data;
  }

  async awardBadge(userId: string, badgeId: string, reason?: string) {
    const response = await this.client.post(`/badges/users/${userId}/badges/${badgeId}`, {
      reason,
    });
    return response.data;
  }

  // ============ Points ============
  async getUserPoints(userId: string) {
    const response = await this.client.get(`/points/users/${userId}`);
    return response.data;
  }

  async getPointsHistory(userId: string, limit = 20, offset = 0) {
    const response = await this.client.get(`/points/users/${userId}/history`, {
      params: { limit, offset },
    });
    return response.data;
  }

  async getPointsBreakdown(userId: string) {
    const response = await this.client.get(`/points/users/${userId}/breakdown`);
    return response.data;
  }

  async getPointsToday(userId: string) {
    const response = await this.client.get(`/points/users/${userId}/today`);
    return response.data;
  }

  async getPointsWeek(userId: string) {
    const response = await this.client.get(`/points/users/${userId}/week`);
    return response.data;
  }

  async getPointsMonth(userId: string) {
    const response = await this.client.get(`/points/users/${userId}/month`);
    return response.data;
  }

  async awardPoints(userId: string, points: number, activityType: string, description?: string) {
    const response = await this.client.post(`/points/users/${userId}`, {
      points,
      activity_type: activityType,
      description,
    });
    return response.data;
  }

  async getLeaderboard(limit = 10, period = 'week') {
    const response = await this.client.get('/points/leaderboard', {
      params: { limit, period },
    });
    return response.data;
  }

  // ============ External APIs ============
  async getWordDefinition(word: string) {
    const response = await this.client.get(`/api/external/dictionary/word/${word}`);
    return response.data;
  }

  async getWordOfDay() {
    const response = await this.client.get('/api/external/dictionary/word-of-day');
    return response.data;
  }

  async searchWords(prefix: string, limit = 5) {
    const response = await this.client.get('/api/external/dictionary/search', {
      params: { prefix, limit },
    });
    return response.data;
  }

  async getWeatherByCity(city: string, units = 'metric') {
    const response = await this.client.get(`/api/external/weather/city/${city}`, {
      params: { units },
    });
    return response.data;
  }

  async getWeatherByCoords(lat: number, lon: number, units = 'metric') {
    const response = await this.client.get('/api/external/weather/coords', {
      params: { lat, lon, units },
    });
    return response.data;
  }

  async getWeatherForecast(city: string) {
    const response = await this.client.get(`/api/external/weather/forecast/${city}`);
    return response.data;
  }

  async checkWeatherSuitability(city: string, activityType: string) {
    const response = await this.client.post('/api/external/weather/activity-suitability', {
      city,
      activityType,
    });
    return response.data;
  }

  // ============ Health ============
  async getHealth() {
    const response = await this.client.get('/health');
    return response.data;
  }

  async getReadiness() {
    const response = await this.client.get('/ready');
    return response.data;
  }

  async getInfo() {
    const response = await this.client.get('/info');
    return response.data;
  }

  // ============ Performance ============
  async getPerformanceHealth() {
    const response = await this.client.get('/performance/health');
    return response.data;
  }

  async getPerformanceSummary() {
    const response = await this.client.get('/performance/summary');
    return response.data;
  }

  // ============ SmartThings Devices ============
  async getSmartThingsDevices() {
    const response = await this.client.get('/api/smartthings/devices');
    return response.data;
  }

  async getSmartThingsDevice(deviceId: string) {
    const response = await this.client.get(`/api/smartthings/devices/${deviceId}`);
    return response.data;
  }

  async controlSmartThingsDevice(deviceId: string, command: string, args?: unknown[]) {
    const response = await this.client.put(`/api/smartthings/devices/${deviceId}`, {
      command,
      arguments: args,
    });
    return response.data;
  }

  async getSmartThingsStatus() {
    const response = await this.client.get('/api/smartthings/status');
    return response.data;
  }

  // ============ Batch Operations ============
  async batchOperations(operations: Array<{
    id: string;
    method: string;
    path: string;
    body?: Record<string, unknown>;
  }>) {
    const response = await this.client.post('/batch', { operations });
    return response.data;
  }

  // ============ Generic HTTP Methods ============
  // `T` is the response body type — pass it at the call site, e.g.
  // `apiClient.get<ApiEnvelope<Reminder[]>>('/api/reminders')`. Defaults to
  // `unknown` so an un-annotated call is caught rather than silently `any`.
  async get<T = unknown>(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(path, config);
  }

  async post<T = unknown>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(path, data, config);
  }

  async patch<T = unknown>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(path, data, config);
  }

  async delete<T = unknown>(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(path, config);
  }

  async put<T = unknown>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(path, data, config);
  }
}

export const apiClient = new ApiClient();
