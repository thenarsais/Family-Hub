import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useKidBoard } from '@/hooks/useKidBoard';

const KID = 'kid-1';
const R = { id: 'r1', userId: KID, slot: 'morning', label: 'Brush teeth', emoji: '🪥', sortOrder: 0, enabled: true, doneToday: false };

function mockGet(over: { routines?: unknown[]; manageRoutines?: unknown[]; mood?: unknown } = {}) {
  (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
    if (path === `/api/kids/${KID}/routines?scope=manage`)
      return Promise.resolve({
        data: { status: 'success', routines: over.manageRoutines ?? [R] },
      });
    if (path === `/api/kids/${KID}/routines`)
      return Promise.resolve({ data: { status: 'success', routines: over.routines ?? [R] } });
    if (path === `/api/kids/${KID}/mood`)
      return Promise.resolve({ data: { status: 'success', mood: over.mood ?? null } });
    return Promise.reject(new Error(`unexpected ${path}`));
  });
}

describe('useKidBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'parent-1' } });
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'success' } });
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'success' } });
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'success' } });
  });

  it('skips fetching without a memberId', async () => {
    const { result } = renderHook(() => useKidBoard(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('loads routines + today mood on mount', async () => {
    mockGet({ mood: { id: 'm1', mood: 'good' } });
    const { result } = renderHook(() => useKidBoard(KID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.routines).toHaveLength(1);
    expect(result.current.todayMood?.mood).toBe('good');
  });

  it('completeRoutine posts with the parent header and optimistically flips doneToday', async () => {
    mockGet();
    const { result } = renderHook(() => useKidBoard(KID));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.completeRoutine('r1');
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      `/api/kids/${KID}/routines/r1/complete`,
      {},
      expect.objectContaining({ headers: { 'x-user-id': 'parent-1' } }),
    );
  });

  it('rolls back the optimistic flip when the call fails', async () => {
    mockGet();
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useKidBoard(KID));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.completeRoutine('r1')).rejects.toThrow('offline');
    });
    expect(result.current.routines[0].doneToday).toBe(false);
  });

  it('undoRoutine deletes the completion', async () => {
    mockGet({ routines: [{ ...R, doneToday: true }] });
    const { result } = renderHook(() => useKidBoard(KID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.undoRoutine('r1');
    });
    expect(apiClient.delete).toHaveBeenCalledWith(`/api/kids/${KID}/routines/r1/complete`, expect.anything());
  });

  it('setMood posts the value and stores the result', async () => {
    mockGet();
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { mood: { id: 'm2', mood: 'great' } },
    });
    const { result } = renderHook(() => useKidBoard(KID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.setMood('great');
    });
    expect(apiClient.post).toHaveBeenCalledWith(`/api/kids/${KID}/mood`, { mood: 'great' }, expect.anything());
    expect(result.current.todayMood?.mood).toBe('great');
  });

  it('createRoutine posts then refreshes', async () => {
    mockGet();
    const { result } = renderHook(() => useKidBoard(KID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.createRoutine({ slot: 'evening', label: 'Pajamas', emoji: '👕' });
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      `/api/kids/${KID}/routines`,
      { slot: 'evening', label: 'Pajamas', emoji: '👕' },
      expect.anything(),
    );
  });

  it('refreshManage loads the full routine list incl. hidden ones', async () => {
    mockGet({
      routines: [R],
      manageRoutines: [R, { ...R, id: 'r9', label: 'Old step', enabled: false }],
    });
    const { result } = renderHook(() => useKidBoard(KID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.manageRoutines).toHaveLength(0);

    await act(async () => {
      await result.current.refreshManage();
    });
    expect(apiClient.get).toHaveBeenCalledWith(
      `/api/kids/${KID}/routines?scope=manage`,
      expect.objectContaining({ headers: { 'x-user-id': 'parent-1' } }),
    );
    expect(result.current.manageRoutines).toHaveLength(2);
  });

  it('createRoutine also refreshes the manage list', async () => {
    mockGet({ manageRoutines: [R, { ...R, id: 'r9' }] });
    const { result } = renderHook(() => useKidBoard(KID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.createRoutine({ slot: 'evening', label: 'Pajamas', emoji: '👕' });
    });
    expect(result.current.manageRoutines).toHaveLength(2);
  });

  it('updateRoutine patches then refreshes both lists', async () => {
    mockGet({ manageRoutines: [R, { ...R, id: 'r9' }] });
    const { result } = renderHook(() => useKidBoard(KID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.updateRoutine('r1', { enabled: false });
    });
    expect(apiClient.patch).toHaveBeenCalledWith(
      `/api/kids/${KID}/routines/r1`,
      { enabled: false },
      expect.anything(),
    );
    expect(result.current.manageRoutines).toHaveLength(2);
  });

  it('refreshManage swallows a fetch failure', async () => {
    mockGet();
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path === `/api/kids/${KID}/routines?scope=manage`)
        return Promise.reject(new Error('mgmt down'));
      if (path === `/api/kids/${KID}/routines`)
        return Promise.resolve({ data: { routines: [R] } });
      return Promise.resolve({ data: { mood: null } });
    });
    const { result } = renderHook(() => useKidBoard(KID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.refreshManage();
    });
    expect(result.current.manageRoutines).toEqual([]);
  });

  it('without a caller: skips fetching and the mutations reject', async () => {
    mockUseAuth.mockReturnValue({ user: undefined });
    const { result } = renderHook(() => useKidBoard(KID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiClient.get).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.refreshManage();
      await expect(result.current.completeRoutine('r1')).rejects.toThrow('Not ready');
      await expect(result.current.setMood('good')).rejects.toThrow('Not ready');
      await expect(result.current.createRoutine({ slot: 'morning', label: 'x', emoji: '🙂' })).rejects.toThrow('Not ready');
      await expect(result.current.updateRoutine('r1', { label: 'x' })).rejects.toThrow('Not ready');
    });
    expect(result.current.manageRoutines).toEqual([]);
  });

  it('surfaces a fetch error', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useKidBoard(KID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
  });
});
