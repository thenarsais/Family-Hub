import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useCalendar } from '@hooks/useCalendar';

interface CalendarEvent {
  id: string;
  title: string;
  time?: string;
  startTime?: number; // minutes from midnight
  endTime?: number;
  allDay: boolean;
  type: 'google' | 'family' | 'reminder';
  priority: boolean;
  location?: string;
  description?: string;
}

interface DayEvents {
  allDay: CalendarEvent[];
  timed: CalendarEvent[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8am to 9pm

function getEventColor(type: string): string {
  switch (type) {
    case 'google':
      return 'bg-blue-500 text-white';
    case 'family':
      return 'bg-green-500 text-white';
    case 'reminder':
      return 'bg-yellow-500 text-gray-900';
    default:
      return 'bg-gray-500 text-white';
  }
}

function getDeadlineColor(): string {
  return 'bg-red-500 text-white';
}

export function WeekCalendar() {
  const { upcomingEvents, loading } = useCalendar();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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

  const organizeEventsByDay = (): Map<string, DayEvents> => {
    const eventMap = new Map<string, DayEvents>();

    weekDays.forEach((day) => {
      const dateKey = day.toISOString().split('T')[0];
      eventMap.set(dateKey, { allDay: [], timed: [] });
    });

    if (upcomingEvents) {
      upcomingEvents.forEach((event: any) => {
        const eventDate = new Date(event.startTime || event.date);
        const dateKey = eventDate.toISOString().split('T')[0];

        if (eventMap.has(dateKey)) {
          const calEvent: CalendarEvent = {
            id: event.id,
            title: event.title,
            time: event.startTime
              ? new Date(event.startTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : undefined,
            allDay: !event.startTime,
            type: 'google', // TODO: determine type from event source
            priority: false,
            location: event.location,
            description: event.description,
          };

          if (calEvent.allDay) {
            eventMap.get(dateKey)!.allDay.push(calEvent);
          } else {
            eventMap.get(dateKey)!.timed.push(calEvent);
          }
        }
      });
    }

    // Sort events: deadlines first, then starred, then others
    eventMap.forEach((dayEvents) => {
      dayEvents.allDay.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority ? 1 : -1;
        return 0;
      });
      dayEvents.timed.sort((a, b) => {
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {formatWeekRange()}
        </h2>
        <button
          onClick={goToNextWeek}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 min-w-full">
          {/* Day Headers */}
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className="text-center pb-2 border-b-2 border-gray-200 dark:border-gray-700"
            >
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {DAYS[idx]}
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {day.getDate()}
              </div>
            </div>
          ))}

          {/* All-Day Events Row */}
          {weekDays.map((day, idx) => {
            const dateKey = day.toISOString().split('T')[0];
            const dayEvents = eventsByDay.get(dateKey)!;

            return (
              <div key={`allday-${idx}`} className="min-h-20 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {dayEvents.allDay.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`${getEventColor(
                      event.type
                    )} text-xs p-1 rounded mb-1 cursor-pointer truncate flex items-center gap-1`}
                  >
                    {event.priority && <Star className="w-3 h-3 fill-current" />}
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Time Slots */}
          {HOURS.map((hour) => (
            <div key={`hour-${hour}`} className="col-span-7 flex">
              {/* Hour label */}
              <div className="w-16 flex-shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-400 py-2">
                {hour > 12 ? hour - 12 : hour}
                {hour >= 12 ? 'pm' : 'am'}
              </div>

              {/* Hour slots for each day */}
              {weekDays.map((day, idx) => {
                const dateKey = day.toISOString().split('T')[0];
                const dayEvents = eventsByDay.get(dateKey)!;
                const hourEvents = dayEvents.timed.filter((event) => {
                  // TODO: implement time-based filtering
                  return true;
                });

                return (
                  <div
                    key={`slot-${idx}-${hour}`}
                    className="flex-1 border-l border-gray-200 dark:border-gray-700 p-1 min-h-16"
                  >
                    {hourEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`${getEventColor(
                          event.type
                        )} text-xs p-1 rounded mb-1 cursor-pointer truncate flex items-center gap-1`}
                      >
                        {event.priority && <Star className="w-3 h-3 fill-current" />}
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${getEventColor(selectedEvent.type).split(' ')[0]}`}></div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {selectedEvent.time && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {selectedEvent.time}
              </p>
            )}

            {selectedEvent.location && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                📍 {selectedEvent.location}
              </p>
            )}

            {selectedEvent.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {selectedEvent.description}
              </p>
            )}

            <div className="flex gap-2">
              <button className="flex-1 btn btn-primary text-sm">Details</button>
              <button className="flex-1 btn btn-secondary text-sm">Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
