/**
 * WeekCalendar Component Tests
 *
 * Regression coverage for TASK-006 / Issue #4 (timezone handling). All-day
 * Google events (`start.date`) and local family events (`event_date`, a
 * Postgres DATE column) are plain "YYYY-MM-DD" strings with no time
 * component. `new Date('2026-08-22')` parses that as UTC midnight, so
 * formatting it back through Intl.DateTimeFormat in any timezone west of
 * UTC — including this app's own default family timezone, America/New_York
 * — lands one calendar day early. A bare date has nothing to convert; the
 * fix uses the string directly as the day-bucket key instead of round-
 * tripping it through Date/Intl.
 */

import { vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { WeekCalendar } from '../../components/Calendar/WeekCalendar';
import { useCalendar } from '@hooks/useCalendar';
import { useAuth } from '@hooks/useAuth';

vi.mock('@hooks/useCalendar');
vi.mock('@hooks/useAuth');

const originalFetch = global.fetch;

describe('WeekCalendar — timezone handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Noon local time, safely inside the same calendar day in every
    // timezone, so "today" is unambiguous regardless of the system TZ this
    // suite happens to run under.
    vi.setSystemTime(new Date('2026-08-22T12:00:00'));

    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'user-1' },
      isLoading: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
  });

  function todayCell() {
    // getDateKeyWithTimezone formats with the 'en-CA' locale, which is
    // already YYYY-MM-DD — the same shape the fix uses for date-only values.
    const key = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    return screen.getByTestId(`day-cell-${key}`);
  }

  it('places a Google all-day event on the correct calendar day', () => {
    (useCalendar as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      upcomingEvents: [
        {
          id: 'g-1',
          summary: 'Company Picnic',
          start: { date: '2026-08-22' },
          source: 'google',
        },
      ],
      loading: false,
      tokenExpired: false,
      connectGoogle: vi.fn(),
    });

    render(<WeekCalendar />);

    expect(within(todayCell()).getByText('Company Picnic')).toBeInTheDocument();
  });

  it('places a local family event on the correct calendar day', () => {
    (useCalendar as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      upcomingEvents: [
        {
          id: 'l-1',
          event_title: 'Dentist Appointment',
          event_date: '2026-08-22',
          source: 'local',
        },
      ],
      loading: false,
      tokenExpired: false,
      connectGoogle: vi.fn(),
    });

    render(<WeekCalendar />);

    expect(within(todayCell()).getByText('Dentist Appointment')).toBeInTheDocument();
  });

  it('still applies timezone conversion for timed Google events', () => {
    (useCalendar as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      upcomingEvents: [
        {
          id: 'g-2',
          summary: 'Standup',
          start: { dateTime: '2026-08-22T09:00:00-04:00', timeZone: 'America/New_York' },
          source: 'google',
        },
      ],
      loading: false,
      tokenExpired: false,
      connectGoogle: vi.fn(),
    });

    render(<WeekCalendar />);

    expect(within(todayCell()).getByText('Standup')).toBeInTheDocument();
  });
});
