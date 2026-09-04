import { renderHook, act } from '@testing-library/react';
import { useCardOrder } from '@/hooks/useCardOrder';

const DEFAULTS = ['a', 'b', 'c', 'd'];
const KEY = 'fh:cardOrder:p1';

describe('useCardOrder', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts in the declared default order when nothing is stored', () => {
    const { result } = renderHook(() => useCardOrder('p1', DEFAULTS));
    expect(result.current.order).toEqual(DEFAULTS);
  });

  it('restores a saved order, appending new ids and dropping unknown ones', () => {
    window.localStorage.setItem(KEY, JSON.stringify(['c', 'a', 'gone']));
    const { result } = renderHook(() => useCardOrder('p1', DEFAULTS));
    // known-and-still-present first (c, a), then the rest in declared order (b, d)
    expect(result.current.order).toEqual(['c', 'a', 'b', 'd']);
  });

  it('falls back to defaults when the stored value is corrupt', () => {
    window.localStorage.setItem(KEY, '{not json');
    const { result } = renderHook(() => useCardOrder('p1', DEFAULTS));
    expect(result.current.order).toEqual(DEFAULTS);
  });

  it('move() shifts a card and persists, clamping at the ends', () => {
    const { result } = renderHook(() => useCardOrder('p1', DEFAULTS));

    act(() => result.current.move('c', -1));
    expect(result.current.order).toEqual(['a', 'c', 'b', 'd']);
    expect(JSON.parse(window.localStorage.getItem(KEY)!)).toEqual(['a', 'c', 'b', 'd']);

    act(() => result.current.move('a', -1)); // already first — no change
    expect(result.current.order).toEqual(['a', 'c', 'b', 'd']);

    act(() => result.current.move('d', 5)); // clamp to last
    expect(result.current.order).toEqual(['a', 'c', 'b', 'd']);
  });

  it('move() ignores an unknown id', () => {
    const { result } = renderHook(() => useCardOrder('p1', DEFAULTS));
    act(() => result.current.move('nope', 1));
    expect(result.current.order).toEqual(DEFAULTS);
  });

  it('reorder() drops the dragged id in front of the target', () => {
    const { result } = renderHook(() => useCardOrder('p1', DEFAULTS));
    act(() => result.current.reorder('d', 'b'));
    expect(result.current.order).toEqual(['a', 'd', 'b', 'c']);
  });

  it('reorder() is a no-op for equal / missing ids', () => {
    const { result } = renderHook(() => useCardOrder('p1', DEFAULTS));
    act(() => result.current.reorder('a', 'a'));
    act(() => result.current.reorder('a', 'ghost'));
    expect(result.current.order).toEqual(DEFAULTS);
  });

  it('sort() orders items by the current order, unknown ids last', () => {
    const { result } = renderHook(() => useCardOrder('p1', DEFAULTS));
    act(() => result.current.reorder('c', 'a'));
    const items = [{ id: 'x' }, { id: 'a' }, { id: 'c' }, { id: 'b' }];
    const sorted = result.current.sort(items, (i) => i.id).map((i) => i.id);
    expect(sorted).toEqual(['c', 'a', 'b', 'x']);
  });
});
