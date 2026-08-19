import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Calendar, Ban } from 'lucide-react';
import { useCalendar } from '@hooks/useCalendar';
import { useAuth } from '@hooks/useAuth';

interface CalendarEvent {
  id: string;
  title: string;
  time?: string;
  startTime?: number;
  endTime?: number;
  allDay: boolean;
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
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getEventColor(type: string): string {
  switch (type) {
    case 'google':
      return 'bg-blue-100 border-blue-400 text-blue-900';
    case 'family':
      return 'bg-green-100 border-green-400 text-green-900';
    case 'reminder':
      return 'bg-yellow-100 border-yellow-400 text-yellow-900';
    default:
      return 'bg-gray-100 border-gray-400 text-gray-900';
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
  const { upcomingEvents, loading } = useCalendar();
  const { user, isLoading: authLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dismissedEventIds, setDismissedEventIds] = useState<Set<string>>(new Set());

  const dismissEvent = async (eventId: string, calendarId?: string) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    setDismissedEventIds(prev => new Set([...prev, eventId]));

    try {
      await fetch(`/api/calendar/events/${eventId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ calendarId }),
      });
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
          const ids = new Set(data.data?.map((d: any) => d.event_id) || []);
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

    console.log('Organizing events. Total upcomingEvents:', upcomingEvents?.length || 0);

    if (upcomingEvents) {
      upcomingEvents.forEach((event: any) => {
        if (dismissedEventIds.has(event.id)) {
          console.log('Event dismissed:', event.id);
          return;
        }

        const eventStartDate = event.start?.dateTime || event.start?.date || event.event_date || event.startTime;
        if (!eventStartDate) {
          console.log('Event has no date:', event.id, event);
          return;
        }

        const eventDate = new Date(eventStartDate);
        const dateKey = getDateKeyWithTimezone(eventDate, event.start?.timeZone);

        console.log('Processing event:', event.summary || event.title, 'for date:', dateKey);

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
            allDay: !event.start?.dateTime && !!event.start?.date,
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="card mb-8 bg-white dark:bg-gray-800 p-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousWeek}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatWeekRange()}
          </h2>
        </div>
        <button
          onClick={goToNextWeek}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
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
              className={`rounded-lg border-2 p-3 min-h-32 flex flex-col ${
                isToday
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900 dark:border-primary-400'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700'
              }`}
            >
              {/* Day Header */}
              <div className="mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  {DAYS[idx]}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-primary-600 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'}`}>
                  {day.getDate()}
                </div>
              </div>

              {/* Events */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">No events</p>
                ) : (
                  dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-2 rounded border-l-3 hover:shadow-md transition group ${getEventColor(event.type)}`}
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
                          onClick={() => {
                            console.log('Event clicked:', event);
                            setSelectedEvent(event);
                          }}
                        >
                          <p className="font-medium truncate">{event.title}</p>
                          {event.time && <p className="text-xs opacity-75">{event.time}</p>}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissEvent(event.id, event.calendarId);
                          }}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition hover:text-red-500"
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
          {console.log('Modal rendering for event:', selectedEvent.title)}
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 flex-1">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedEvent.calendarColor || '#3b82f6' }}
                ></span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    📅 {selectedEvent.calendarName || 'Google Calendar'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
              >
                ✕
              </button>
            </div>

            {selectedEvent.time && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                🕐 {selectedEvent.time}
              </p>
            )}

            {selectedEvent.location && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                📍 {selectedEvent.location}
              </p>
            )}

            {selectedEvent.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                {selectedEvent.description}
              </p>
            )}

            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button className="flex-1 btn btn-secondary text-sm" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
