import { useEffect, useState } from 'react';

/**
 * A ticking wall clock for the top bar. Re-renders about once a minute (aligned
 * to the next minute boundary) so `h:mm` stays correct without a 1s interval.
 */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const ms = 60_000 - (Date.now() % 60_000);
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, ms + 50);
    };

    schedule();
    return () => clearTimeout(timer);
  }, []);

  return now;
}

export function formatClockTime(d: Date): string {
  return d
    .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    .replace(/\s?[AP]M$/i, '');
}

export function formatClockDate(d: Date): string {
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
