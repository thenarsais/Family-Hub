import { useState } from 'react';
import { useTrivia } from '@hooks/useTrivia';

/** Activity Board Trivia section (T-09) — one shared daily question + a streak. */
export default function TriviaSection() {
  const { question, attempt, streak, stats, loading, error, submit } = useTrivia();
  const [busy, setBusy] = useState(false);

  if (loading) {
    return <p className="text-sm text-ink-3">Loading…</p>;
  }
  if (error) {
    return <p className="text-sm text-alert bg-alert/10 rounded p-2">{error}</p>;
  }
  if (!question) {
    return <p className="text-sm text-ink-3">No trivia today — check back tomorrow.</p>;
  }

  const pct = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;

  const pick = async (option: string) => {
    if (attempt || busy) return;
    setBusy(true);
    try {
      await submit(option);
    } catch (err) {
      console.error('Trivia submit failed:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-3">
        {streak > 0 ? `🔥 ${streak}-day streak` : 'No streak yet'}
        {stats.answered > 0 && ` · ${stats.answered} answered · ${pct}% right`}
      </p>

      <p className="font-medium text-ink">{question.question}</p>

      <ul className="grid gap-2">
        {question.options.map((option) => {
          let state = 'border-rule bg-raised hover:border-accent';
          if (attempt) {
            if (option === attempt.correctAnswer) state = 'border-ok bg-ok/15';
            else if (option === attempt.selectedAnswer) state = 'border-alert bg-alert/10';
            else state = 'border-rule bg-raised opacity-60';
          }
          return (
            <li key={option}>
              <button
                type="button"
                onClick={() => pick(option)}
                disabled={!!attempt || busy}
                className={`w-full rounded-xl border-2 px-4 py-3 text-left transition ${state}`}
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>

      {attempt && (
        <div className="space-y-2">
          <p className={`text-sm font-medium ${attempt.isCorrect ? 'text-ok' : 'text-alert'}`}>
            {attempt.isCorrect
              ? `Correct! +${attempt.pointsEarned} points`
              : `Not quite — it was ${attempt.correctAnswer}`}
          </p>
          {attempt.funFact && (
            <p className="text-sm text-ink-2 bg-raised rounded p-2">{attempt.funFact}</p>
          )}
          <p className="text-xs text-ink-3">Come back tomorrow for a new one.</p>
        </div>
      )}
    </div>
  );
}
