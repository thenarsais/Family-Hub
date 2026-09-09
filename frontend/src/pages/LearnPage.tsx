import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Volume2 } from 'lucide-react';
import { useLearning, type Lesson } from '@hooks/useLearning';
import { useSpeak } from '@hooks/useSpeak';
import { makeQuiz, type QuizQuestion } from '@/data/quiz';

const PHASES = [
  { id: 'phase_1_alphabet', title: 'Alphabet', emoji: '🔤', statKey: 'alphabet' as const },
  { id: 'phase_2_numbers', title: 'Numbers', emoji: '🔢', statKey: 'numbers' as const },
  { id: 'phase_3_vocabulary', title: 'Vocabulary', emoji: '📚', statKey: 'vocabulary' as const },
];

const titleCase = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// A few subcategories have a natural teaching order that isn't alphabetical.
const SUB_ORDER: Record<string, number> = { vowels: 0, consonants: 1 };
const subRank = (s: string) => SUB_ORDER[s] ?? 100;

type View =
  | { name: 'home' }
  | { name: 'browse'; phase: string }
  | { name: 'learn'; phase: string; sub: string; index: number }
  | { name: 'quiz'; phase: string; sub: string };

function Spinner() {
  return (
    <div className="py-10 flex justify-center" role="status" aria-label="Loading">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
    </div>
  );
}

export default function LearnPage() {
  const { byPhase, stats, loading, error, completeLesson, recordQuizAnswer } = useLearning();
  const [view, setView] = useState<View>({ name: 'home' });

  if (loading) {
    return (
      <main className="container py-8">
        <Spinner />
      </main>
    );
  }

  return (
    <main className="container py-6 space-y-6 max-w-2xl">
      <header className="flex items-center gap-3">
        {view.name !== 'home' && (
          <button
            type="button"
            className="btn btn-secondary btn-small gap-1"
            onClick={() =>
              setView(
                view.name === 'browse'
                  ? { name: 'home' }
                  : { name: 'browse', phase: view.phase },
              )
            }
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>
        )}
        <h1 className="font-display text-3xl font-bold text-ink flex-1">
          <span aria-hidden="true">🪷</span> Gujarati
        </h1>
      </header>

      {error && <p className="text-sm text-alert bg-alert/10 rounded p-3">{error}</p>}

      {view.name === 'home' && (
        <HomeView stats={stats} onOpen={(phase) => setView({ name: 'browse', phase })} />
      )}

      {view.name === 'browse' && (
        <BrowseView
          phase={view.phase}
          groups={byPhase[view.phase] ?? {}}
          onLearn={(sub, index) => setView({ name: 'learn', phase: view.phase, sub, index })}
          onQuiz={(sub) => setView({ name: 'quiz', phase: view.phase, sub })}
        />
      )}

      {view.name === 'learn' && (
        <LearnView
          lessons={byPhase[view.phase]?.[view.sub] ?? []}
          startIndex={view.index}
          onComplete={completeLesson}
          onDone={() => setView({ name: 'browse', phase: view.phase })}
        />
      )}

      {view.name === 'quiz' && (
        <QuizView
          lessons={byPhase[view.phase]?.[view.sub] ?? []}
          onAnswer={recordQuizAnswer}
          onDone={() => setView({ name: 'browse', phase: view.phase })}
        />
      )}
    </main>
  );
}

/* ---------------- home ---------------- */

