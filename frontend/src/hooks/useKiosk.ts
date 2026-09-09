import {
  useKioskStore,
  selectIsKiosk,
  selectParentUnlocked,
  type KioskProfile,
} from '@stores/kioskStore';

export type { KioskProfile };

/**
 * Thin view over the kiosk store for components. `isKiosk` is true when this
 * device is running as a shared family display; `activeProfile` is whoever's
 * face is currently selected (null on the attract screen).
 */
export function useKiosk() {
  const isKiosk = useKioskStore(selectIsKiosk);
  const isParentUnlocked = useKioskStore(selectParentUnlocked);
  const profiles = useKioskStore((s) => s.profiles);
  const activeProfileId = useKioskStore((s) => s.activeProfileId);
  const familyName = useKioskStore((s) => s.familyName);
  const hasPin = useKioskStore((s) => s.hasPin);
  const idleMinutes = useKioskStore((s) => s.idleMinutes);
  const error = useKioskStore((s) => s.error);
  const bootstrapping = useKioskStore((s) => s.bootstrapping);

  const enroll = useKioskStore((s) => s.enroll);
  const bootstrap = useKioskStore((s) => s.bootstrap);
  const switchProfile = useKioskStore((s) => s.switchProfile);
  const unlockParent = useKioskStore((s) => s.unlockParent);
  const lockParent = useKioskStore((s) => s.lockParent);
  const revert = useKioskStore((s) => s.revert);
  const leaveKiosk = useKioskStore((s) => s.leaveKiosk);

  const activeProfile = profiles.find((p) => p.userId === activeProfileId) ?? null;

  return {
    isKiosk,
    isParentUnlocked,
    profiles,
    activeProfileId,
    activeProfile,
    familyName,
    hasPin,
    idleMinutes,
    error,
    bootstrapping,
    enroll,
    bootstrap,
    switchProfile,
    unlockParent,
    lockParent,
    revert,
    leaveKiosk,
  };
}
