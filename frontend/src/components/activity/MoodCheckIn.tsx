import { useState } from 'react';
import { MOODS, type MoodEntry, type MoodValue } from '@hooks/useHabits';

interface Props {
  todayMood: MoodEntry | null;
  onPick: (mood: MoodValue) => Promise<void>;
}

export default function MoodCheckIn({ todayMood, onPick }: Props) {
  const [busy, setBusy] = useState(false);

  const pick = async (mood: MoodValue) => {
    if (busy) return;
    setBusy(true);
    try {
      await onPick(mood);
    } catch (err) {
      console.error('Failed to set mood:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-ink-2 mb-2">
        {todayMood ? 'How are you feeling? (tap to change)' : 'How are you feeling today?'}
      </p>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => {
          const selected = todayMood?.mood === m.value;
          return (
            <button
              key={m.value}
              onClick={() => pick(m.value)}
              disabled={busy}
              aria-pressed={selected}
              aria-label={m.label}
              className={`flex flex-col items-center gap-1 rounded-xl border px-4 py-2 transition disabled:opacity-60 ${
                selected
                  ? 'border-accent bg-accent/10'
                  : 'border-rule bg-raised hover:border-accent'
              }`}
            >
              <span className="text-2xl leading-none">{m.emoji}</span>
              <span className="text-[0.7rem] text-ink-2">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
