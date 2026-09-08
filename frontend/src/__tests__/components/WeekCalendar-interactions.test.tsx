/**
 * WeekCalendar Component — interaction coverage
 *
 * WeekCalendar.test.tsx (timezone handling) always renders with
 * googleConnected: true and never clicks anything, so the connection
 * banners, event detail modal, dismiss flow, and week navigation were never
 * exercised. This file covers those paths. Uses fireEvent (not userEvent)
 * throughout since userEvent's internal delay simulation conflicts with the
 * fake timers needed for deterministic "isToday" rendering.
 */

import { vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WeekCalendar } from '@/components/Calendar/WeekCalendar';
import { useCalendar } from '@hooks/useCalendar';
import { useAuth } from '@hooks/useAuth';

vi.mock('@hooks/useCalendar');
vi.mock('@hooks/useAuth');

// Meal planner is a real (networked) hook now — stub it with a fixed plan so
// the FR-150 meals-line assertions stay deterministic.
const MEAL_PLAN: Record<string, { breakfast: string; lunch: string; dinner: string; snack: string }> = {
  '2026-08-17': { breakfast: '', lunch: '', dinner: 'Pasta primavera', snack: '' },
  '2026-08-22': { breakfast: '', lunch: '', dinner: 'Family potluck', snack: '' },
};
vi.mock('@hooks/useMealPlanner', () => ({
  MEAL_SLOTS: ['breakfast', 'lunch', 'dinner', 'snack'],
  useMealPlanner: () => ({
    meals: [],
    loading: false,
    error: null,
    updateMeal: vi.fn(),
    refresh: vi.fn(),
    mealForDate: (date: Date) => {
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`;
      const slots = MEAL_PLAN[iso];
      return slots ? { date: iso, day: '', ...slots } : undefined;
    },
  }),
}));
vi.mock('@hooks/useMealLibrary', () => ({
  useMealLibrary: () => ({
    library: [],
    loading: false,
    error: null,
    addToLibrary: vi.fn(),
    renameLibraryItem: vi.fn(),
    setLibraryItemSlot: vi.fn(),
    removeFromLibrary: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const originalFetch = global.fetch;

function mockCalendar(overrides: Record<string, unknown> = {}) {
  (useCalendar as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    events: [],
    loading: false,
    tokenExpired: false,
    googleConnected: true,
    googleEmail: null,
    dismissedIds: new Set<string>(),
    dismissedEvents: [],
    reconnectForSync: false,
    connectGoogle: vi.fn(),
    disconnectGoogle: vi.fn().mockResolvedValue(undefined),
    createEvent: vi.fn().mockResolvedValue({}),
    updateEvent: vi.fn().mockResolvedValue({}),
    deleteEvent: vi.fn().mockResolvedValue(undefined),
    dismissEvent: vi.fn().mockResolvedValue(undefined),
    restoreEvent: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

describe('WeekCalendar — interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    try { window.localStorage.clear(); } catch { /* storage disabled */ }
    vi.useFakeTimers();
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

  it('shows a loading spinner while the calendar is loading', () => {
    mockCalendar({ loading: true });

    render(<WeekCalendar />);

    expect(screen.getByText(/loading calendar/i)).toBeInTheDocument();
  });

  it('shows the token-expired banner and calls connectGoogle on re-authorize', () => {
    const connectGoogle = vi.fn();
    mockCalendar({ tokenExpired: true, connectGoogle });

    render(<WeekCalendar />);

    expect(screen.getByText(/authorization expired/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /re-authorize/i }));

    expect(connectGoogle).toHaveBeenCalled();
  });

  it('shows the not-connected banner and calls connectGoogle when clicked', () => {
    const connectGoogle = vi.fn();
    mockCalendar({ googleConnected: false, connectGoogle });

    render(<WeekCalendar />);

    expect(screen.getByText(/isn't connected/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /connect google calendar/i }));

    expect(connectGoogle).toHaveBeenCalled();
  });

  it('hides both banners once google is connected and the token is valid', () => {
    mockCalendar({ tokenExpired: false, googleConnected: true });

    render(<WeekCalendar />);

    expect(screen.queryByText(/authorization expired/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/isn't connected/i)).not.toBeInTheDocument();
  });

  it('shows "No events" for a day with nothing scheduled', () => {
    mockCalendar();

    render(<WeekCalendar />);

    expect(screen.getAllByText(/no events/i).length).toBeGreaterThan(0);
  });

  it('navigates to the previous and next week', () => {
    mockCalendar();
    render(<WeekCalendar />);

    const initialHeading = screen.getByRole('heading', { level: 2 }).textContent;

    fireEvent.click(screen.getAllByRole('button')[0]); // ChevronLeft is the first button
    const prevHeading = screen.getByRole('heading', { level: 2 }).textContent;
    expect(prevHeading).not.toBe(initialHeading);

    // Navigate forward twice to get back past the original week
    const nextButtons = screen.getAllByRole('button');
    fireEvent.click(nextButtons[nextButtons.length === 0 ? 0 : 1]);
  });

  describe('event detail modal', () => {
    const event = {
      id: 'g-1',
      summary: 'Team Standup',
      start: { date: '2026-08-22' },
      source: 'google',
      location: 'Conference Room A',
      description: 'Daily sync',
    };

    it('opens the modal with event details when an event is clicked', () => {
      mockCalendar({ events: [event] });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByText('Team Standup'));

      expect(screen.getByText(/Conference Room A/)).toBeInTheDocument();
      expect(screen.getByText('Daily sync')).toBeInTheDocument();
    });

    it('closes the modal via the X button', () => {
      mockCalendar({ events: [event] });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByText('Team Standup'));
      expect(screen.getByText(/Conference Room A/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '✕' }));

      expect(screen.queryByText(/Conference Room A/)).not.toBeInTheDocument();
    });

    it('closes the modal via the Close button', () => {
      mockCalendar({ events: [event] });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByText('Team Standup'));
      fireEvent.click(screen.getByRole('button', { name: /^close$/i }));

      expect(screen.queryByText(/Conference Room A/)).not.toBeInTheDocument();
    });

    it('the Hide button dismisses the event and closes the modal', () => {
      const dismissEvent = vi.fn().mockResolvedValue(undefined);
      mockCalendar({ events: [{ ...event, calendarId: 'cal-1' }], dismissEvent });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByText('Team Standup'));
      fireEvent.click(screen.getByRole('button', { name: /^hide$/i }));

      expect(dismissEvent).toHaveBeenCalledWith('g-1', 'google', 'cal-1', undefined);
      expect(screen.queryByText(/Conference Room A/)).not.toBeInTheDocument();
    });

    it('Hide on a recurring event opens the scope prompt instead of dismissing', () => {
      const dismissEvent = vi.fn().mockResolvedValue(undefined);
      mockCalendar({
        events: [{ ...event, calendarId: 'primary', recurringEventId: 'rid-1' }],
        dismissEvent,
      });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByText('Team Standup'));
      fireEvent.click(screen.getByRole('button', { name: /^hide$/i }));

      expect(dismissEvent).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog', { name: /hide recurring event/i })).toBeInTheDocument();
      expect(screen.queryByText(/Conference Room A/)).not.toBeInTheDocument();
    });
  });

  describe('dismissing an event', () => {
    const event = {
      id: 'g-1',
      summary: 'Team Standup',
      start: { date: '2026-08-22' },
      source: 'google',
      calendarId: 'cal-1',
    };

    // The dismiss/restore mechanics (optimistic hide, revert, Google decline,
    // reconnect reason) now live in useCalendar and are covered there. Here we
    // only check WeekCalendar wires the ✕ button to the hook correctly.

    it('calls dismissEvent(id, source, calendarId) without opening the modal', () => {
      const dismissEvent = vi.fn().mockResolvedValue(undefined);
      mockCalendar({ events: [event], dismissEvent });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByTitle('Dismiss event'));

      expect(dismissEvent).toHaveBeenCalledWith('g-1', 'google', 'cal-1', undefined);
      expect(screen.queryByRole('button', { name: '✕' })).not.toBeInTheDocument();
    });

    it('passes source "local" for a family event', () => {
      const dismissEvent = vi.fn().mockResolvedValue(undefined);
      mockCalendar({
        events: [
          { id: 'l-1', event_title: 'Chore', event_date: '2026-08-22', source: 'local', calendarId: 'family' },
        ],
        dismissEvent,
      });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByTitle('Dismiss event'));

      expect(dismissEvent).toHaveBeenCalledWith('l-1', 'local', 'family', undefined);
    });

    it('hides events whose id is in dismissedIds', () => {
      mockCalendar({ events: [event], dismissedIds: new Set(['g-1']) });
      render(<WeekCalendar />);
      expect(screen.queryByText('Team Standup')).not.toBeInTheDocument();
    });

    it('shows the reconnect prompt when the hook reports reconnectForSync', () => {
      mockCalendar({ events: [event], reconnectForSync: true });
      render(<WeekCalendar />);
      expect(screen.getByText(/decline invites in Google/i)).toBeInTheDocument();
    });
  });

  it('marks today\'s cell distinctly from other days', () => {
    mockCalendar();
    render(<WeekCalendar />);

    const key = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const todayCell = screen.getByTestId(`day-cell-${key}`);

    expect(todayCell.className).toContain('border-accent');
  });

  it('skips events whose calendar day is outside the loaded week map', () => {
    mockCalendar({
      events: [{ id: 'far-future', summary: 'Way later', event_date: '2099-01-01', source: 'local' }],
    });

    render(<WeekCalendar />);

    expect(screen.queryByText('Way later')).not.toBeInTheDocument();
  });

  it('skips events with no resolvable date', () => {
    mockCalendar({
      events: [{ id: 'no-date', summary: 'Undated', source: 'local' }],
    });

    expect(() => render(<WeekCalendar />)).not.toThrow();
    expect(screen.queryByText('Undated')).not.toBeInTheDocument();
  });

  it('falls back to a default title for an event with no summary/title fields', () => {
    mockCalendar({
      events: [{ id: 'blank', event_date: '2026-08-22', source: 'local' }],
    });

    render(<WeekCalendar />);

    expect(within(screen.getByTestId(`day-cell-2026-08-22`)).getByText('Untitled Event')).toBeInTheDocument();
  });

  describe('past events', () => {
    // System time is 2026-08-22; the visible week is Aug 17–23.
    const pastEvent = {
      id: 'past-1',
      summary: 'Monday Standup',
      start: { dateTime: '2026-08-18T09:00:00-04:00', timeZone: 'America/New_York' },
      source: 'google',
      location: 'Room A',
    };

    it('renders a past event in the current week, muted', () => {
      mockCalendar({ events: [pastEvent] });
      render(<WeekCalendar />);

      const cell = screen.getByTestId('day-cell-2026-08-18');
      const eventEl = within(cell).getByText('Monday Standup').closest('div.group');
      expect(eventEl?.className).toContain('opacity-60');
    });

    it('keeps a past event fully interactive (modal opens on click)', () => {
      mockCalendar({ events: [pastEvent] });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByText('Monday Standup'));
      expect(screen.getByText(/Room A/)).toBeInTheDocument();
    });

    it('does not mute a future event', () => {
      mockCalendar({
        events: [{ id: 'fut-1', summary: 'Sunday Brunch', start: { date: '2026-08-23' }, source: 'google' }],
      });
      render(<WeekCalendar />);

      const eventEl = within(screen.getByTestId('day-cell-2026-08-23'))
        .getByText('Sunday Brunch')
        .closest('div.group');
      expect(eventEl?.className).not.toContain('opacity-60');
    });
  });

  describe('event management', () => {
    const asParent = () =>
      (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', role: 'parent' },
        isLoading: false,
      });

    it('hides the "Add event" button from non-parents', () => {
      mockCalendar();
      render(<WeekCalendar />);
      expect(screen.queryByRole('button', { name: /add event/i })).not.toBeInTheDocument();
    });

    it('shows "Add event" to a parent and opens the create form', () => {
      asParent();
      mockCalendar();
      render(<WeekCalendar />);

      fireEvent.click(screen.getByRole('button', { name: /^add event$/i }));
      expect(screen.getByRole('heading', { name: /new event/i })).toBeInTheDocument();
    });

    it('creates an event through the form', async () => {
      asParent();
      const createEvent = vi.fn().mockResolvedValue({});
      mockCalendar({ createEvent });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByRole('button', { name: /^add event$/i }));
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Piano recital' } });
      fireEvent.submit(screen.getByRole('button', { name: /create event/i }).closest('form')!);

      await vi.waitFor(() => expect(createEvent).toHaveBeenCalled());
      expect(createEvent.mock.calls[0][0]).toMatchObject({ summary: 'Piano recital', allDay: false });
    });

    it('pre-fills the date when a day cell "+" is used', () => {
      asParent();
      mockCalendar();
      render(<WeekCalendar />);

      const cell = screen.getByTestId('day-cell-2026-08-20');
      fireEvent.click(within(cell).getByRole('button', { name: /add event on 2026-08-20/i }));

      expect((screen.getByLabelText('Start date') as HTMLInputElement).value).toBe('2026-08-20');
    });

    it('shows Edit/Delete only on the creator\'s own feature-created event', () => {
      asParent();
      mockCalendar({
        events: [{
          id: 'g-1', summary: 'My event', source: 'google',
          start: { dateTime: '2026-08-22T10:00:00-04:00', timeZone: 'America/New_York' },
          google_event_id: 'g-1', created_by_id: 'user-1',
        }],
      });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByText('My event'));
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('hides Edit/Delete on an event created by someone else', () => {
      asParent();
      mockCalendar({
        events: [{
          id: 'g-2', summary: 'Their event', source: 'google',
          start: { dateTime: '2026-08-22T10:00:00-04:00', timeZone: 'America/New_York' },
          google_event_id: 'g-2', created_by_id: 'other-user',
        }],
      });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByText('Their event'));
      expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
    });

    it('deletes the creator\'s own event via the hook', async () => {
      asParent();
      const deleteEvent = vi.fn().mockResolvedValue(undefined);
      mockCalendar({
        deleteEvent,
        events: [{
          id: 'g-3', summary: 'Doomed', source: 'google',
          start: { dateTime: '2026-08-22T10:00:00-04:00', timeZone: 'America/New_York' },
          google_event_id: 'g-3', created_by_id: 'user-1',
        }],
      });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByText('Doomed'));
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      await vi.waitFor(() => expect(deleteEvent).toHaveBeenCalledWith('g-3'));
    });

    it('dismiss (✕) on your own feature-created event is a local hide, not a Google decline', () => {
      asParent();
      const dismissEvent = vi.fn().mockResolvedValue(undefined);
      mockCalendar({
        events: [{
          id: 'g-4', summary: 'Mine to hide', source: 'google', type: 'google',
          start: { dateTime: '2026-08-22T10:00:00-04:00', timeZone: 'America/New_York' },
          google_event_id: 'g-4', created_by_id: 'user-1', calendarId: 'primary',
        }],
        dismissEvent,
      });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByTitle('Dismiss event'));

      expect(dismissEvent).toHaveBeenCalledWith('g-4', 'local', 'primary', undefined);
    });
  });

  describe('view toggle (FR-145)', () => {
    const cells = (c: HTMLElement) => c.querySelectorAll('[data-testid^="day-cell-"]');

    it('defaults to the week view (7 day cells)', () => {
      mockCalendar();
      const { container } = render(<WeekCalendar />);
      expect(cells(container)).toHaveLength(7);
    });

    it('switches to the day view — a single cell for the current date', () => {
      mockCalendar();
      const { container } = render(<WeekCalendar />);

      fireEvent.click(screen.getByRole('button', { name: 'Day' }));

      expect(cells(container)).toHaveLength(1);
      expect(screen.getByTestId('day-cell-2026-08-22')).toBeInTheDocument();
      expect(screen.queryByTestId('day-cell-2026-08-21')).not.toBeInTheDocument();
    });

    it('switches to the month view — a 42-cell grid', () => {
      mockCalendar();
      const { container } = render(<WeekCalendar />);

      fireEvent.click(screen.getByRole('button', { name: 'Month' }));

      expect(cells(container)).toHaveLength(42);
      expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/August 2026/);
    });

    it('schedule view lists only days that have events', () => {
      mockCalendar({
        events: [{ id: 'g-1', summary: 'Recital', start: { date: '2026-08-25' }, source: 'google' }],
      });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));

      expect(screen.getByText('Recital')).toBeInTheDocument();
      expect(screen.queryAllByText(/no events/i)).toHaveLength(0);
    });

    it('schedule view shows an empty-state when the window has no events', () => {
      mockCalendar();
      render(<WeekCalendar />);

      fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));

      expect(screen.getByText(/nothing scheduled/i)).toBeInTheDocument();
    });

    it('remembers the chosen view across a re-render', () => {
      mockCalendar();
      const { container, rerender } = render(<WeekCalendar />);

      fireEvent.click(screen.getByRole('button', { name: 'Month' }));
      expect(cells(container)).toHaveLength(42);

      rerender(<WeekCalendar />);
      expect(cells(container)).toHaveLength(42);
    });

    it('prev/next steps one day at a time in the day view', () => {
      mockCalendar();
      render(<WeekCalendar />);

      fireEvent.click(screen.getByRole('button', { name: 'Day' }));
      expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/Aug 22/);

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/Aug 23/);

      fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
      fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
      expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/Aug 21/);
    });

    it('"+N more" in the month view opens that day in the day view', () => {
      mockCalendar({
        events: Array.from({ length: 5 }, (_, i) => ({
          id: `e${i}`, summary: `Event ${i}`, start: { date: '2026-08-22' }, source: 'google',
        })),
      });
      const { container } = render(<WeekCalendar />);

      fireEvent.click(screen.getByRole('button', { name: 'Month' }));
      fireEvent.click(screen.getByRole('button', { name: /\+2 more/ }));

      expect(cells(container)).toHaveLength(1);
      expect(screen.getByTestId('day-cell-2026-08-22')).toBeInTheDocument();
    });
  });

  describe('meals line (FR-150)', () => {
    // useMealPlanner is stubbed (see top of file) with Saturday dinner
    // "Family potluck" and Monday dinner "Pasta primavera". System time is
    // Sat 2026-08-22, so the visible week (Aug 17–23) contains both.

    it('shows a day\'s dinner under the week grid', () => {
      mockCalendar();
      render(<WeekCalendar />);

      expect(within(screen.getByTestId('day-cell-2026-08-22')).getByText('Family potluck')).toBeInTheDocument();
      expect(within(screen.getByTestId('day-cell-2026-08-17')).getByText('Pasta primavera')).toBeInTheDocument();
    });

    it('shows the dinner in the day view', () => {
      mockCalendar();
      render(<WeekCalendar />);

      fireEvent.click(screen.getByRole('button', { name: 'Day' }));
      expect(within(screen.getByTestId('day-cell-2026-08-22')).getByText('Family potluck')).toBeInTheDocument();
    });

    it('shows a compact meals line in the month grid', () => {
      mockCalendar();
      render(<WeekCalendar />);

      fireEvent.click(screen.getByRole('button', { name: 'Month' }));
      expect(within(screen.getByTestId('day-cell-2026-08-22')).getByText('Family potluck')).toBeInTheDocument();
    });
  });

  describe('recurring dismiss scope (FR-126)', () => {
    const recurring = {
      id: 'occ-1',
      summary: 'Weekly Standup',
      start: { date: '2026-08-20' },
      source: 'google',
      calendarId: 'primary',
      recurringEventId: 'rid-1',
    };

    it('✕ on a recurring event opens the scope prompt instead of dismissing', () => {
      const dismissEvent = vi.fn().mockResolvedValue(undefined);
      mockCalendar({ events: [recurring], dismissEvent });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByTitle('Dismiss event'));

      expect(screen.getByRole('dialog', { name: /hide recurring event/i })).toBeInTheDocument();
      expect(dismissEvent).not.toHaveBeenCalled();
    });

    it('"This event" hides just the occurrence (still declines in Google)', () => {
      const dismissEvent = vi.fn().mockResolvedValue(undefined);
      mockCalendar({ events: [recurring], dismissEvent });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByTitle('Dismiss event'));
      fireEvent.click(screen.getByRole('button', { name: /^this event$/i }));

      expect(dismissEvent).toHaveBeenCalledWith('occ-1', 'google', 'primary', { scope: 'occurrence' });
      expect(screen.queryByRole('dialog', { name: /hide recurring event/i })).not.toBeInTheDocument();
    });

    it('"All events in the series" dismisses the whole series locally', () => {
      const dismissEvent = vi.fn().mockResolvedValue(undefined);
      mockCalendar({ events: [recurring], dismissEvent });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByTitle('Dismiss event'));
      fireEvent.click(screen.getByRole('button', { name: /all events in the series/i }));

      expect(dismissEvent).toHaveBeenCalledWith('occ-1', 'local', 'primary', {
        scope: 'series',
        recurringEventId: 'rid-1',
      });
    });

    it('hides every occurrence whose recurringEventId is in dismissedSeriesIds', () => {
      mockCalendar({
        events: [
          { ...recurring, id: 'occ-1', start: { date: '2026-08-18' } },
          { ...recurring, id: 'occ-2', start: { date: '2026-08-20' } },
          { id: 'other', summary: 'One-off', start: { date: '2026-08-19' }, source: 'google' },
        ],
        dismissedSeriesIds: new Set(['rid-1']),
      });
      render(<WeekCalendar />);

      expect(screen.queryByText('Weekly Standup')).not.toBeInTheDocument();
      expect(screen.getByText('One-off')).toBeInTheDocument();
    });
  });
});
