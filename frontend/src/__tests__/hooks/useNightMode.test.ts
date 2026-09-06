import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNightMode } from '@/hooks/useNightMode';

const KEY = 'fh:nightOverride';
const html = () => document.documentElement;

function at(iso: string) {
  vi.setSystemTime(new Date(iso));
}

describe('useNightMode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    try { window.localStorage.clear(); } catch { /* storage disabled */ }
    html().classList.remove('dark');
    html().style.colorScheme = '';
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Auto schedule', () => {
    it('is dark at 22:00', () => {
      at('2026-01-01T22:00:00');
      const { result } = renderHook(() => useNightMode());
      expect(result.current.isNightMode).toBe(true);
      expect(result.current.isOverridden).toBe(false);
      expect(html().classList.contains('dark')).toBe(true);
      expect(html().style.colorScheme).toBe('dark');
    });

    it('is dark at 05:00 (early morning)', () => {
      at('2026-01-01T05:00:00');
      const { result } = renderHook(() => useNightMode());
      expect(result.current.isNightMode).toBe(true);
    });

    it('is light at 14:00', () => {
      at('2026-01-01T14:00:00');
      const { result } = renderHook(() => useNightMode());
      expect(result.current.isNightMode).toBe(false);
      expect(html().classList.contains('dark')).toBe(false);
      expect(html().style.colorScheme).toBe('light');
    });

    it('flips to dark when the clock crosses 21:00 (no reload)', () => {
      at('2026-01-01T20:59:00');
      const { result } = renderHook(() => useNightMode());
      expect(result.current.isNightMode).toBe(false);

      act(() => {
        at('2026-01-01T21:01:00');
        vi.advanceTimersByTime(60_000);
      });
      expect(result.current.isNightMode).toBe(true);
    });
  });

  describe('manual override', () => {
    it('forces the opposite mode until the next boundary and marks it overridden', () => {
      at('2026-01-01T14:00:00'); // Auto = light
      const { result } = renderHook(() => useNightMode());

      act(() => result.current.toggleNightMode());

      expect(result.current.isNightMode).toBe(true);
      expect(result.current.isOverridden).toBe(true);
      expect(html().classList.contains('dark')).toBe(true);
      const stored = JSON.parse(window.localStorage.getItem(KEY)!);
      expect(stored.value).toBe(true);
      // next boundary from 14:00 is tonight's 21:00
      expect(stored.until).toBe(new Date('2026-01-01T21:00:00').getTime());
    });

    it('lapses back to Auto once the boundary passes', () => {
      at('2026-01-01T14:00:00');
      const { result } = renderHook(() => useNightMode());
      act(() => result.current.toggleNightMode()); // dark until 21:00
      expect(result.current.isNightMode).toBe(true);

      act(() => {
        at('2026-01-01T21:00:30');
        vi.advanceTimersByTime(60_000);
      });

      // 21:00 is a night hour, so Auto is dark now anyway — but the override is gone
      expect(result.current.isOverridden).toBe(false);
      expect(window.localStorage.getItem(KEY)).toBeNull();
      expect(result.current.isNightMode).toBe(true);
    });

    it('a stored override that is still live is honoured on mount', () => {
      at('2026-01-01T14:00:00');
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ value: true, until: new Date('2026-01-01T21:00:00').getTime() }),
      );
      const { result } = renderHook(() => useNightMode());
      expect(result.current.isNightMode).toBe(true);
      expect(result.current.isOverridden).toBe(true);
    });

    it('ignores a stored override whose time has already passed', () => {
      at('2026-01-01T14:00:00');
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ value: true, until: new Date('2026-01-01T06:00:00').getTime() }),
      );
      const { result } = renderHook(() => useNightMode());
      expect(result.current.isNightMode).toBe(false); // back to Auto (light at 14:00)
      expect(result.current.isOverridden).toBe(false);
    });
  });
});
