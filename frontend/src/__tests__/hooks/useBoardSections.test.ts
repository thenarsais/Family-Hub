import { renderHook, act } from '@testing-library/react';
import { useBoardSections } from '@/hooks/useBoardSections';

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

describe('useBoardSections', () => {
  it('returns the declared order and no collapse by default', () => {
    const { result } = renderHook(() => useBoardSections('u1', ['a', 'b', 'c']));
    expect(result.current.sorted).toEqual(['a', 'b', 'c']);
    expect(result.current.collapsed).toEqual({});
  });

  it('toggle() flips and persists a section collapse', () => {
    const { result, unmount } = renderHook(() => useBoardSections('u1', ['a', 'b']));
    act(() => result.current.toggle('a'));
    expect(result.current.collapsed.a).toBe(true);
    unmount();

    const again = renderHook(() => useBoardSections('u1', ['a', 'b']));
    expect(again.result.current.collapsed.a).toBe(true);
  });

  it('move() reorders and persists, clamping at the ends', () => {
    const { result, unmount } = renderHook(() => useBoardSections('u1', ['a', 'b', 'c']));
    act(() => result.current.move('c', -1));
    expect(result.current.sorted).toEqual(['a', 'c', 'b']);
    act(() => result.current.move('a', -1)); // already first — no-op
    expect(result.current.sorted).toEqual(['a', 'c', 'b']);
    unmount();

    const again = renderHook(() => useBoardSections('u1', ['a', 'b', 'c']));
    expect(again.result.current.sorted).toEqual(['a', 'c', 'b']);
  });

  it('drops unknown saved ids and appends new declared ones', () => {
    localStorage.setItem('fh:boardOrder:u1', JSON.stringify(['c', 'gone', 'a']));
    const { result } = renderHook(() => useBoardSections('u1', ['a', 'b', 'c']));
    expect(result.current.sorted).toEqual(['c', 'a', 'b']);
  });

  it('keeps each profile separate', () => {
    const u1 = renderHook(() => useBoardSections('u1', ['a', 'b']));
    act(() => u1.result.current.toggle('a'));
    const u2 = renderHook(() => useBoardSections('u2', ['a', 'b']));
    expect(u2.result.current.collapsed).toEqual({});
  });
});
