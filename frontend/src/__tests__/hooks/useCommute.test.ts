import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useCommute } from '@/hooks/useCommute';

type Fn = ReturnType<typeof vi.fn>;

const route = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'r1',
  label: "Krish's school",
  destinationAddress: '456 School Ave',
  arriveByTime: '08:00',
  bufferMinutes: 10,
  durationInTrafficMin: 20,
  distanceMi: 10,
  leaveByTime: '07:30',
  minutesUntilLeave: 5,
  trafficDelayMin: 5,
  ...over,
});

function mockSummary(over: Partial<Record<string, unknown>> = {}) {
  (apiClient.get as Fn).mockResolvedValue({
    data: { status: 'success', configured: true, homeAddress: '123 Home St', noSchoolToday: false, routes: [], ...over },
  });
}

describe('useCommute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    mockSummary();
  });

  it('skips fetching and stays at the empty default when there is no authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useCommute());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.summary).toEqual({ configured: false, homeAddress: null, noSchoolToday: false, routes: [] });
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('loads the summary on mount', async () => {
    mockSummary({ routes: [route()] });
    const { result } = renderHook(() => useCommute());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.summary.routes).toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalledWith('/api/commute/today', { headers: { 'x-user-id': 'user-1' } });
  });

  it('surfaces a load error', async () => {
    (apiClient.get as Fn).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useCommute());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('offline');
  });

  it('addRoute posts then refreshes the summary', async () => {
    (apiClient.post as Fn).mockResolvedValueOnce({ data: { status: 'success', route: route() } });
    const { result } = renderHook(() => useCommute());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockSummary({ routes: [route()] });
    await act(async () => {
      await result.current.addRoute({ label: "Krish's school", destinationAddress: '456 School Ave', arriveByTime: '08:00' });
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/commute/routes',
      { label: "Krish's school", destinationAddress: '456 School Ave', arriveByTime: '08:00' },
      { headers: { 'x-user-id': 'user-1' } },
    );
    expect(result.current.summary.routes).toHaveLength(1);
  });

  it('removeRoute optimistically removes, reverting on failure', async () => {
    mockSummary({ routes: [route()] });
    (apiClient.delete as Fn).mockRejectedValueOnce(new Error('offline'));

    const { result } = renderHook(() => useCommute());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeRoute('r1');
    });

    expect(result.current.summary.routes).toHaveLength(1); // reverted
    expect(result.current.error).toBe('offline');
  });

  it('removeRoute removes for good on success', async () => {
    mockSummary({ routes: [route()] });
    (apiClient.delete as Fn).mockResolvedValueOnce({ data: { status: 'success' } });

    const { result } = renderHook(() => useCommute());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeRoute('r1');
    });

    expect(result.current.summary.routes).toEqual([]);
  });

  it('setHomeAddress puts then refreshes the summary', async () => {
    (apiClient.put as Fn).mockResolvedValueOnce({ data: { status: 'success' } });
    const { result } = renderHook(() => useCommute());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockSummary({ homeAddress: '999 New St' });
    await act(async () => {
      await result.current.setHomeAddress('999 New St');
    });

    expect(apiClient.put).toHaveBeenCalledWith(
      '/api/commute/settings',
      { homeAddress: '999 New St' },
      { headers: { 'x-user-id': 'user-1' } },
    );
    expect(result.current.summary.homeAddress).toBe('999 New St');
  });

  it('setNoSchoolToday optimistically toggles, reverting on failure', async () => {
    (apiClient.put as Fn).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useCommute());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.setNoSchoolToday(true);
    });

    expect(result.current.summary.noSchoolToday).toBe(false); // reverted
    expect(result.current.error).toBe('offline');
  });
});
