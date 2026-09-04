import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClock, formatClockTime, formatClockDate } from '@/hooks/useClock';

describe('useClock', () => {
  afterEach(() => vi.useRealTimers());

  it('formats time without an AM/PM suffix', () => {
    const d = new Date(2026, 8, 3, 9, 42);
    expect(formatClockTime(d)).toMatch(/^\d{1,2}:42$/);
  });

  it('formats a short weekday + month + day', () => {
    const d = new Date(2026, 8, 3, 9, 42);
    // e.g. "Thu, Sep 3"
    expect(formatClockDate(d)).toMatch(/^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}$/);
  });

  it('re-renders on the next minute boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 3, 9, 42, 30));
    const { result } = renderHook(() => useClock());
    const first = result.current.getTime();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.getTime()).toBeGreaterThan(first);
  });
});
