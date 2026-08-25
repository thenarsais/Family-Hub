import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNightMode } from '@/hooks/useNightMode';

describe('useNightMode', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use a saved preference from localStorage when present', () => {
    window.localStorage.setItem('nightMode', 'true');

    const { result } = renderHook(() => useNightMode());

    expect(result.current.isNightMode).toBe(true);
  });

  it('should respect a saved "false" preference', () => {
    window.localStorage.setItem('nightMode', 'false');

    const { result } = renderHook(() => useNightMode());

    expect(result.current.isNightMode).toBe(false);
  });

  it('should auto-enable night mode late at night with no saved preference', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T22:00:00'));

    const { result } = renderHook(() => useNightMode());

    expect(result.current.isNightMode).toBe(true);
  });

  it('should auto-enable night mode early morning with no saved preference', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T05:00:00'));

    const { result } = renderHook(() => useNightMode());

    expect(result.current.isNightMode).toBe(true);
  });

  it('should not auto-enable night mode during the day with no saved preference', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T14:00:00'));

    const { result } = renderHook(() => useNightMode());

    expect(result.current.isNightMode).toBe(false);
  });

  it('should add the dark class and colorScheme when enabled', () => {
    window.localStorage.setItem('nightMode', 'true');

    renderHook(() => useNightMode());

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('should remove the dark class when disabled', () => {
    window.localStorage.setItem('nightMode', 'false');

    renderHook(() => useNightMode());

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('should persist the current state to localStorage', () => {
    window.localStorage.setItem('nightMode', 'false');

    renderHook(() => useNightMode());

    expect(window.localStorage.getItem('nightMode')).toBe('false');
  });

  describe('toggleNightMode', () => {
    it('should flip the current state', () => {
      window.localStorage.setItem('nightMode', 'false');
      const { result } = renderHook(() => useNightMode());

      act(() => {
        result.current.toggleNightMode();
      });

      expect(result.current.isNightMode).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
