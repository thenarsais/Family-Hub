import { create } from 'zustand';
import type { components } from '@/types/api-generated';
import { apiClient } from '@services/api';

export type KioskProfile = components['schemas']['KioskProfile'];

const TOKEN_KEY = 'fh:kiosk:token';
const PROFILE_KEY = 'fh:kiosk:profile';
const UNLOCK_KEY = 'fh:kiosk:unlockUntil';

/** How long a PIN unlock lasts before the Parent profile re-locks. */
export const PARENT_UNLOCK_MS = 30 * 60 * 1000;

interface KioskState {
  deviceToken: string | null;
  familyId: string | null;
  familyName: string | null;
  profiles: KioskProfile[];
  activeProfileId: string | null;
  parentUnlockedUntil: number;
  idleMinutes: number;
  hasPin: boolean;
  bootstrapping: boolean;
  error: string | null;

  enroll: (label: string) => Promise<void>;
  bootstrap: () => Promise<void>;
  switchProfile: (userId: string | null) => void;
  unlockParent: (pin: string) => Promise<void>;
  lockParent: () => void;
  revert: () => void;
  leaveKiosk: () => void;
}

/** Read the persisted kiosk session synchronously at store-creation time. */
function readStored(): {
  deviceToken: string | null;
  activeProfileId: string | null;
  parentUnlockedUntil: number;
} {
  try {
    return {
      deviceToken: localStorage.getItem(TOKEN_KEY) || null,
      activeProfileId: localStorage.getItem(PROFILE_KEY) || null,
      parentUnlockedUntil: Number(localStorage.getItem(UNLOCK_KEY)) || 0,
    };
  } catch {
    return { deviceToken: null, activeProfileId: null, parentUnlockedUntil: 0 };
  }
}

function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — kiosk state stays in memory only */
  }
}

export const useKioskStore = create<KioskState>((set, get) => ({
  ...readStored(),
  familyId: null,
  familyName: null,
  profiles: [],
  idleMinutes: 5,
  hasPin: false,
  bootstrapping: false,
  error: null,

  /** Register this device (called while a parent is signed in normally). */
  enroll: async (label: string) => {
    const res = await apiClient.post<{ token: string; familyId: string }>('/api/kiosk/enroll', {
      label,
    });
    const token = res.data?.token;
    if (!token) throw new Error('Enrolment did not return a token');
    safeSet(TOKEN_KEY, token);
    set({ deviceToken: token, familyId: res.data.familyId, error: null });
    await get().bootstrap();
  },

  /** Exchange the device token for the household profile picker. */
  bootstrap: async () => {
    const token = get().deviceToken;
    if (!token) return;
    set({ bootstrapping: true, error: null });
    try {
      const res = await apiClient.post<components['schemas']['KioskBootstrap']>(
        '/api/kiosk/session',
        {},
        { headers: { 'x-kiosk-token': token } },
      );
      const b = res.data;
      set({
        familyId: b.family.id,
        familyName: b.family.name,
        profiles: b.members,
        hasPin: b.hasPin,
        idleMinutes: b.idleMinutes,
        bootstrapping: false,
      });
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        get().leaveKiosk();
        return;
      }
      set({
        bootstrapping: false,
        error: err instanceof Error ? err.message : 'Could not reach the family hub',
      });
    }
  },

  switchProfile: (userId: string | null) => {
    const leavingParent =
      get().activeProfileId !== userId && get().parentUnlockedUntil > Date.now();
    safeSet(PROFILE_KEY, userId);
    if (leavingParent) safeSet(UNLOCK_KEY, null);
    set({
      activeProfileId: userId,
      ...(leavingParent ? { parentUnlockedUntil: 0 } : {}),
    });
  },

  /** Verify the family PIN, then switch into the Parent profile for 30 min. */
  unlockParent: async (pin: string) => {
    const parent =
      get().profiles.find((p) => p.role === 'parent' || p.role === 'admin') ?? get().profiles[0];
    if (!parent) throw new Error('No parent profile to unlock');
    await apiClient.post(
      '/api/kiosk/pin/verify',
      { pin },
      { headers: { 'x-user-id': parent.userId } },
    );
    const until = Date.now() + PARENT_UNLOCK_MS;
    safeSet(UNLOCK_KEY, String(until));
    safeSet(PROFILE_KEY, parent.userId);
    set({ parentUnlockedUntil: until, activeProfileId: parent.userId });
  },

  lockParent: () => {
    safeSet(UNLOCK_KEY, null);
    set({ parentUnlockedUntil: 0 });
  },

  /** Idle timeout / manual lock — clear the active profile and parent unlock. */
  revert: () => {
    safeSet(PROFILE_KEY, null);
    safeSet(UNLOCK_KEY, null);
    set({ activeProfileId: null, parentUnlockedUntil: 0 });
  },

  /** Un-enrol this device — back to normal per-user login. */
  leaveKiosk: () => {
    safeSet(TOKEN_KEY, null);
    safeSet(PROFILE_KEY, null);
    safeSet(UNLOCK_KEY, null);
    set({
      deviceToken: null,
      familyId: null,
      familyName: null,
      profiles: [],
      activeProfileId: null,
      parentUnlockedUntil: 0,
      hasPin: false,
      error: null,
    });
  },
}));

/** Whether this device is running as a shared family display. */
export const selectIsKiosk = (s: KioskState) => !!s.deviceToken;

/** Whether the Parent profile is currently unlocked. */
export const selectParentUnlocked = (s: KioskState) => s.parentUnlockedUntil > Date.now();
