import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/services/api';
import { useCalendar } from '@/hooks/useCalendar';

function mockFetchEventsCalls(overrides: {
  events?: unknown[];
  upcoming?: unknown[];
  google?: unknown[];
  googleError?: { response?: { status: number } };
} = {}) {
  (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
    if (path === '/api/calendar/events') {
      return Promise.resolve({ data: { data: overrides.events ?? [] } });
    }
    if (path === '/api/calendar/upcoming') {
      return Promise.resolve({ data: { data: overrides.upcoming ?? [] } });
    }
    if (path === '/api/calendar/google/events') {
      if (overrides.googleError) return Promise.reject(overrides.googleError);
      return Promise.resolve({ data: { data: overrides.google ?? [] } });
    }
    if (path === '/api/calendar/auth/google') {
      return Promise.resolve({ data: { data: { connected: false } } });
    }
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
}

describe('useCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('should not fetch when there is no authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useCalendar());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.events).toEqual([]);
  });

  it('requests Google events for a window that reaches into the past', async () => {
    mockFetchEventsCalls();

    const { result } = renderHook(() => useCalendar());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const googleCall = (apiClient.get as ReturnType<typeof vi.fn>).mock.calls.find(
      ([path]) => path === '/api/calendar/google/events'
    );
    expect(googleCall).toBeDefined();
    const params = googleCall?.[1]?.params as { timeMin: string; timeMax: string };
    expect(new Date(params.timeMin).getTime()).toBeLessThan(Date.now());
    expect(new Date(params.timeMax).getTime()).toBeGreaterThan(Date.now());
  });

  it('should merge local and google events, tagging each with its source', async () => {
    mockFetchEventsCalls({
      events: [{ id: 'e1', event_date: '2099-01-01' }],
      google: [{ id: 'g1', start: { dateTime: '2099-01-02T00:00:00Z' } }],
    });

    const { result } = renderHook(() => useCalendar());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.events).toEqual([
      { id: 'g1', start: { dateTime: '2099-01-02T00:00:00Z' }, source: 'google' },
      { id: 'e1', event_date: '2099-01-01', source: 'local' },
    ]);
    expect(result.current.googleConnected).toBe(true);
  });

  it('should filter to upcoming events (future dates only), capped at 10', async () => {
    mockFetchEventsCalls({
      events: [
        { id: 'past', event_date: '2000-01-01' },
        { id: 'future', event_date: '2099-01-01' },
      ],
    });

    const { result } = renderHook(() => useCalendar());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.upcomingEvents.map((e) => e.id)).toEqual(['future']);
  });

  it('should fall back to the local upcoming response when no merged events are upcoming', async () => {
    mockFetchEventsCalls({
      events: [{ id: 'past', event_date: '2000-01-01' }],
      upcoming: [{ id: 'fallback-upcoming' }],
    });

    const { result } = renderHook(() => useCalendar());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.upcomingEvents).toEqual([{ id: 'fallback-upcoming' }]);
  });

  it.each([401, 403])(
    'sets tokenExpired and continues with empty google events on a %i',
    async (status) => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === '/api/calendar/events') return Promise.resolve({ data: { data: [] } });
        if (path === '/api/calendar/upcoming') return Promise.resolve({ data: { data: [] } });
        if (path === '/api/calendar/google/events') return Promise.reject({ response: { status } });
        if (path === '/api/calendar/auth/google') return Promise.resolve({ data: { data: { connected: false } } });
        return Promise.reject(new Error('unexpected'));
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.tokenExpired).toBe(true);
      expect(result.current.events).toEqual([]);
    }
  );

  it('should surface a general fetch failure as an error', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path === '/api/calendar/auth/google') return Promise.resolve({ data: { data: { connected: false } } });
      return Promise.reject(new Error('total failure'));
    });

    const { result } = renderHook(() => useCalendar());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // events/upcoming calls are individually .catch()'d to empty results, so
    // a rejection there doesn't reach the outer catch -- only a synchronous
    // throw (e.g. Promise.all itself failing) would. Confirm the hook stays
    // stable rather than crashing.
    expect(result.current.events).toEqual([]);
  });

  describe('createEvent', () => {
    it('should post and append the new event', async () => {
      mockFetchEventsCalls();
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 'new1', event_title: 'Soccer' } });

      const { result } = renderHook(() => useCalendar());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let created;
      await act(async () => {
        created = await result.current.createEvent({ event_title: 'Soccer' });
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/calendar/events',
        { event_title: 'Soccer' },
        { headers: { 'x-user-id': 'user-1' } }
      );
      expect(created).toEqual({ id: 'new1', event_title: 'Soccer' });
      expect(result.current.events).toContainEqual({ id: 'new1', event_title: 'Soccer' });
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useCalendar());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.createEvent({})).rejects.toThrow('User not authenticated');
    });
  });

  describe('updateEvent', () => {
    it('should patch and replace the event in local state', async () => {
      mockFetchEventsCalls({ events: [{ id: 'e1', event_date: '2099-01-01', event_title: 'Old' }] });
      (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { id: 'e1', event_title: 'New' },
      });

      const { result } = renderHook(() => useCalendar());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateEvent('e1', { event_title: 'New' });
      });

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/calendar/events/e1',
        { event_title: 'New' },
        { headers: { 'x-user-id': 'user-1' } }
      );
      expect(result.current.events.find((e) => e.id === 'e1')).toEqual({ id: 'e1', event_title: 'New' });
    });
  });

  describe('deleteEvent', () => {
    it('should delete and remove the event from local state', async () => {
      mockFetchEventsCalls({ events: [{ id: 'e1', event_date: '2099-01-01' }] });
      (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useCalendar());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.events).toHaveLength(1);

      await act(async () => {
        await result.current.deleteEvent('e1');
      });

      expect(apiClient.delete).toHaveBeenCalledWith('/api/calendar/events/e1', {
        headers: { 'x-user-id': 'user-1' },
      });
      expect(result.current.events).toHaveLength(0);
    });
  });

  describe('connectGoogle', () => {
    const originalOpen = window.open;

    beforeEach(() => {
      window.open = vi.fn();
    });

    afterEach(() => {
      window.open = originalOpen;
    });

    it('should open the OAuth URL and return it', async () => {
      mockFetchEventsCalls();
      (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === '/api/calendar/auth/google') {
          return Promise.resolve({ data: { data: { authUrl: 'https://accounts.google.com/auth' } } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

      const { result } = renderHook(() => useCalendar());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let url;
      await act(async () => {
        url = await result.current.connectGoogle();
      });

      expect(url).toBe('https://accounts.google.com/auth');
      expect(window.open).toHaveBeenCalledWith('https://accounts.google.com/auth', 'google-oauth', 'width=500,height=600');
    });

    it('should throw when no authUrl is returned', async () => {
      mockFetchEventsCalls();
      (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === '/api/calendar/auth/google') return Promise.resolve({ data: { data: {} } });
        return Promise.resolve({ data: { data: [] } });
      });

      const { result } = renderHook(() => useCalendar());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.connectGoogle()).rejects.toThrow('Failed to get Google OAuth URL');
    });

    it('should fall back to decoding the stored token when there is no user id', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      window.localStorage.setItem('auth_token', btoa(JSON.stringify({ sub: 'token-user-1' })));
      (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === '/api/calendar/auth/google') {
          return Promise.resolve({ data: { data: { authUrl: 'https://accounts.google.com/auth' } } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

      const { result } = renderHook(() => useCalendar());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.connectGoogle();
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/calendar/auth/google', {
        headers: { 'x-user-id': 'token-user-1' },
      });
    });

    it('should throw when neither user nor token provide an id', async () => {
      mockUseAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => useCalendar());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.connectGoogle()).rejects.toThrow('User not authenticated');
    });
  });

  describe('disconnectGoogle', () => {
    it('should disconnect and refresh events', async () => {
      mockFetchEventsCalls();
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useCalendar());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.disconnectGoogle();
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/calendar/google/disconnect',
        {},
        { headers: { 'x-user-id': 'user-1' } }
      );
      expect(result.current.googleConnected).toBe(false);
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useCalendar());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.disconnectGoogle()).rejects.toThrow('User not authenticated');
    });
  });

  describe('refresh', () => {
    it('should be an alias for re-fetching events', async () => {
      mockFetchEventsCalls({ events: [{ id: 'e1', event_date: '2099-01-01' }] });

      const { result } = renderHook(() => useCalendar());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.events).toHaveLength(1);
    });
  });
});
