import { vi } from 'vitest';

vi.mock('@/services/api', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useKioskStore, selectIsKiosk, selectParentUnlocked } from '@/stores/kioskStore';

const post = apiClient.post as ReturnType<typeof vi.fn>;

function reset() {
  useKioskStore.setState({
    deviceToken: null,
    familyId: null,
    familyName: null,
    profiles: [],
    activeProfileId: null,
    parentUnlockedUntil: 0,
    idleMinutes: 5,
    hasPin: false,
    bootstrapping: false,
    error: null,
  });
}

const BOOT = {
  data: {
    family: { id: 'fam-1', name: 'Narsai' },
    members: [
      { userId: 'p1', name: 'Priya', role: 'parent', color: 'priya' },
      { userId: 'k1', name: 'Karishma', role: 'child', color: 'karishma' },
    ],
    hasPin: true,
    idleMinutes: 3,
  },
};

describe('kioskStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    reset();
  });

  it('selectIsKiosk reflects the device token', () => {
    expect(selectIsKiosk(useKioskStore.getState())).toBe(false);
    useKioskStore.setState({ deviceToken: 'x' });
    expect(selectIsKiosk(useKioskStore.getState())).toBe(true);
  });

  it('enroll stores the token then bootstraps the household', async () => {
    post
      .mockResolvedValueOnce({ data: { token: 'dev-tok', familyId: 'fam-1' } }) // enroll
      .mockResolvedValueOnce(BOOT); // session
    await useKioskStore.getState().enroll('Kitchen');

    expect(window.localStorage.getItem('fh:kiosk:token')).toBe('dev-tok');
    const s = useKioskStore.getState();
    expect(s.deviceToken).toBe('dev-tok');
    expect(s.profiles).toHaveLength(2);
    expect(s.familyName).toBe('Narsai');
    expect(s.hasPin).toBe(true);
    expect(s.idleMinutes).toBe(3);
    // session call carries the device token header
    expect(post).toHaveBeenLastCalledWith(
      '/api/kiosk/session',
      {},
      expect.objectContaining({ headers: { 'x-kiosk-token': 'dev-tok' } }),
    );
  });

  it('enroll throws if no token comes back', async () => {
    post.mockResolvedValueOnce({ data: {} });
    await expect(useKioskStore.getState().enroll('x')).rejects.toThrow(/token/);
  });

  it('bootstrap clears kiosk state on a 401', async () => {
    useKioskStore.setState({ deviceToken: 'stale' });
    window.localStorage.setItem('fh:kiosk:token', 'stale');
    post.mockRejectedValueOnce({ response: { status: 401 } });
    await useKioskStore.getState().bootstrap();

    expect(useKioskStore.getState().deviceToken).toBeNull();
    expect(window.localStorage.getItem('fh:kiosk:token')).toBeNull();
  });

  it('bootstrap surfaces a non-401 error without dropping the token', async () => {
    useKioskStore.setState({ deviceToken: 'tok' });
    post.mockRejectedValueOnce({ response: { status: 500 } });
    await useKioskStore.getState().bootstrap();

    const s = useKioskStore.getState();
    expect(s.deviceToken).toBe('tok');
    expect(s.error).toBeTruthy();
  });

  it('switchProfile persists and clears the parent unlock when leaving Parent', () => {
    useKioskStore.setState({
      activeProfileId: 'p1',
      parentUnlockedUntil: Date.now() + 100000,
    });
    useKioskStore.getState().switchProfile('k1');

    const s = useKioskStore.getState();
    expect(s.activeProfileId).toBe('k1');
    expect(s.parentUnlockedUntil).toBe(0);
    expect(window.localStorage.getItem('fh:kiosk:profile')).toBe('k1');
  });

  it('unlockParent verifies the PIN then enters the Parent profile', async () => {
    useKioskStore.setState({
      profiles: BOOT.data.members,
    });
    post.mockResolvedValueOnce({ data: { ok: true } });
    await useKioskStore.getState().unlockParent('1234');

    expect(post).toHaveBeenCalledWith(
      '/api/kiosk/pin/verify',
      { pin: '1234' },
      expect.objectContaining({ headers: { 'x-user-id': 'p1' } }),
    );
    const s = useKioskStore.getState();
    expect(s.activeProfileId).toBe('p1');
    expect(selectParentUnlocked(s)).toBe(true);
    expect(Number(window.localStorage.getItem('fh:kiosk:unlockUntil'))).toBeGreaterThan(Date.now());
  });

  it('unlockParent rejects (and does not switch) on a bad PIN', async () => {
    useKioskStore.setState({ profiles: BOOT.data.members });
    post.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(useKioskStore.getState().unlockParent('0000')).rejects.toBeTruthy();
    expect(useKioskStore.getState().activeProfileId).toBeNull();
  });

  it('revert clears the active profile and the unlock', () => {
    useKioskStore.setState({
      activeProfileId: 'p1',
      parentUnlockedUntil: Date.now() + 100000,
    });
    window.localStorage.setItem('fh:kiosk:profile', 'p1');
    useKioskStore.getState().revert();

    const s = useKioskStore.getState();
    expect(s.activeProfileId).toBeNull();
    expect(s.parentUnlockedUntil).toBe(0);
    expect(window.localStorage.getItem('fh:kiosk:profile')).toBeNull();
  });

  it('leaveKiosk wipes every stored key', () => {
    useKioskStore.setState({ deviceToken: 'tok', profiles: BOOT.data.members });
    window.localStorage.setItem('fh:kiosk:token', 'tok');
    window.localStorage.setItem('fh:kiosk:profile', 'p1');
    window.localStorage.setItem('fh:kiosk:unlockUntil', '123');
    useKioskStore.getState().leaveKiosk();

    expect(useKioskStore.getState().deviceToken).toBeNull();
    expect(useKioskStore.getState().profiles).toEqual([]);
    expect(window.localStorage.getItem('fh:kiosk:token')).toBeNull();
    expect(window.localStorage.getItem('fh:kiosk:profile')).toBeNull();
    expect(window.localStorage.getItem('fh:kiosk:unlockUntil')).toBeNull();
  });

  it('hydrates from localStorage at module load', async () => {
    window.localStorage.setItem('fh:kiosk:token', 'persisted');
    window.localStorage.setItem('fh:kiosk:profile', 'k1');
    window.localStorage.setItem('fh:kiosk:unlockUntil', String(Date.now() + 50000));
    vi.resetModules();
    const { useKioskStore: fresh } = await import('@/stores/kioskStore');
    const s = fresh.getState();
    expect(s.deviceToken).toBe('persisted');
    expect(s.activeProfileId).toBe('k1');
    expect(s.parentUnlockedUntil).toBeGreaterThan(Date.now());
  });
});
