import axios, { AxiosInstance } from 'axios';

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
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
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

  async updateUser(userId: string, data: Record<string, any>) {
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
    const response = await this.client.post(`/badges/users/${userId}/award`, {
      badge_id: badgeId,
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
    const response = await this.client.get(`/dictionary/word/${word}`);
    return response.data;
  }

  async getWordOfDay() {
    const response = await this.client.get('/dictionary/word-of-day');
    return response.data;
  }

  async searchWords(prefix: string, limit = 5) {
    const response = await this.client.get('/dictionary/search', {
      params: { prefix, limit },
    });
    return response.data;
  }

  async getWeatherByCity(city: string, units = 'metric') {
    const response = await this.client.get(`/weather/city/${city}`, {
      params: { units },
    });
    return response.data;
  }

  async getWeatherByCoords(lat: number, lon: number, units = 'metric') {
    const response = await this.client.get('/weather/coords', {
      params: { lat, lon, units },
    });
    return response.data;
  }

  async getWeatherForecast(city: string) {
    const response = await this.client.get(`/weather/forecast/${city}`);
    return response.data;
  }

  async checkWeatherSuitability(latitude: number, longitude: number, activity: string) {
    const response = await this.client.post('/weather/activity-suitability', {
      latitude,
      longitude,
      activity,
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
    const response = await this.client.get('/smartthings/devices');
    return response.data;
  }

  async getSmartThingsDevice(deviceId: string) {
    const response = await this.client.get(`/smartthings/devices/${deviceId}`);
    return response.data;
  }

  async controlSmartThingsDevice(deviceId: string, command: string, args?: any[]) {
    const response = await this.client.put(`/smartthings/devices/${deviceId}`, {
      command,
      arguments: args,
    });
    return response.data;
  }

  async getSmartThingsStatus() {
    const response = await this.client.get('/smartthings/status');
    return response.data;
  }

  // ============ Batch Operations ============
  async batchOperations(operations: Array<{
    id: string;
    method: string;
    path: string;
    body?: Record<string, any>;
  }>) {
    const response = await this.client.post('/batch', { operations });
    return response.data;
  }

  // ============ Generic HTTP Methods ============
  async get(path: string, config?: any) {
    return this.client.get(path, config);
  }

  async post(path: string, data?: any, config?: any) {
    return this.client.post(path, data, config);
  }

  async patch(path: string, data?: any, config?: any) {
    return this.client.patch(path, data, config);
  }

  async delete(path: string, config?: any) {
    return this.client.delete(path, config);
  }

  async put(path: string, data?: any, config?: any) {
    return this.client.put(path, data, config);
  }
}

export const apiClient = new ApiClient();
