import { create } from 'zustand';
import { apiClient } from '@services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token') || null,
  isLoading: false,
  error: null,

  signup: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.signup(email, password, name);
      const token = response.session?.access_token || response.token;
      const user = response.user;

      if (!token) {
        throw new Error('No token in response');
      }

      localStorage.setItem('auth_token', token);
      set({ user, token, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Signup failed',
        isLoading: false
      });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.login(email, password);
      console.log('[AUTH] Login response:', response);
      const token = response.session?.access_token || response.token;
      const user = response.user;

      console.log('[AUTH] Extracted token:', token ? 'present' : 'missing');
      console.log('[AUTH] Extracted user:', user);

      if (!token) {
        throw new Error('No token in response');
      }

      localStorage.setItem('auth_token', token);
      console.log('[AUTH] Token stored in localStorage');
      set({ user, token, isLoading: false });
    } catch (error: any) {
      console.error('[AUTH] Login error:', error);
      set({
        error: error.response?.data?.message || error.message || 'Login failed',
        isLoading: false
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.logout();
    } finally {
      localStorage.removeItem('auth_token');
      set({ user: null, token: null });
    }
  },

  loadCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.getCurrentUser();
      set({ user: response.data.user || response.data, isLoading: false });
    } catch (error: any) {
      localStorage.removeItem('auth_token');
      set({ user: null, token: null, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    set({ token });
  },
}));
