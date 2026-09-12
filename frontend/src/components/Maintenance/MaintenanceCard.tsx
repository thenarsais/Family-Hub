import { useState, type FormEvent } from 'react';
import { Check, Plus, Wrench, X } from 'lucide-react';
import { DashboardCard } from '../shell/DashboardCard';
import type { MaintenanceItem, NewMaintenanceItem } from '@hooks/useMaintenance';

interface CardShellProps {
  id: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  onReorder: (dragId: string, dropId: string) => void;
  onMove: (id: string, delta: number) => void;
}

interface Props extends CardShellProps {
  items: MaintenanceItem[];
  loading: boolean;
  error: string | null;
  onAdd: (input: NewMaintenanceItem) => void | Promise<void>;
  onMarkDone: (id: string) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
}

type IntervalUnit = 'days' | 'weeks' | 'months' | 'years';
const UNIT_DAYS: Record<IntervalUnit, number> = { days: 1, weeks: 7, months: 30, years: 365 };

function dueLabel(daysUntilDue: number): { text: string; tone: 'overdue' | 'soon' | 'ok' } {
  if (daysUntilDue < 0) {
    const n = Math.abs(daysUntilDue);
    return { text: `Overdue by ${n} day${n === 1 ? '' : 's'}`, tone: 'overdue' };
  }
  if (daysUntilDue === 0) return { text: 'Due today', tone: 'soon' };
  if (daysUntilDue <= 14) return { text: `Due in ${daysUntilDue} days`, tone: 'soon' };
  return { text: `Due in ${daysUntilDue} days`, tone: 'ok' };
}

const TONE_CLASSES: Record<'overdue' | 'soon' | 'ok', string> = {
  overdue: 'text-alert font-semibold',
  soon: 'text-warn font-medium',
  ok: 'text-ink-3',
};

/**
 * T-15 — the "Home Maintenance" dashboard card: an add form, the item list
 * (soonest-due first, from the hook), and mark-done/remove per row. No
 * points, no role gate — family-wide like the shopping list.
 */
export function MaintenanceCard({ items, loading, error, onAdd, onMarkDone, onRemove, ...shell }: Props) {
  const [name, setName] = useState('');
  const [value, setValue] = useState(3);
  const [unit, setUnit] = useState<IntervalUnit>('months');

  const dueThisMonth = items.filter((i) => i.daysUntilDue <= 30).length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || value <= 0) return;
    void onAdd({ name: trimmed, intervalDays: Math.round(value * UNIT_DAYS[unit]) });
    setName('');
  };

  return (
    <DashboardCard
      {...shell}
      title="Home Maintenance"
      icon={<Wrench className="w-5 h-5 text-leaf" aria-hidden="true" />}
      count={!loading && items.length > 0 ? `${dueThisMonth} due this month` : undefined}
    >
      {loading ? (
        <div className="py-6 flex justify-center" role="status" aria-label="Loading">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
        </div>
      ) : error ? (
        <p className="text-sm text-alert">{error}</p>
      ) : (
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-ink-3">Nothing tracked yet — add your first item below.</p>
          ) : (
            <ul className="divide-y divide-rule">
              {items.map((item) => {
                const due = dueLabel(item.daysUntilDue);
                return (
                  <li key={item.id} className="flex items-center gap-2 py-2 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink truncate">{item.name}</p>
                      <p className={`text-xs ${TONE_CLASSES[due.tone]}`}>{due.text}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void onMarkDone(item.id)}
                      aria-label={`Mark "${item.name}" done`}
                      title="Mark done"
                      className="shrink-0 p-1.5 rounded-full text-leaf hover:bg-leaf/10 transition-colors"
                    >
                      <Check className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onRemove(item.id)}
                      aria-label={`Remove "${item.name}"`}
                      className="shrink-0 text-ink-3 hover:text-alert opacity-0 group-hover:opacity-100
                                 focus:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={submit} className="flex flex-wrap gap-2 items-end pt-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Add an item…"
              aria-label="New maintenance item name"
              className="input py-1 text-sm flex-1 min-w-[8rem]"
            />
            <span className="text-xs text-ink-3">every</span>
            <input
              type="number"
              min={1}
              value={value}
              onChange={(e) => setValue(Math.max(1, Number(e.target.value) || 1))}
              aria-label="Interval value"
              className="input py-1 text-sm w-14"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as IntervalUnit)}
              aria-label="Interval unit"
              className="input py-1 text-sm w-auto"
            >
              <option value="days">days</option>
              <option value="weeks">weeks</option>
              <option value="months">months</option>
              <option value="years">years</option>
            </select>
            <button type="submit" className="btn btn-secondary btn-small shrink-0" aria-label="Add item">
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </DashboardCard>
  );
}

export default MaintenanceCard;
