import { vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIdleRevert } from '@/hooks/useIdleRevert';

const { mockUseKiosk, mockNavigate } = vi.hoisted(() => ({
  mockUseKiosk: vi.fn(),
  mockNavigate: vi.fn(),
}));
vi.mock('@hooks/useKiosk', () => ({ useKiosk: mockUseKiosk }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const revert = vi.fn();

function withKiosk(over: Record<string, unknown> = {}) {
  mockUseKiosk.mockReturnValue({
    isKiosk: true,
    activeProfileId: 'k1',
    idleMinutes: 1,
    revert,
    ...over,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('useIdleRevert', () => {
  it('reverts after the idle window elapses', () => {
    withKiosk();
    renderHook(() => useIdleRevert());

    vi.advanceTimersByTime(59_000);
    expect(revert).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2_000);
    expect(revert).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('activity resets the timer', () => {
    withKiosk();
    renderHook(() => useIdleRevert());

    vi.advanceTimersByTime(50_000);
    window.dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(50_000);
    expect(revert).not.toHaveBeenCalled();

    vi.advanceTimersByTime(15_000);
    expect(revert).toHaveBeenCalledTimes(1);
  });

  it('does nothing when not in kiosk mode', () => {
    withKiosk({ isKiosk: false });
    renderHook(() => useIdleRevert());
    vi.advanceTimersByTime(10 * 60_000);
    expect(revert).not.toHaveBeenCalled();
  });

  it('does nothing on the attract screen (no active profile)', () => {
    withKiosk({ activeProfileId: null });
    renderHook(() => useIdleRevert());
    vi.advanceTimersByTime(10 * 60_000);
    expect(revert).not.toHaveBeenCalled();
  });
});
