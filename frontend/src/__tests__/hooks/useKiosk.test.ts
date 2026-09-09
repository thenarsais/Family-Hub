import { vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKiosk } from '@/hooks/useKiosk';
import { useKioskStore } from '@/stores/kioskStore';

const PROFILES = [
  { userId: 'p1', name: 'Priya', role: 'parent', color: 'priya' },
  { userId: 'k1', name: 'Karishma', role: 'child', color: 'karishma' },
];

beforeEach(() => {
  vi.clearAllMocks();
  useKioskStore.setState({
    deviceToken: null,
    profiles: [],
    activeProfileId: null,
    parentUnlockedUntil: 0,
    familyName: null,
    hasPin: false,
    idleMinutes: 5,
    error: null,
    bootstrapping: false,
  });
});

describe('useKiosk', () => {
  it('projects store state and resolves the active profile', () => {
    useKioskStore.setState({
      deviceToken: 'dev',
      profiles: PROFILES,
      activeProfileId: 'k1',
      familyName: 'Narsai',
      hasPin: true,
      idleMinutes: 3,
    });
    const { result } = renderHook(() => useKiosk());

    expect(result.current.isKiosk).toBe(true);
    expect(result.current.activeProfile).toMatchObject({ userId: 'k1', name: 'Karishma' });
    expect(result.current.familyName).toBe('Narsai');
    expect(result.current.hasPin).toBe(true);
    expect(result.current.idleMinutes).toBe(3);
    expect(typeof result.current.switchProfile).toBe('function');
  });

  it('activeProfile is null on the attract screen', () => {
    useKioskStore.setState({ deviceToken: 'dev', profiles: PROFILES, activeProfileId: null });
    const { result } = renderHook(() => useKiosk());
    expect(result.current.isKiosk).toBe(true);
    expect(result.current.activeProfile).toBeNull();
  });

  it('reflects a live parent-unlock window', () => {
    useKioskStore.setState({ deviceToken: 'dev', parentUnlockedUntil: Date.now() + 60_000 });
    const { result } = renderHook(() => useKiosk());
    expect(result.current.isParentUnlocked).toBe(true);
  });
});
