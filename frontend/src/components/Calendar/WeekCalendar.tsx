import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Calendar, Ban, Plus, Pencil, Trash2 } from 'lucide-react';
import { useCalendar } from '@hooks/useCalendar';
import { useAuth } from '@hooks/useAuth';
import { EventForm, type EventFormValues, type EventFormInitial } from './EventForm';

interface CalendarEvent {
  id: string;
  title: string;
  time?: string;
  startTime?: number;
  endTime?: number;
  allDay: boolean;
  isPast?: boolean;
  type: 'google' | 'family' | 'reminder';
  priority: boolean;
  location?: string;
  description?: string;
  summary?: string;
  event_title?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  calendarId?: string;
  calendarName?: string;
  calendarColor?: string;
  created_by_id?: string;
  google_event_id?: string;
  google_calendar_id?: string;
  attendees?: Array<{ email?: string; self?: boolean }>;
}

// A form-created (B-lite) event carries a google_event_id. Only its creator
// gets Edit/Delete (the Google copy lives on their calendar).
function isEditableBy(event: CalendarEvent, userId?: string): boolean {
  return !!event.google_event_id && !!userId && event.created_by_id === userId;
}

function toFormInitial(event: CalendarEvent): EventFormInitial {
  const startRaw = event.start?.dateTime || event.start?.date || '';
  const endRaw = event.end?.dateTime || event.end?.date || '';
  return {
    google_event_id: event.google_event_id,
    summary: event.title || event.summary || event.event_title,
    description: event.description,
    location: event.location,
    allDay: event.allDay,
    startDate: startRaw.slice(0, 10) || undefined,
    startTime: event.start?.dateTime ? startRaw.slice(11, 16) : undefined,
    endTime: event.end?.dateTime ? endRaw.slice(11, 16) : undefined,
    attendees: (event.attendees ?? [])
      .filter((a) => a.self !== true && !!a.email)
      .map((a) => a.email as string),
  };
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getEventColor(type: string): string {
  switch (type) {
    case 'google':
      return 'bg-accent/10 border-accent/40 text-accent-strong';
    case 'family':
      return 'bg-leaf/10 border-leaf/40 text-leaf';
    case 'reminder':
      return 'bg-haldi/10 border-haldi/50 text-warn';
    default:
      return 'bg-rule/40 border-rule-2 text-ink-2';
  }
}

// Format date respecting timezone (fixes Issue #4: timezone bug)
function getDateKeyWithTimezone(date: Date, timezone?: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    // Fallback to browser timezone if timezone is invalid
    return date.toLocaleDateString('en-CA');
  }
}


