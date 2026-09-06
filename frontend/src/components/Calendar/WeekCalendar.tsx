import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Calendar, Ban, Plus, Pencil, Trash2, Settings } from 'lucide-react';
import { useCalendar, type EventAssignment, type DismissOpts } from '@hooks/useCalendar';
import { useAuth } from '@hooks/useAuth';
import { useFamily } from '@hooks/useFamily';
import { useCalendarView, CALENDAR_VIEWS, type CalendarView } from '@hooks/useCalendarView';
import { useMealPlanner } from '@hooks/useMealPlanner';
import { useMealLibrary } from '@hooks/useMealLibrary';
import { EventForm, type EventFormValues, type EventFormInitial } from './EventForm';
import { CalendarSettings } from './CalendarSettings';
import { PersonDots } from './PersonDots';
import { PersonPicker } from './PersonPicker';
import { MealsLine } from './MealsLine';
import { MealDayEditor } from './MealDayEditor';
import { MealLibraryStrip } from './MealLibraryStrip';

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
  // Set on an expanded occurrence of a recurring Google event — the series
  // master id. Its presence enables the "this / whole series" dismiss prompt.
  recurringEventId?: string;
  attendees?: Array<{ email?: string; self?: boolean }>;
}

// A form-created (B-lite) event carries a google_event_id. Only its creator
// gets Edit/Delete (the Google copy lives on their calendar).
function isEditableBy(event: CalendarEvent, userId?: string): boolean {
  return !!event.google_event_id && !!userId && event.created_by_id === userId;
}

