import { useCallback, useState } from 'react';

/**
 * FR-145: which calendar layout the dashboard shows — Day / Week / Month /
 * Schedule (agenda). Persisted per profile so each family member keeps their
 * own choice; Week is the default. Schedule view is the wall-display priority.
 */
export type CalendarView = 'day' | 'week' | 'month' | 'schedule';

export const CALENDAR_VIEWS: { key: CalendarView; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'schedule', label: 'Schedule' },
];

const DEFAULT_VIEW: CalendarView = 'week';

function isCalendarView(v: unknown): v is CalendarView {
  return v === 'day' || v === 'week' || v === 'month' || v === 'schedule';
}

export function useCalendarView(profileKey: string) {
  const storageKey = `fh:calView:${profileKey}`;

  const [view, setViewState] = useState<CalendarView>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (isCalendarView(raw)) return raw;
    } catch {
      /* private mode / storage disabled — fall through to the default */
    }
    return DEFAULT_VIEW;
  });

  const setView = useCallback(
    (next: CalendarView) => {
      setViewState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        /* storage disabled — the choice just won't survive a reload */
      }
    },
    [storageKey],
  );

  return { view, setView };
}
