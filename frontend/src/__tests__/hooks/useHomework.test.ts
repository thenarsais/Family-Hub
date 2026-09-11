import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useHomework } from '@/hooks/useHomework';

const get = apiClient.get as ReturnType<typeof vi.fn>;
const post = apiClient.post as ReturnType<typeof vi.fn>;
const del = apiClient.delete as ReturnType<typeof vi.fn>;

const ITEM = {
  id: 'hw-1',
  userId: 'user-1',
  title: 'Math p.12',
  subject: 'Math',
  dueDate: '2026-09-12',
  pointsValue: 10,
  completedAt: null,
  isOverdue: false,
  completed: false,
};

const LIST = { status: 'success', items: [ITEM], count: 1 };

describe('useHomework', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('skips the fetch without a user', async () => {
    mockUseAuth.mockReturnValue({ user: undefined });
    const { result } = renderHook(() => useHomework());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(get).not.toHaveBeenCalled();
  });

  it('loads the board with the x-user-id header', async () => {
    get.mockResolvedValueOnce({ data: LIST });
    const { result } = renderHook(() => useHomework());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toHaveLength(1);
    expect(get).toHaveBeenCalledWith(
      '/api/homework?scope=mine',
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('complete posts then refetches the board', async () => {
    get.mockResolvedValueOnce({ data: LIST });
    post.mockResolvedValueOnce({ data: { status: 'success', pointsEarned: 10 } });
    get.mockResolvedValueOnce({
      data: { status: 'success', items: [{ ...ITEM, completed: true }], count: 1 },
    });

    const { result } = renderHook(() => useHomework());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.complete('hw-1');
    });

    expect(post).toHaveBeenCalledWith(
      '/api/homework/hw-1/complete',
      {},
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
    expect(result.current.items[0].completed).toBe(true);
  });

  it('createItem posts the payload then reloads mine + family', async () => {
    get.mockResolvedValueOnce({ data: LIST });
    post.mockResolvedValueOnce({ data: { status: 'success' } });
    get.mockResolvedValue({ data: LIST });

    const { result } = renderHook(() => useHomework());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createItem({ title: 'Essay', dueDate: '2026-09-20' });
    });

    expect(post).toHaveBeenCalledWith(
      '/api/homework',
      { title: 'Essay', dueDate: '2026-09-20' },
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
    expect(get).toHaveBeenCalledWith('/api/homework?scope=family', expect.anything());
  });

  it('deleteItem calls DELETE and refetches', async () => {
    get.mockResolvedValueOnce({ data: LIST });
    del.mockResolvedValueOnce({ data: { status: 'success' } });
    get.mockResolvedValue({ data: { status: 'success', items: [], count: 0 } });

    const { result } = renderHook(() => useHomework());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteItem('hw-1');
    });

    expect(del).toHaveBeenCalledWith(
      '/api/homework/hw-1',
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('rolls back the optimistic flip when complete fails', async () => {
    get.mockResolvedValueOnce({ data: LIST });
    post.mockRejectedValueOnce(new Error('server down'));

    const { result } = renderHook(() => useHomework());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.complete('hw-1')).rejects.toThrow('server down');
    });
    expect(result.current.items[0].completed).toBe(false);
  });

  it('uncomplete calls DELETE on the completion endpoint', async () => {
    get.mockResolvedValueOnce({
      data: { status: 'success', items: [{ ...ITEM, completed: true }], count: 1 },
    });
    del.mockResolvedValueOnce({ data: { status: 'success' } });
    get.mockResolvedValue({ data: LIST });

    const { result } = renderHook(() => useHomework());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.uncomplete('hw-1');
    });
    expect(del).toHaveBeenCalledWith(
      '/api/homework/hw-1/complete',
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('updateItem PATCHes and refetches', async () => {
    get.mockResolvedValueOnce({ data: LIST });
    const patch = apiClient.patch as ReturnType<typeof vi.fn>;
    patch.mockResolvedValueOnce({ data: { status: 'success' } });
    get.mockResolvedValue({ data: LIST });

    const { result } = renderHook(() => useHomework());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateItem('hw-1', { title: 'Renamed', pointsValue: 15 });
    });
    expect(patch).toHaveBeenCalledWith(
      '/api/homework/hw-1',
      { title: 'Renamed', pointsValue: 15 },
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('surfaces a load error', async () => {
    get.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useHomework());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('offline');
  });

  it('handles an empty payload gracefully', async () => {
    get.mockResolvedValueOnce({ data: undefined });
    const { result } = renderHook(() => useHomework());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
  });
});
