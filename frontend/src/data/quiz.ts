/**
 * Auto-generated multiple-choice quiz for the Gujarati module (T-11).
 *
 * The curriculum has no authored questions, so each question is built from the
 * lesson set: show one side (Gujarati glyph/word or its English gloss) and pick
 * the matching other side from four options. Distractors are drawn from the same
 * subcategory where possible so the choice is a real test, not a giveaway.
 */
import type { Lesson } from '@hooks/useLearning';

export type QuizDirection = 'g2e' | 'e2g';

export interface QuizQuestion {
  lessonId: string;
  /** What's shown to the learner. */
  prompt: string;
  /** true when `prompt` is the Gujarati side (render it large). */
  promptIsGujarati: boolean;
  options: string[];
  correctIndex: number;
}

export interface QuizOptions {
  count?: number;
  direction?: QuizDirection | 'mixed';
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sideOf = (l: Lesson, dir: QuizDirection) =>
  dir === 'g2e' ? l.content.english : l.content.text;

/** The label the learner picks (opposite side from the prompt). */
const answerOf = (l: Lesson, dir: QuizDirection) =>
  dir === 'g2e' ? l.content.text : l.content.english;

function pickDistractors(pool: Lesson[], answer: Lesson, dir: QuizDirection): string[] {
  const sameSub = pool.filter(
    (l) => l.id !== answer.id && l.subcategory === answer.subcategory,
  );
  const sameCat = pool.filter(
    (l) => l.id !== answer.id && l.category === answer.category,
  );
  const anyOther = pool.filter((l) => l.id !== answer.id);
  const correctLabel = answerOf(answer, dir);

  const out: string[] = [];
  for (const source of [sameSub, sameCat, anyOther]) {
    for (const l of shuffle(source)) {
      const label = answerOf(l, dir);
      if (label !== correctLabel && !out.includes(label)) out.push(label);
      if (out.length === 3) return out;
    }
  }
  return out; // fewer than 3 only if the whole pool is tiny
}

/**
 * Build up to `count` questions from `lessons`. Order is randomised; each
 * question's direction is random unless one is forced via `options.direction`.
 */
export function makeQuiz(lessons: Lesson[], options: QuizOptions = {}): QuizQuestion[] {
  const count = options.count ?? 10;
  const chosen = shuffle(lessons).slice(0, count);

  return chosen.map((lesson) => {
    const dir: QuizDirection =
      options.direction && options.direction !== 'mixed'
        ? options.direction
        : Math.random() < 0.5
          ? 'g2e'
          : 'e2g';

    const correct = answerOf(lesson, dir);
    const distractors = pickDistractors(lessons, lesson, dir);
    const options4 = shuffle([correct, ...distractors]);

    return {
      lessonId: lesson.id,
      // g2e → prompt is the English gloss; e2g → prompt is the Gujarati glyph.
      prompt: sideOf(lesson, dir),
      promptIsGujarati: dir === 'e2g',
      options: options4,
      correctIndex: options4.indexOf(correct),
    };
  });
}