export function WeekCalendar() {
  const {
    events, loading, tokenExpired, googleConnected, connectGoogle,
    createEvent, updateEvent, deleteEvent,
  } = useCalendar();
  const { user, isLoading: authLoading } = useAuth();
  const canManage = user?.role === 'parent' || user?.role === 'admin';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dismissedEventIds, setDismissedEventIds] = useState<Set<string>>(new Set());
  // Set when a Google dismiss couldn't decline the invite because the stored
  // token predates the calendar.events scope — prompts a reconnect.
  const [reconnectForSync, setReconnectForSync] = useState(false);
  // Event form: closed | create (optional pre-filled date) | edit (an event).
  const [formState, setFormState] = useState<
    | { mode: 'closed' }
    | { mode: 'create'; date?: string }
    | { mode: 'edit'; event: CalendarEvent }
  >({ mode: 'closed' });
  const [deleting, setDeleting] = useState(false);

  const handleFormSubmit = async (values: EventFormValues) => {
    if (formState.mode === 'edit' && formState.event.google_event_id) {
      await updateEvent(formState.event.google_event_id, values);
    } else {
      await createEvent(values);
    }
  };

  const handleDelete = async (event: CalendarEvent) => {
    if (!event.google_event_id || deleting) return;
    setDeleting(true);
    try {
      await deleteEvent(event.google_event_id);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Failed to delete event:', err);
    } finally {
      setDeleting(false);
    }
  };

  const dismissEvent = async (eventId: string, source: 'google' | 'local', calendarId?: string) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    setDismissedEventIds(prev => new Set([...prev, eventId]));

    try {
      const res = await fetch(`/api/calendar/events/${eventId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ calendarId, source }),
      });
      const body = await res.json().catch(() => null);
      if (body?.data?.reason === 'reconnect_required') {
        setReconnectForSync(true);
      }
    } catch (error) {
      console.error('Failed to dismiss event:', error);
      // Revert UI state on error
      setDismissedEventIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  // Load dismissed events once user is authenticated
  useEffect(() => {
    // Wait for auth to load and user to be available
    if (authLoading || !user?.id) {
      return;
    }

    const loadDismissedEvents = async () => {
      try {
        const response = await fetch('/api/calendar/dismissed', {
          headers: { 'x-user-id': user.id },
        });
        if (response.ok) {
          const data = await response.json();
          const ids = new Set<string>(data.data?.map((d: any) => d.event_id) || []);
          setDismissedEventIds(ids);
        }
      } catch (error) {
        console.error('Failed to load dismissed events:', error);
      }
    };

    loadDismissedEvents();
  }, [user?.id, authLoading]);

  // Get start of week (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const goToPreviousWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const goToNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const organizeEventsByDay = (): Map<string, CalendarEvent[]> => {
    const eventMap = new Map<string, CalendarEvent[]>();

    weekDays.forEach((day) => {
      const dateKey = getDateKeyWithTimezone(day);
      eventMap.set(dateKey, []);
    });

    const todayKey = getDateKeyWithTimezone(new Date());

    if (events) {
      events.forEach((event: any) => {
        if (dismissedEventIds.has(event.id)) return;

        const eventStartDate = event.start?.dateTime || event.start?.date || event.event_date || event.startTime;
        if (!eventStartDate) return;

        // Google all-day events (start.date) and local family events
        // (event_date, a Postgres DATE column) are plain "YYYY-MM-DD"
        // strings with no time component. `new Date('2026-08-22')` parses
        // that as UTC midnight, so formatting it back in any timezone west
        // of UTC (e.g. this app's own America/New_York default) lands on
        // the previous day. A bare calendar date has no timezone to
        // convert — use it as the key directly instead of round-tripping
        // through Date/Intl.
        const isDateOnly = typeof eventStartDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(eventStartDate);
        const dateKey = isDateOnly
          ? eventStartDate
          : getDateKeyWithTimezone(new Date(eventStartDate), event.start?.timeZone);

        if (eventMap.has(dateKey)) {
          const calEvent: CalendarEvent = {
            id: event.id,
            title: event.summary || event.event_title || event.title || 'Untitled Event',
            time: event.start?.dateTime
              ? new Date(event.start.dateTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              : undefined,
            allDay: isDateOnly,
            isPast: dateKey < todayKey,
            type: event.source === 'google' ? 'google' : 'family',
            priority: false,
            location: event.location,
            description: event.description || event.event_description,
            ...event,
          };

          eventMap.get(dateKey)!.push(calEvent);
        }
      });
    }

    // Sort events: starred first, then others
    eventMap.forEach((events) => {
      events.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority ? 1 : -1;
        return 0;
      });
    });

    return eventMap;
  };

  const eventsByDay = organizeEventsByDay();

  if (loading) {
    return (
      <div className="card mb-8 p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="mt-4 text-ink-2">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="card mb-8">
      {/* Token Expiration Alert */}
      {tokenExpired && (
        <div className="mb-6 p-4 bg-warn/10 border border-warn/40 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-warn">
                🔐 Google Calendar authorization expired
              </p>
              <p className="text-xs text-warn mt-1">
                Please re-authorize to sync your Google Calendar events
              </p>
            </div>
            <button
              onClick={() => connectGoogle()}
              className="ml-4 px-3 py-2 bg-warn hover:opacity-90 text-white text-sm font-medium rounded transition"
            >
              Re-authorize
            </button>
          </div>
        </div>
      )}

      {/* Not Connected Prompt */}
      {!tokenExpired && !googleConnected && (
        <div className="mb-6 p-4 bg-accent-soft border border-accent/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-accent-strong">
                📅 Google Calendar isn't connected
              </p>
              <p className="text-xs text-accent-strong mt-1">
                Connect it to see your Google events alongside your family calendar
              </p>
            </div>
            <button
              onClick={() => connectGoogle()}
              className="ml-4 px-3 py-2 bg-accent hover:bg-accent-strong text-white text-sm font-medium rounded transition"
            >
              Connect Google Calendar
            </button>
          </div>
        </div>
      )}

      {/* Reconnect for two-way sync */}
      {reconnectForSync && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                🔁 Reconnect to decline invites in Google
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                The event was hidden here, but declining it in your Google Calendar needs updated access.
              </p>
            </div>
            <button
              onClick={() => connectGoogle()}
              className="ml-4 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded transition"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousWeek}
          className="p-2 hover:bg-accent-soft rounded-lg transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          <h2 className="text-2xl font-bold text-ink font-display">
            {formatWeekRange()}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={() => setFormState({ mode: 'create' })}
              className="btn btn-primary btn-small flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add event
            </button>
          )}
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-accent-soft rounded-lg transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Simple Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day, idx) => {
          const dateKey = getDateKeyWithTimezone(day);
          const dayEvents = eventsByDay.get(dateKey) || [];
          const isToday = new Date().toDateString() === day.toDateString();

          return (
            <div
              key={idx}
              data-testid={`day-cell-${dateKey}`}
              className={`group/day rounded-lg border-2 p-3 min-h-32 flex flex-col ${
                isToday
                  ? 'border-accent bg-accent-soft'
                  : 'border-rule bg-paper'
              }`}
            >
              {/* Day Header */}
              <div className="mb-3 pb-2 border-b border-rule flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-ink-3 uppercase">
                    {DAYS[idx]}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'text-accent' : 'text-ink'}`}>
                    {day.getDate()}
                  </div>
                </div>
                {canManage && (
                  <button
                    onClick={() => setFormState({ mode: 'create', date: dateKey })}
                    className="opacity-0 group-hover/day:opacity-100 transition text-ink-3 hover:text-accent"
                    title={`Add event on ${dateKey}`}
                    aria-label={`Add event on ${dateKey}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Events */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-ink-3 italic">No events</p>
                ) : (
                  dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-2 rounded border-l-3 hover:shadow-md transition group ${getEventColor(event.type)} ${
                        event.isPast ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-1">
                        {event.priority && <Star className="w-3 h-3 flex-shrink-0 fill-current mt-0.5" />}
                        {event.calendarColor && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                            style={{ backgroundColor: event.calendarColor }}
                            title={event.calendarName}
                          />
                        )}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <p className="font-medium truncate">{event.title}</p>
                          {event.time && <p className="text-xs opacity-75">{event.time}</p>}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Your own form-created event: local-hide only. The
                            // Ban button is one misclick from firing Google
                            // cancellation emails — real removal is the Delete
                            // button in the detail modal.
                            const source =
                              isEditableBy(event, user?.id) || event.type !== 'google'
                                ? 'local'
                                : 'google';
                            dismissEvent(event.id, source, event.calendarId);
                          }}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition hover:text-alert"
                          title="Dismiss event"
                        >
                          <Ban className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-raised border border-rule rounded-card p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 flex-1">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedEvent.calendarColor || '#3b82f6' }}
                ></span>
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-xs text-ink-3 uppercase tracking-wide">
                    📅 {selectedEvent.calendarName || 'Google Calendar'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-ink-3 hover:text-accent ml-2"
              >
                ✕
              </button>
            </div>

            {selectedEvent.time && (
              <p className="text-sm font-medium text-ink-2 mb-3">
                🕐 {selectedEvent.time}
              </p>
            )}

            {selectedEvent.location && (
              <p className="text-sm text-ink-2 mb-3">
                📍 {selectedEvent.location}
              </p>
            )}

            {selectedEvent.description && (
              <p className="text-sm text-ink-2 mb-4 p-3 bg-paper border border-rule rounded">
                {selectedEvent.description}
              </p>
            )}

            <div className="flex gap-2 pt-4 border-t border-rule">
              <button className="flex-1 btn btn-secondary text-sm" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
              {isEditableBy(selectedEvent, user?.id) && (
                <>
                  <button
                    className="btn btn-secondary text-sm flex items-center gap-1"
                    onClick={() => {
                      setFormState({ mode: 'edit', event: selectedEvent });
                      setSelectedEvent(null);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    className="btn text-sm flex items-center gap-1 bg-alert text-white hover:opacity-90 disabled:opacity-60"
                    onClick={() => handleDelete(selectedEvent)}
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        </>
      )}

      {formState.mode !== 'closed' && (
        <EventForm
          mode={formState.mode}
          initial={formState.mode === 'edit' ? toFormInitial(formState.event) : undefined}
          initialDate={formState.mode === 'create' ? formState.date : undefined}
          onSubmit={handleFormSubmit}
          onClose={() => setFormState({ mode: 'closed' })}
        />
      )}
    </div>
  );
}
