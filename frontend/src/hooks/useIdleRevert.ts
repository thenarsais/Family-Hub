import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from './useKiosk';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const;

/**
 * On a shared display, drop back to the attract screen after `idleMinutes` of no
 * interaction — clearing the active profile and re-locking the Parent profile.
 * A no-op unless we're in kiosk mode with a profile selected.
 */
export function useIdleRevert() {
  const { isKiosk, activeProfileId, idleMinutes, revert } = useKiosk();
  const navigate = useNavigate();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isKiosk || !activeProfileId) return;

    const ms = Math.max(1, idleMinutes) * 60_000;

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        revert();
        navigate('/');
      }, ms);
    };

    reset();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      if (timer.current) clearTimeout(timer.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [isKiosk, activeProfileId, idleMinutes, revert, navigate]);
}
