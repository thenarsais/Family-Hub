import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@/services/api', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));

import { apiClient } from '@/services/api';
import { useTrivia } from '@/hooks/useTrivia';

const get = apiClient.get as ReturnType<typeof vi.fn>;
const post = apiClient.post as ReturnType<typeof vi.fn>;

const QUESTION = {
  id: 'q1',
  question: 'Largest planet?',
  category: 'Space',
  difficulty: 'easy',
  options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
  hint: 'J',
  pointsValue: 10,
};

const UNANSWERED = {
  status: 'success',
  question: QUESTION,
  attempt: null,
  streak: 0,
  stats: { answered: 0, correct: 0 },
};

describe('useTrivia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('skips the fetch without a user', async () => {
    mockUseAuth.mockReturnValue({ user: undefined });
    const { result } = renderHook(() => useTrivia());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(get).not.toHaveBeenCalled();
  });

  it("loads today's question with the x-user-id header", async () => {
    get.mockResolvedValueOnce({ data: UNANSWERED });
    const { result } = renderHook(() => useTrivia());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.question?.options).toHaveLength(4);
    expect(result.current.attempt).toBeNull();
    expect(get).toHaveBeenCalledWith(
      '/api/trivia/today',
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('submit posts the answer and swaps in the returned attempt + streak', async () => {
    get.mockResolvedValueOnce({ data: UNANSWERED });
    post.mockResolvedValueOnce({
      data: {
        status: 'success',
        question: QUESTION,
        attempt: {
          selectedAnswer: 'Saturn',
          isCorrect: false,
          pointsEarned: 0,
          correctAnswer: 'Jupiter',
          funFact: 'big',
        },
        streak: 1,
        stats: { answered: 1, correct: 0 },
      },
    });

    const { result } = renderHook(() => useTrivia());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submit('Saturn');
    });

    expect(post).toHaveBeenCalledWith(
      '/api/trivia/today',
      { answer: 'Saturn' },
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
    expect(result.current.attempt).toMatchObject({ isCorrect: false, correctAnswer: 'Jupiter' });
    expect(result.current.streak).toBe(1);
    expect(result.current.stats).toEqual({ answered: 1, correct: 0 });
  });

  it('surfaces a load error', async () => {
    get.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useTrivia());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('offline');
  });

  it('handles an empty payload gracefully', async () => {
    get.mockResolvedValueOnce({ data: undefined });
    const { result } = renderHook(() => useTrivia());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.question).toBeNull();
    expect(result.current.streak).toBe(0);
  });
});