function HomeView({
  stats,
  onOpen,
}: {
  stats: ReturnType<typeof useLearning>['stats'];
  onOpen: (phase: string) => void;
}) {
  const overall = PHASES.reduce(
    (acc, p) => {
      acc.done += stats[p.statKey].completed;
      acc.total += stats[p.statKey].total;
      return acc;
    },
    { done: 0, total: 0 },
  );

  return (
    <div className="space-y-4">
      <p className="text-ink-2">
        {overall.done} of {overall.total} lessons learned · {stats.totalPointsEarned} points
      </p>
      <ul className="grid gap-3 sm:grid-cols-3">
        {PHASES.map((p) => {
          const s = stats[p.statKey];
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onOpen(p.id)}
                className="w-full card text-left hover:border-accent transition"
              >
                <span className="text-4xl" aria-hidden="true">
                  {p.emoji}
                </span>
                <h2 className="font-display text-lg font-bold text-ink mt-2">{p.title}</h2>
                <p className="text-sm text-ink-3">
                  {s.completed} / {s.total}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- browse ---------------- */

function BrowseView({
  phase,
  groups,
  onLearn,
  onQuiz,
}: {
  phase: string;
  groups: Record<string, Lesson[]>;
  onLearn: (sub: string, index: number) => void;
  onQuiz: (sub: string) => void;
}) {
  const meta = PHASES.find((p) => p.id === phase);
  const subs = Object.keys(groups).sort((a, b) => subRank(a) - subRank(b) || a.localeCompare(b));

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-ink">
        <span aria-hidden="true">{meta?.emoji}</span> {meta?.title}
      </h2>
      {subs.length === 0 && <p className="text-ink-3">No lessons here yet.</p>}
      {subs.map((sub) => (
        <section key={sub} className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink">{titleCase(sub)}</h3>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => onQuiz(sub)}
              disabled={groups[sub].length < 2}
            >
              Quiz this section
            </button>
          </div>
          <ul className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {groups[sub].map((l, i) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => onLearn(sub, i)}
                  aria-label={`${l.content.english}${l.completed ? ', learned' : ''}`}
                  className={`relative w-full aspect-square rounded-xl border-2 grid place-items-center text-2xl transition ${
                    l.completed
                      ? 'border-ok bg-ok/10 text-ink'
                      : 'border-rule bg-raised text-ink hover:border-accent'
                  }`}
                >
                  <span aria-hidden="true">{l.content.text}</span>
                  {l.completed && (
                    <span className="absolute -top-1.5 -right-1.5 grid h-4 w-4 place-items-center rounded-full bg-ok text-paper">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ---------------- learn ---------------- */

function LearnView({
  lessons,
  startIndex,
  onComplete,
  onDone,
}: {
  lessons: Lesson[];
  startIndex: number;
  onComplete: (id: string) => Promise<void>;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(0, lessons.length - 1)));
  const [busy, setBusy] = useState(false);
  const { supported, speak } = useSpeak();
  const lesson = lessons[index];

  if (!lesson) {
    return <p className="text-ink-3">Nothing to show.</p>;
  }

  const next = async () => {
    setBusy(true);
    try {
      if (!lesson.completed) await onComplete(lesson.id);
    } catch {
      /* the hook rolls back + surfaces the error on the page */
    } finally {
      setBusy(false);
    }
    if (index + 1 < lessons.length) setIndex(index + 1);
    else onDone();
  };

  return (
    <div className="card text-center space-y-4">
      <p className="text-sm text-ink-3">
        {index + 1} / {lessons.length}
      </p>
      <p className="font-display text-7xl text-ink leading-none">{lesson.content.text}</p>
      <p className="text-xl text-ink">{lesson.content.romanization}</p>
      <p className="text-ink-2">{lesson.content.pronunciation}</p>
      <p className="text-ink-3">{lesson.content.english}</p>

      {supported && (
        <button
          type="button"
          className="btn btn-secondary btn-small gap-1 mx-auto"
          onClick={() => speak(lesson.content.text, lesson.content.romanization)}
        >
          <Volume2 className="h-4 w-4" aria-hidden="true" /> Hear it
        </button>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={index === 0}
        >
          Previous
        </button>
        <button type="button" className="btn btn-primary btn-small" onClick={next} disabled={busy}>
          {index + 1 < lessons.length ? 'Got it →' : 'Finish'}
        </button>
      </div>
    </div>
  );
}

/* ---------------- quiz ---------------- */

function QuizView({
  lessons,
  onAnswer,
  onDone,
}: {
  lessons: Lesson[];
  onAnswer: (p: {
    lessonId: string;
    questionNumber: number;
    selectedAnswer: number;
    correctAnswer: number;
  }) => Promise<boolean>;
  onDone: () => void;
}) {
  const questions = useMemo<QuizQuestion[]>(
    () => makeQuiz(lessons, { count: Math.min(10, lessons.length) }),
    [lessons],
  );
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);

  if (questions.length === 0) {
    return <p className="text-ink-3">Not enough lessons to make a quiz yet.</p>;
  }

  if (qi >= questions.length) {
    return (
      <div className="card text-center space-y-3">
        <p className="font-display text-2xl font-bold text-ink">
          {score} / {questions.length}
        </p>
        <p className="text-ink-2">+{points} points</p>
        <button type="button" className="btn btn-primary btn-small mx-auto" onClick={onDone}>
          Done
        </button>
      </div>
    );
  }

  const q = questions[qi];
  const answered = picked !== null;

  const choose = async (i: number) => {
    if (answered) return;
    setPicked(i);
    const correct = await onAnswer({
      lessonId: q.lessonId,
      questionNumber: qi + 1,
      selectedAnswer: i,
      correctAnswer: q.correctIndex,
    }).catch(() => i === q.correctIndex);
    if (correct) {
      setScore((s) => s + 1);
      setPoints((p) => p + 5);
    }
  };

  const advance = () => {
    setPicked(null);
    setQi((n) => n + 1);
  };

  return (
    <div className="card space-y-4">
      <p className="text-sm text-ink-3">
        Question {qi + 1} / {questions.length}
      </p>
      <p
        className={`text-center text-ink ${
          q.promptIsGujarati ? 'font-display text-6xl leading-none' : 'text-xl'
        }`}
      >
        {q.prompt}
      </p>
      <ul className="grid gap-2">
        {q.options.map((opt, i) => {
          const state = !answered
            ? 'border-rule bg-raised hover:border-accent'
            : i === q.correctIndex
              ? 'border-ok bg-ok/15'
              : i === picked
                ? 'border-alert bg-alert/10'
                : 'border-rule bg-raised opacity-60';
          return (
            <li key={`${opt}-${i}`}>
              <button
                type="button"
                onClick={() => choose(i)}
                disabled={answered}
                className={`w-full rounded-xl border-2 px-4 py-3 text-left transition ${state}`}
              >
                {opt}
              </button>
            </li>
          );
        })}
      </ul>
      {answered && (
        <button type="button" className="btn btn-primary btn-small ml-auto" onClick={advance}>
          {qi + 1 < questions.length ? 'Next' : 'See score'}
        </button>
      )}
    </div>
  );
}
