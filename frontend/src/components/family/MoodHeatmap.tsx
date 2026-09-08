import { useMemo } from 'react';
import { useFamilyMoodHistory, MOODS, type MoodValue } from '@hooks/useHabits';

const WEEKS = 5;
const DAYS = WEEKS * 7;

const MOOD_CLASS: Record<MoodValue, string> = {
  great: 'bg-ok',
  good: 'bg-leaf',
  ok: 'bg-haldi',
  low: 'bg-warn',
  sad: 'bg-alert',
};
const MOOD_LABEL = Object.fromEntries(MOODS.map((m) => [m.value, m.label])) as Record<
  MoodValue,
  string
>;

/** YYYY-MM-DD for `d` in local time (mood days come back tz-adjusted already). */
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export default function MoodHeatmap() {
  const { history, loading, forbidden } = useFamilyMoodHistory(DAYS);

  const days = useMemo(() => {
    const out: string[] = [];
    const today = new Date();
    for (let n = DAYS - 1; n >= 0; n--) {
      const d = new Date(today);
      d.setDate(today.getDate() - n);
      out.push(iso(d));
    }
    return out;
  }, []);

  const byMember = useMemo(() => {
    const m = new Map<string, { name: string; moods: Map<string, MoodValue> }>();
    for (const row of history) {
      if (!m.has(row.userId)) {
        m.set(row.userId, { name: row.assigneeName || 'Member', moods: new Map() });
      }
      m.get(row.userId)!.moods.set(row.day, row.mood);
    }
    return [...m.entries()];
  }, [history]);

  if (forbidden) return null;

  return (
    <section className="card">
      <h2 className="font-display text-xl font-bold text-ink mb-1">Mood over time</h2>
      <p className="text-ink-2 text-sm mb-4">
        The last {WEEKS} weeks of each member's daily check-in. Visible to parents only.
      </p>

      {loading ? (
        <div className="py-6 flex justify-center" role="status" aria-label="Loading">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
        </div>
      ) : byMember.length === 0 ? (
        <p className="text-sm text-ink-3">No mood check-ins yet.</p>
      ) : (
        <div className="space-y-3 overflow-x-auto">
          {byMember.map(([userId, { name, moods }]) => (
            <div key={userId} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-sm text-ink truncate">{name}</span>
              <div className="flex gap-1">
                {days.map((day) => {
                  const mood = moods.get(day);
                  return (
                    <span
                      key={day}
                      title={mood ? `${day}: ${MOOD_LABEL[mood]}` : `${day}: no check-in`}
                      className={`h-4 w-4 rounded-sm ${mood ? MOOD_CLASS[mood] : 'bg-rule/60'}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-ink-2">
            {MOODS.map((m) => (
              <span key={m.value} className="flex items-center gap-1">
                <span className={`h-3 w-3 rounded-sm ${MOOD_CLASS[m.value]}`} />
                {m.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
