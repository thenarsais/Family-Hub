// Core auth hooks
export { useAuth } from './useAuth';

// Phase 2 dashboard hooks
export { useAnnouncements } from './useAnnouncements';
export { useReminders } from './useReminders';
export { useEnergy } from './useEnergy';
export { useCalendar } from './useCalendar';
export { useFamily } from './useFamily';
export { useActivityLog } from './useActivityLog';

// Export all types
export type { Announcement } from './useAnnouncements';
export type { Reminder } from './useReminders';
export type { CalendarEvent } from './useCalendar';
export type { FamilyMember, Family, FamilySettings } from './useFamily';
export type { ActivityLogEntry } from './useActivityLog';
