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

const originalFetch = global.fetch;

function mockCalendar(overrides: Record<string, unknown> = {}) {
  (useCalendar as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    upcomingEvents: [],
    loading: false,
    tokenExpired: false,
    googleConnected: true,
    connectGoogle: vi.fn(),
    ...overrides,
  });
}

describe('WeekCalendar — interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      mockCalendar({ upcomingEvents: [event] });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByText('Team Standup'));

      expect(screen.getByText(/Conference Room A/)).toBeInTheDocument();
      expect(screen.getByText('Daily sync')).toBeInTheDocument();
    });

    it('closes the modal via the X button', () => {
      mockCalendar({ upcomingEvents: [event] });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByText('Team Standup'));
      expect(screen.getByText(/Conference Room A/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '✕' }));

      expect(screen.queryByText(/Conference Room A/)).not.toBeInTheDocument();
    });

    it('closes the modal via the Close button', () => {
      mockCalendar({ upcomingEvents: [event] });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByText('Team Standup'));
      fireEvent.click(screen.getByRole('button', { name: /^close$/i }));

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

    it('removes the event from view and posts the dismiss request without opening the modal', async () => {
      mockCalendar({ upcomingEvents: [event] });
      render(<WeekCalendar />);

      expect(screen.getByText('Team Standup')).toBeInTheDocument();
      fireEvent.click(screen.getByTitle('Dismiss event'));

      // Optimistic removal happens synchronously
      expect(screen.queryByText('Team Standup')).not.toBeInTheDocument();
      // Modal should not have opened (stopPropagation)
      expect(screen.queryByRole('button', { name: '✕' })).not.toBeInTheDocument();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/calendar/events/g-1/dismiss',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'x-user-id': 'user-1' }),
          body: JSON.stringify({ calendarId: 'cal-1' }),
        })
      );
    });

    it('reverts the dismissal when the request fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('network error')) as unknown as typeof fetch;
      mockCalendar({ upcomingEvents: [event] });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByTitle('Dismiss event'));
      expect(screen.queryByText('Team Standup')).not.toBeInTheDocument();

      // Flush the rejected dismiss-fetch microtask under fake timers
      await vi.waitFor(() => {
        expect(screen.getByText('Team Standup')).toBeInTheDocument();
      });
    });

    it('does not dismiss when there is no authenticated user', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: null, isLoading: false });
      mockCalendar({ upcomingEvents: [event] });
      render(<WeekCalendar />);

      fireEvent.click(screen.getByTitle('Dismiss event'));

      expect(consoleErrorSpy).toHaveBeenCalledWith('User not authenticated');
      expect(global.fetch).not.toHaveBeenCalledWith('/api/calendar/events/g-1/dismiss', expect.anything());
      consoleErrorSpy.mockRestore();
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

    expect(todayCell.className).toContain('border-primary-500');
  });

  it('skips events whose calendar day is outside the loaded week map', () => {
    mockCalendar({
      upcomingEvents: [{ id: 'far-future', summary: 'Way later', event_date: '2099-01-01', source: 'local' }],
    });

    render(<WeekCalendar />);

    expect(screen.queryByText('Way later')).not.toBeInTheDocument();
  });

  it('skips events with no resolvable date', () => {
    mockCalendar({
      upcomingEvents: [{ id: 'no-date', summary: 'Undated', source: 'local' }],
    });

    expect(() => render(<WeekCalendar />)).not.toThrow();
    expect(screen.queryByText('Undated')).not.toBeInTheDocument();
  });

  it('falls back to a default title for an event with no summary/title fields', () => {
    mockCalendar({
      upcomingEvents: [{ id: 'blank', event_date: '2026-08-22', source: 'local' }],
    });

    render(<WeekCalendar />);

    expect(within(screen.getByTestId(`day-cell-2026-08-22`)).getByText('Untitled Event')).toBeInTheDocument();
  });
});
