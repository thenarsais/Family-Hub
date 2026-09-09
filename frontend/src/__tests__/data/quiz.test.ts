import { makeQuiz } from '@/data/quiz';
import type { Lesson } from '@hooks/useLearning';

const lesson = (id: string, sub: string, text: string, english: string): Lesson => ({
  id,
  category: 'vocabulary',
  phase: 'phase_3_vocabulary',
  subcategory: sub,
  sequenceOrder: 0,
  content: { text, romanization: english, pronunciation: english, english },
  pointsValue: 10,
  completed: false,
  pointsEarned: 0,
});

const ANIMALS = [
  lesson('a1', 'animals', 'કૂતરો', 'dog'),
  lesson('a2', 'animals', 'બિલાડી', 'cat'),
  lesson('a3', 'animals', 'ગાય', 'cow'),
  lesson('a4', 'animals', 'ઘોડો', 'horse'),
  lesson('a5', 'animals', 'બકરી', 'goat'),
];

describe('makeQuiz', () => {
  it('makes `count` questions, each with 4 distinct options containing the answer', () => {
    const qs = makeQuiz(ANIMALS, { count: 4 });
    expect(qs).toHaveLength(4);
    for (const q of qs) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options[q.correctIndex]).toBeDefined();
      // the correct option is the opposite side of the prompt
      const src = ANIMALS.find((l) => l.id === q.lessonId)!;
      const expected = q.promptIsGujarati ? src.content.english : src.content.text;
      expect(q.options[q.correctIndex]).toBe(expected);
    }
  });

  it('honours a forced direction', () => {
    const g2e = makeQuiz(ANIMALS, { count: 5, direction: 'g2e' });
    expect(g2e.every((q) => q.promptIsGujarati === false)).toBe(true);
    const e2g = makeQuiz(ANIMALS, { count: 5, direction: 'e2g' });
    expect(e2g.every((q) => q.promptIsGujarati === true)).toBe(true);
  });

  it('prefers distractors from the same subcategory', () => {
    const mixed = [...ANIMALS, lesson('c1', 'colors', 'લાલ', 'red')];
    // g2e → the options are the Gujarati side; with 5 animals, all 3
    // distractors for an animal question should be other animal glyphs.
    const qs = makeQuiz(mixed, { count: 20, direction: 'g2e' });
    const animalGlyphs = new Set(ANIMALS.map((a) => a.content.text));
    const animalQs = qs.filter((q) => ANIMALS.some((a) => a.id === q.lessonId));
    for (const q of animalQs) {
      const distractors = q.options.filter((_, i) => i !== q.correctIndex);
      expect(distractors.every((d) => animalGlyphs.has(d))).toBe(true);
    }
  });

  it('degrades gracefully with a tiny pool', () => {
    const two = ANIMALS.slice(0, 2);
    const qs = makeQuiz(two, { count: 2 });
    expect(qs).toHaveLength(2);
    for (const q of qs) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options).toContain(q.options[q.correctIndex]);
    }
  });

  it('never exceeds the pool size', () => {
    expect(makeQuiz(ANIMALS, { count: 99 })).toHaveLength(5);
  });
});