function toFormInitial(event: CalendarEvent, people: EventAssignment[] = []): EventFormInitial {
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
    people,
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

/* ------------------------------------------------------------------ */
/* Date-range helpers for the FR-145 view toggle                      */
/* ------------------------------------------------------------------ */

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Monday-based start of the week containing `date`.
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// The 42-cell (6-week) grid for the month containing `date`, starting on the
// Monday on or before the 1st.
function getMonthGridDays(date: Date): Date[] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = getWeekStart(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

// The set of visible days for a given view.
function daysForView(view: CalendarView, currentDate: Date): Date[] {
  switch (view) {
    case 'day':
      return [new Date(currentDate)];
    case 'month':
      return getMonthGridDays(currentDate);
    case 'schedule':
      // A rolling window from today; ScheduleView only renders days with events.
      return Array.from({ length: 45 }, (_, i) => addDays(currentDate, i));
    case 'week':
    default: {
      const ws = getWeekStart(currentDate);
      return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    }
  }
}

export function WeekCalendar() {
  const cal = useCalendar();
  const {
    events, loading, tokenExpired, googleConnected, connectGoogle,
    createEvent, updateEvent, deleteEvent,
  } = cal;
  const googleEmail = cal.googleEmail ?? null;
  const dismissedEventIds: Set<string> = cal.dismissedIds ?? new Set();
  const dismissedSeriesIds: Set<string> = cal.dismissedSeriesIds ?? new Set();
  const dismissedEvents = cal.dismissedEvents ?? [];
  const reconnectForSync = cal.reconnectForSync ?? false;
  const dismissEvent =
    cal.dismissEvent ?? (async () => undefined);
  const restoreEvent =
    cal.restoreEvent ?? (async () => undefined);
  const disconnectGoogle =
    cal.disconnectGoogle ?? (async () => undefined);
  const eventPeople: Map<string, EventAssignment[]> = cal.eventPeople ?? new Map();
  const setEventPeople =
    cal.setEventPeople ?? (async () => undefined);
  const { user } = useAuth();
  const { members } = useFamily();
  const { view, setView } = useCalendarView(user?.id ?? 'anon');
  const { mealForDate, updateMeal } = useMealPlanner();
  const mealLib = useMealLibrary();
  const canManage = user?.role === 'parent' || user?.role === 'admin';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Event form: closed | create (optional pre-filled date) | edit (an event).
  const [formState, setFormState] = useState<
    | { mode: 'closed' }
    | { mode: 'create'; date?: string }
    | { mode: 'edit'; event: CalendarEvent }
  >({ mode: 'closed' });
  const [deleting, setDeleting] = useState(false);
  // FR-126: the ✕ on a recurring event opens this prompt instead of dismissing.
  const [dismissPrompt, setDismissPrompt] = useState<CalendarEvent | null>(null);

  const handleFormSubmit = async (values: EventFormValues) => {
    let eventId: string | undefined;
    if (formState.mode === 'edit' && formState.event.google_event_id) {
      await updateEvent(formState.event.google_event_id, values);
      eventId = formState.event.id;
    } else {
      const created = await createEvent(values);
      eventId =
        (created as { google_event_id?: string }).google_event_id ??
        (created as { id?: string }).id;
    }
    // The event is saved in Google either way — a failure to write the person
    // tags shouldn't wedge the form open.
    if (eventId) {
      try {
        await setEventPeople(eventId, values.people);
      } catch (err) {
        console.error('Failed to save event people:', err);
      }
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

  const handleDismiss = (
    eventId: string,
    source: 'google' | 'local',
    calendarId?: string,
    opts?: DismissOpts,
  ) => {
    dismissEvent(eventId, source, calendarId, opts).catch((err) =>
      console.error('Failed to dismiss event:', err),
    );
  };

  // ✕ on a recurring occurrence → ask the scope; anything else dismisses now.
  const onDismissClick = (event: CalendarEvent) => {
    if (event.recurringEventId) {
      setDismissPrompt(event);
    } else {
      handleDismiss(event.id, dismissSourceFor(event), event.calendarId);
    }
  };

  // Own form-created event → local hide only. The Ban button is one misclick
  // from firing Google cancellation emails; real removal is the Delete button.
  const dismissSourceFor = (event: CalendarEvent): 'google' | 'local' =>
    isEditableBy(event, user?.id) || event.type !== 'google' ? 'local' : 'google';

  const viewDays = daysForView(view, currentDate);

  const step = (dir: -1 | 1) => {
    setCurrentDate((cur) => {
      switch (view) {
        case 'day':
          return addDays(cur, dir);
        case 'month': {
          const d = new Date(cur);
          d.setMonth(d.getMonth() + dir);
          return d;
        }
        case 'schedule':
          return addDays(cur, dir * 14);
        case 'week':
        default:
          return addDays(cur, dir * 7);
      }
    });
  };

  const rangeLabel = (): string => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      });
    }
    if (view === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (view === 'schedule') {
      const end = addDays(currentDate, 44);
      return `From ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        + ` – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    const ws = getWeekStart(currentDate);
    const we = addDays(ws, 6);
    return `Week of ${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      + ` - ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const organizeEventsByDays = (days: Date[]): Map<string, CalendarEvent[]> => {
    const eventMap = new Map<string, CalendarEvent[]>();
    days.forEach((day) => eventMap.set(getDateKeyWithTimezone(day), []));

    const todayKey = getDateKeyWithTimezone(new Date());

    if (events) {
      events.forEach((event: any) => {
        if (dismissedEventIds.has(event.id)) return;
        // FR-126: a whole recurring series was dismissed → hide every occurrence.
        if (event.recurringEventId && dismissedSeriesIds.has(event.recurringEventId)) return;

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
    eventMap.forEach((evs) => {
      evs.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority ? 1 : -1;
        return 0;
      });
    });

    return eventMap;
  };

  const eventsByDay = organizeEventsByDays(viewDays);

  /* ---------------------------------------------------------------- */
  /* Shared renderers                                                 */
  /* ---------------------------------------------------------------- */

  // The full event chip (Week + Day views). Markup kept stable — tests match
  // on `div.group`, the colour classes and the "Dismiss event" title.
  const renderChip = (event: CalendarEvent) => (
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
          <div className="flex items-center gap-1">
            <p className="font-medium truncate">{event.title}</p>
            <PersonDots people={eventPeople.get(event.id)} members={members} />
          </div>
          {event.time && <p className="text-xs opacity-75">{event.time}</p>}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismissClick(event);
          }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition hover:text-alert"
          title="Dismiss event"
        >
          <Ban className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  // A one-line chip for the dense Month grid: title + dots, opens the modal.
  const renderMiniChip = (event: CalendarEvent) => (
    <button
      key={event.id}
      onClick={() => setSelectedEvent(event)}
      className={`w-full text-left text-xs px-1.5 py-0.5 rounded border-l-2 truncate flex items-center gap-1 ${getEventColor(
        event.type,
      )} ${event.isPast ? 'opacity-60' : ''}`}
    >
      {event.time && <span className="tabular-nums opacity-75 shrink-0">{event.time.replace(/:00 /, ' ')}</span>}
      <span className="truncate">{event.title}</span>
      <PersonDots people={eventPeople.get(event.id)} members={members} />
    </button>
  );

  const addButtonForDay = (dateKey: string) =>
    canManage && (
      <button
        onClick={() => setFormState({ mode: 'create', date: dateKey })}
        className="opacity-0 group-hover/day:opacity-100 transition text-ink-3 hover:text-accent"
        title={`Add event on ${dateKey}`}
        aria-label={`Add event on ${dateKey}`}
      >
        <Plus className="w-4 h-4" />
      </button>
    );

  const todayStr = new Date().toDateString();

  const renderWeek = () => (
    <div className="grid grid-cols-7 gap-3">
      {viewDays.map((day, idx) => {
        const dateKey = getDateKeyWithTimezone(day);
        const dayEvents = eventsByDay.get(dateKey) || [];
        const isToday = todayStr === day.toDateString();

        return (
          <div
            key={idx}
            data-testid={`day-cell-${dateKey}`}
            className={`group/day rounded-lg border-2 p-3 min-h-32 flex flex-col ${
              isToday ? 'border-accent bg-accent-soft' : 'border-rule bg-paper'
            }`}
          >
            <div className="mb-3 pb-2 border-b border-rule flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-ink-3 uppercase">{DAYS[idx]}</div>
                <div className={`text-lg font-bold ${isToday ? 'text-accent' : 'text-ink'}`}>
                  {day.getDate()}
                </div>
              </div>
              {addButtonForDay(dateKey)}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {dayEvents.length === 0 ? (
                <p className="text-xs text-ink-3 italic">No events</p>
              ) : (
                dayEvents.map((event) => renderChip(event))
              )}
            </div>
            <MealsLine meal={mealForDate(day)} />
          </div>
        );
      })}
    </div>
  );

  const renderDay = () => {
    const day = viewDays[0];
    const dateKey = getDateKeyWithTimezone(day);
    const dayEvents = eventsByDay.get(dateKey) || [];
    const isToday = todayStr === day.toDateString();

    return (
      <div
        data-testid={`day-cell-${dateKey}`}
        className={`group/day rounded-lg border-2 p-4 ${
          isToday ? 'border-accent bg-accent-soft' : 'border-rule bg-paper'
        }`}
      >
        <div className="mb-4 pb-2 border-b border-rule flex items-center justify-between">
          <div className={`text-xl font-bold font-display ${isToday ? 'text-accent' : 'text-ink'}`}>
            {day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          {addButtonForDay(dateKey)}
        </div>
        <div className="space-y-2">
          {dayEvents.length === 0 ? (
            <p className="text-sm text-ink-3 italic">No events</p>
          ) : (
            dayEvents.map((event) => renderChip(event))
          )}
        </div>
        {(() => {
          const meal = mealForDate(day);
          // Editable only within the planner's rolling window (mealForDate
          // returns a row for those days). Outside it, keep the read-only line.
          return meal ? (
            <div className="mt-4 pt-3 border-t border-rule/60">
              <p className="text-xs font-semibold text-ink-3 mb-2">Meals</p>
              <MealDayEditor
                meal={meal}
                dateLabel={day.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}
                onSetSlot={updateMeal}
                onSaveToLibrary={(name, slot) => mealLib.addToLibrary(name, slot)}
              />
              <MealLibraryStrip
                library={mealLib.library}
                onAdd={mealLib.addToLibrary}
                onRename={mealLib.renameLibraryItem}
                onRemove={mealLib.removeFromLibrary}
                className="mt-3"
              />
            </div>
          ) : (
            <MealsLine meal={undefined} />
          );
        })()}
      </div>
    );
  };

  const renderMonth = () => {
    const monthIdx = currentDate.getMonth();
    return (
      <div>
        <div className="grid grid-cols-7 gap-2 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-xs font-semibold text-ink-3 uppercase text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {viewDays.map((day, idx) => {
            const dateKey = getDateKeyWithTimezone(day);
            const dayEvents = eventsByDay.get(dateKey) || [];
            const isToday = todayStr === day.toDateString();
            const inMonth = day.getMonth() === monthIdx;

            return (
              <div
                key={idx}
                data-testid={`day-cell-${dateKey}`}
                className={`group/day rounded-lg border p-1.5 min-h-24 flex flex-col ${
                  isToday
                    ? 'border-accent bg-accent-soft'
                    : inMonth
                      ? 'border-rule bg-paper'
                      : 'border-rule/50 bg-paper/40 text-ink-3'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-semibold ${
                      isToday ? 'text-accent' : inMonth ? 'text-ink' : 'text-ink-3'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {addButtonForDay(dateKey)}
                </div>
                <div className="flex-1 space-y-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((event) => renderMiniChip(event))}
                  {dayEvents.length > 3 && (
                    <button
                      onClick={() => {
                        setCurrentDate(new Date(day));
                        setView('day');
                      }}
                      className="text-xs text-accent hover:text-accent-strong font-medium px-1.5"
                    >
                      +{dayEvents.length - 3} more
                    </button>
                  )}
                </div>
                {inMonth && <MealsLine meal={mealForDate(day)} variant="compact" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSchedule = () => {
    const withEvents = viewDays
      .map((day) => ({ day, dateKey: getDateKeyWithTimezone(day) }))
      .map(({ day, dateKey }) => ({ day, dateKey, evs: eventsByDay.get(dateKey) || [] }))
      .filter(({ evs }) => evs.length > 0);

    if (withEvents.length === 0) {
      return <p className="text-sm text-ink-3 italic py-8 text-center">Nothing scheduled in this window.</p>;
    }

    return (
      <div className="divide-y divide-rule">
        {withEvents.map(({ day, dateKey, evs }) => {
          const isToday = todayStr === day.toDateString();
          return (
            <div key={dateKey} className="py-3 flex gap-4">
              <div className="w-16 shrink-0 text-right">
                <div className={`text-xs uppercase font-semibold ${isToday ? 'text-accent' : 'text-ink-3'}`}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold font-display ${isToday ? 'text-accent' : 'text-ink'}`}>
                  {day.getDate()}
                </div>
                <div className="text-xs text-ink-3">
                  {day.toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                {evs.map((event) => renderChip(event))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
        <div className="mb-6 p-4 bg-warn/10 border border-warn/40 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-warn">
                🔁 Reconnect to decline invites in Google
              </p>
              <p className="text-xs text-warn mt-1">
                The event was hidden here, but declining it in your Google Calendar needs updated access.
              </p>
            </div>
            <button
              onClick={() => connectGoogle()}
              className="ml-4 px-3 py-2 bg-warn hover:opacity-90 text-white text-sm font-medium rounded transition"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Navigation + view toggle */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <button
          onClick={() => step(-1)}
          className="p-2 hover:bg-accent-soft rounded-lg transition"
          aria-label="Previous"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="w-5 h-5 text-accent shrink-0" />
          <h2 className="text-2xl font-bold text-ink font-display truncate">
            {rangeLabel()}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-rule overflow-hidden" role="group" aria-label="Calendar view">
            {CALENDAR_VIEWS.map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                aria-pressed={view === v.key}
                className={`px-2.5 py-1.5 text-sm font-medium transition ${
                  view === v.key ? 'bg-accent text-white' : 'bg-paper text-ink-2 hover:bg-accent-soft'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
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
            onClick={() => setSettingsOpen(true)}
            className="p-2 hover:bg-accent-soft rounded-lg transition text-ink-2 hover:text-accent"
            aria-label="Calendar settings"
            title="Calendar settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => step(1)}
            className="p-2 hover:bg-accent-soft rounded-lg transition"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {view === 'week' && renderWeek()}
      {view === 'day' && renderDay()}
      {view === 'month' && renderMonth()}
      {view === 'schedule' && renderSchedule()}

      {/* Dismiss scope prompt for a recurring event (FR-126) */}
      {dismissPrompt && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Hide recurring event"
          onClick={() => setDismissPrompt(null)}
        >
          <div
            className="bg-raised border border-rule rounded-card p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-ink mb-1">Hide this event?</h3>
            <p className="text-sm text-ink-2 mb-4">
              <span className="font-medium text-ink">{dismissPrompt.title}</span> repeats.
              Hide just this one, or every occurrence?
            </p>
            <div className="space-y-2">
              <button
                className="btn btn-secondary w-full"
                onClick={() => {
                  handleDismiss(
                    dismissPrompt.id,
                    dismissSourceFor(dismissPrompt),
                    dismissPrompt.calendarId,
                    { scope: 'occurrence' },
                  );
                  setDismissPrompt(null);
                }}
              >
                This event
              </button>
              <button
                className="btn btn-primary w-full"
                onClick={() => {
                  handleDismiss(dismissPrompt.id, 'local', dismissPrompt.calendarId, {
                    scope: 'series',
                    recurringEventId: dismissPrompt.recurringEventId,
                  });
                  setDismissPrompt(null);
                }}
              >
                All events in the series
              </button>
              <button
                className="w-full text-sm text-ink-3 hover:text-accent py-1"
                onClick={() => setDismissPrompt(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

            {members.length > 0 && (canManage || (eventPeople.get(selectedEvent.id)?.length ?? 0) > 0) && (
              <div className="mb-4">
                <p className="text-xs text-ink-3 uppercase tracking-wide mb-2">Who's going?</p>
                {canManage ? (
                  <PersonPicker
                    members={members}
                    value={eventPeople.get(selectedEvent.id) ?? []}
                    onChange={(next) => {
                      setEventPeople(selectedEvent.id, next).catch((err) =>
                        console.error('Failed to update event people:', err),
                      );
                    }}
                  />
                ) : (
                  <PersonDots
                    people={eventPeople.get(selectedEvent.id)}
                    members={members}
                    size="md"
                  />
                )}
              </div>
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
          initial={
            formState.mode === 'edit'
              ? toFormInitial(formState.event, eventPeople.get(formState.event.id))
              : undefined
          }
          initialDate={formState.mode === 'create' ? formState.date : undefined}
          members={members}
          onSubmit={handleFormSubmit}
          onClose={() => setFormState({ mode: 'closed' })}
        />
      )}

      {settingsOpen && (
        <CalendarSettings
          googleConnected={googleConnected}
          googleEmail={googleEmail}
          onConnect={connectGoogle}
          onDisconnect={disconnectGoogle}
          dismissedEvents={dismissedEvents}
          eventTitleFor={(id) => {
            const e = events.find((ev: { id: string }) => ev.id === id) as
              | { summary?: string; event_title?: string; title?: string }
              | undefined;
            return e?.summary || e?.event_title || e?.title;
          }}
          onRestore={restoreEvent}
          canManage={canManage}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
