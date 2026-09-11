import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@/services/api', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));

import { apiClient } from '@/services/api';
import { useLearning } from '@/hooks/useLearning';

const get = apiClient.get as ReturnType<typeof vi.fn>;
const post = apiClient.post as ReturnType<typeof vi.fn>;

const L = (over = {}) => ({
  id: 'l1',
  category: 'alphabet',
  phase: 'phase_1_alphabet',
  subcategory: 'vowels',
  sequenceOrder: 0,
  content: { text: 'અ', romanization: 'a', pronunciation: 'uh', english: 'vowel a' },
  pointsValue: 10,
  completed: false,
  pointsEarned: 0,
  traced: false,
  ...over,
});

const STATS = {
  totalLessonsCompleted: 1,
  totalPointsEarned: 10,
  alphabet: { completed: 1, total: 47 },
  numbers: { completed: 0, total: 10 },
  vocabulary: { completed: 0, total: 120 },
};

function mockLoad(lessons = [L(), L({ id: 'l2', subcategory: 'consonants', content: { ...L().content, text: 'ક', english: 'ka' } })]) {
  get.mockImplementation((path: string) => {
    if (path === '/api/learning/lessons')
      return Promise.resolve({ data: { status: 'success', lessons } });
    if (path === '/api/learning/stats')
      return Promise.resolve({ data: { status: 'success', stats: STATS } });
    return Promise.reject(new Error(`unexpected ${path}`));
  });
}

describe('useLearning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    post.mockResolvedValue({ data: { status: 'success' } });
  });

  it('skips fetching without a user', async () => {
    mockUseAuth.mockReturnValue({ user: undefined });
    const { result } = renderHook(() => useLearning());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(get).not.toHaveBeenCalled();
  });

  it('loads lessons + stats and groups them by phase/subcategory', async () => {
    mockLoad();
    const { result } = renderHook(() => useLearning());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.lessons).toHaveLength(2);
    expect(result.current.stats.alphabet.total).toBe(47);
    expect(Object.keys(result.current.byPhase.phase_1_alphabet)).toEqual(['vowels', 'consonants']);
    expect(result.current.byPhase.phase_1_alphabet.vowels[0].id).toBe('l1');
  });

  it('completeLesson optimistically flips completed, posts, and refreshes', async () => {
    mockLoad();
    const { result } = renderHook(() => useLearning());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.completeLesson('l1');
    });
    expect(post).toHaveBeenCalledWith(
      '/api/learning/lessons/l1/complete',
      {},
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
    // refresh ran again (2 pairs of GETs)
    expect(get.mock.calls.filter((c) => c[0] === '/api/learning/lessons')).toHaveLength(2);
  });

  it('rolls back the optimistic flip on failure', async () => {
    mockLoad();
    post.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useLearning());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.completeLesson('l1')).rejects.toThrow('offline');
    });
    expect(result.current.lessons.find((l) => l.id === 'l1')?.completed).toBe(false);
  });

  it('traceLesson optimistically flips traced, posts, and refreshes', async () => {
    mockLoad();
    post.mockResolvedValueOnce({ data: { status: 'success', alreadyTraced: false } });
    const { result } = renderHook(() => useLearning());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let outcome: { alreadyTraced: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.traceLesson('l1');
    });
    expect(outcome).toEqual({ alreadyTraced: false });
    expect(post).toHaveBeenCalledWith(
      '/api/learning/lessons/l1/trace-complete',
      {},
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
    // refresh ran again (2 pairs of GETs)
    expect(get.mock.calls.filter((c) => c[0] === '/api/learning/lessons')).toHaveLength(2);
  });

  it('traceLesson reports alreadyTraced on a repeat trace', async () => {
    mockLoad();
    post.mockResolvedValueOnce({ data: { status: 'success', alreadyTraced: true } });
    const { result } = renderHook(() => useLearning());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let outcome: { alreadyTraced: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.traceLesson('l1');
    });
    expect(outcome).toEqual({ alreadyTraced: true });
  });

  it('rolls back the optimistic traced flip on failure', async () => {
    mockLoad();
    post.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useLearning());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.traceLesson('l1')).rejects.toThrow('offline');
    });
    expect(result.current.lessons.find((l) => l.id === 'l1')?.traced).toBeFalsy();
  });

  it('recordQuizAnswer posts and returns whether it was correct', async () => {
    mockLoad();
    post.mockResolvedValueOnce({ data: { result: { isCorrect: true } } });
    const { result } = renderHook(() => useLearning());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let correct: boolean | undefined;
    await act(async () => {
      correct = await result.current.recordQuizAnswer({
        lessonId: 'l1',
        questionNumber: 1,
        selectedAnswer: 2,
        correctAnswer: 2,
      });
    });
    expect(correct).toBe(true);
    expect(post).toHaveBeenCalledWith(
      '/api/learning/quiz/answer',
      { lessonId: 'l1', questionNumber: 1, selectedAnswer: 2, correctAnswer: 2 },
      expect.anything(),
    );
  });

  it('surfaces a load error', async () => {
    get.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useLearning());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
  });

  it('tolerates missing lessons/stats in the responses', async () => {
    get.mockImplementation((path: string) =>
      Promise.resolve({ data: path.endsWith('/stats') ? {} : {} }),
    );
    const { result } = renderHook(() => useLearning());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lessons).toEqual([]);
    expect(result.current.stats.alphabet.total).toBe(0);
  });

  it('recordQuizAnswer returns false when the response has no result', async () => {
    mockLoad();
    post.mockResolvedValueOnce({ data: {} });
    const { result } = renderHook(() => useLearning());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let correct: boolean | undefined;
    await act(async () => {
      correct = await result.current.recordQuizAnswer({
        lessonId: 'l1',
        questionNumber: 1,
        selectedAnswer: 0,
        correctAnswer: 1,
      });
    });
    expect(correct).toBe(false);
  });
});
