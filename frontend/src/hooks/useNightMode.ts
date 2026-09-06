import { useEffect, useState } from 'react';

/**
 * Night mode (FR-017 / T-05). Default is AUTO: dark 21:00–06:00, light the rest
 * of the day, re-evaluated every minute so it flips on the boundary without a
 * reload. A manual toggle is a TEMPORARY override — it forces light/dark only
 * until the next 21:00 or 06:00 boundary, then Auto resumes (a wall display
 * shouldn't get stuck in the wrong mode overnight).
 */
const NIGHT_START = 21; // 09 PM
const NIGHT_END = 6; //    06 AM
const STORAGE_KEY = 'fh:nightOverride';
const TICK_MS = 60_000;

interface Override {
  value: boolean;
  until: number; // epoch ms; the override lapses at the next schedule boundary
}

interface UseNightModeReturn {
  isNightMode: boolean;
  /** true while a manual override is in effect (before it lapses). */
  isOverridden: boolean;
  toggleNightMode: () => void;
}

function isNightAt(d: Date): boolean {
  const h = d.getHours();
  return h >= NIGHT_START || h < NIGHT_END;
}

/** Epoch ms of the next 21:00 / 06:00 boundary at or after `d`. */
function nextBoundary(d: Date): number {
  const b = new Date(d);
  b.setMinutes(0, 0, 0);
  const h = d.getHours();
  if (h < NIGHT_END) {
    b.setHours(NIGHT_END); // this morning's 06:00
  } else if (h < NIGHT_START) {
    b.setHours(NIGHT_START); // tonight's 21:00
  } else {
    b.setDate(b.getDate() + 1); // tomorrow's 06:00
    b.setHours(NIGHT_END);
  }
  return b.getTime();
}

function readOverride(): Override | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Override;
    if (typeof o?.value === 'boolean' && typeof o?.until === 'number' && o.until > Date.now()) {
      return o;
    }
  } catch {
    /* corrupt / storage disabled — fall through to Auto */
  }
  return null;
}

function clearOverride(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function effective(now: Date, override: Override | null): boolean {
  if (override && override.until > now.getTime()) return override.value;
  return isNightAt(now);
}

export function useNightMode(): UseNightModeReturn {
  const [override, setOverride] = useState<Override | null>(() => readOverride());
  const [isNightMode, setIsNightMode] = useState<boolean>(() =>
    effective(new Date(), readOverride()),
  );

  // Paint <html> whenever the effective mode changes.
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('dark', isNightMode);
    el.style.colorScheme = isNightMode ? 'dark' : 'light';
  }, [isNightMode]);

  // Re-evaluate now + every minute: crosses the schedule boundary and expires a
  // lapsed override.
  useEffect(() => {
    const apply = () => {
      const now = new Date();
      if (override && override.until <= now.getTime()) {
        clearOverride();
        setOverride(null); // re-runs this effect with the cleared value
        return;
      }
      setIsNightMode(effective(now, override));
    };
    apply();
    const id = setInterval(apply, TICK_MS);
    return () => clearInterval(id);
  }, [override]);

  const toggleNightMode = () => {
    const now = new Date();
    const next: Override = { value: !effective(now, override), until: nextBoundary(now) };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage disabled — the override just won't survive a reload */
    }
    setOverride(next);
    setIsNightMode(next.value);
  };

  return { isNightMode, isOverridden: override != null, toggleNightMode };
}
