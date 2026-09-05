import { renderHook, act } from '@testing-library/react';
import { useCalendarView } from '@/hooks/useCalendarView';

describe('useCalendarView', () => {
  beforeEach(() => {
    try { window.localStorage.clear(); } catch { /* storage disabled */ }
  });

  it('defaults to week when nothing is stored', () => {
    const { result } = renderHook(() => useCalendarView('user-1'));
    expect(result.current.view).toBe('week');
  });

  it('reads a persisted view for the profile', () => {
    window.localStorage.setItem('fh:calView:user-1', 'schedule');
    const { result } = renderHook(() => useCalendarView('user-1'));
    expect(result.current.view).toBe('schedule');
  });

  it('ignores a garbage stored value', () => {
    window.localStorage.setItem('fh:calView:user-1', 'sideways');
    const { result } = renderHook(() => useCalendarView('user-1'));
    expect(result.current.view).toBe('week');
  });

  it('persists a new view per profile', () => {
    const { result } = renderHook(() => useCalendarView('user-1'));
    act(() => result.current.setView('month'));
    expect(result.current.view).toBe('month');
    expect(window.localStorage.getItem('fh:calView:user-1')).toBe('month');
  });

  it('keeps each profile independent', () => {
    window.localStorage.setItem('fh:calView:user-1', 'day');
    const { result } = renderHook(() => useCalendarView('user-2'));
    expect(result.current.view).toBe('week');
  });
});
