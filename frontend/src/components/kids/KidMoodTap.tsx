import { useState } from 'react';
import { MOODS, type MoodEntry, type MoodValue } from '@hooks/useHabits';

interface Props {
  todayMood: MoodEntry | null;
  onPick: (mood: MoodValue) => Promise<void>;
}

/** The daily mood tap — five big faces, one for today. No scoring. */
export default function KidMoodTap({ todayMood, onPick }: Props) {
  const [busy, setBusy] = useState(false);

  const pick = async (mood: MoodValue) => {
    if (busy) return;
    setBusy(true);
    try {
      await onPick(mood);
    } catch (err) {
      console.error('Mood tap failed:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h2 className="font-display text-2xl font-bold text-ink mb-3">
        <span aria-hidden="true">💛</span> How do you feel?
      </h2>
      <div className="flex flex-wrap gap-3">
        {MOODS.map((m) => {
          const selected = todayMood?.mood === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => pick(m.value)}
              disabled={busy}
              aria-pressed={selected}
              aria-label={m.label}
              className={`rounded-2xl border-4 px-5 py-3 flex flex-col items-center gap-1 transition disabled:opacity-70 ${
                selected
                  ? 'border-accent bg-accent/15 animate-pop'
                  : 'border-rule bg-raised hover:border-accent active:scale-95'
              }`}
            >
              <span className="text-5xl leading-none" aria-hidden="true">
                {m.emoji}
              </span>
              <span className="text-xs font-semibold text-ink-2">{m.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
