/**
 * Seed `trivia_questions` from seed-data/trivia-questions-phase1.json (T-09).
 *
 * Idempotent: upserts on `legacy_id`, so re-running refreshes question text /
 * fun facts without disturbing anyone's `trivia_attempts`.
 *
 *   npm run seed:trivia
 */
import fs from 'fs';
import path from 'path';
import { pool } from '../database/connection';

type Difficulty = 'easy' | 'medium' | 'hard';

interface RawQuestion {
  uuid?: string;
  legacyId?: string;
  category: string;
  difficulty: string;
  question: string;
  options: string[];
  correct: string;
  hint?: string;
  funFact?: string;
  enhancedFunFact?: string;
}

export interface TriviaRow {
  legacyId: string;
  question: string;
  category: string;
  difficulty: Difficulty;
  correctAnswer: string;
  incorrectAnswers: string[];
  hint: string | null;
  funFact: string | null;
  pointsValue: number;
  sortOrder: number;
}

const BANK = path.resolve(__dirname, '../../seed-data/trivia-questions-phase1.json');
const POINTS: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 30 };

export function parseTriviaBank(raw: RawQuestion[]): TriviaRow[] {
  return raw.map((q, i) => {
    const difficulty = (['easy', 'medium', 'hard'].includes(q.difficulty)
      ? q.difficulty
      : 'easy') as Difficulty;
    return {
      legacyId: q.legacyId ?? q.uuid ?? `q-${i}`,
      question: q.question,
      category: q.category,
      difficulty,
      correctAnswer: q.correct,
      incorrectAnswers: q.options.filter((o) => o !== q.correct),
      hint: q.hint ?? null,
      funFact: q.funFact ?? q.enhancedFunFact ?? null,
      pointsValue: POINTS[difficulty],
      sortOrder: i,
    };
  });
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(BANK, 'utf8')) as RawQuestion[];
  const rows = parseTriviaBank(raw);
  console.log(`Parsed ${rows.length} trivia questions.`);

  for (const r of rows) {
    await pool.query(
      `INSERT INTO trivia_questions
         (legacy_id, question, category, difficulty, correct_answer, incorrect_answers,
          hint, fun_fact, points_value, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (legacy_id) DO UPDATE SET
         question = EXCLUDED.question,
         category = EXCLUDED.category,
         difficulty = EXCLUDED.difficulty,
         correct_answer = EXCLUDED.correct_answer,
         incorrect_answers = EXCLUDED.incorrect_answers,
         hint = EXCLUDED.hint,
         fun_fact = EXCLUDED.fun_fact,
         points_value = EXCLUDED.points_value,
         sort_order = EXCLUDED.sort_order`,
      [
        r.legacyId,
        r.question,
        r.category,
        r.difficulty,
        r.correctAnswer,
        r.incorrectAnswers,
        r.hint,
        r.funFact,
        r.pointsValue,
        r.sortOrder,
      ],
    );
  }

  const { rows: count } = await pool.query(`SELECT COUNT(*)::int AS n FROM trivia_questions`);
  console.log(`Upserted ${rows.length}. trivia_questions now holds ${count[0].n}.`);
  await pool.end();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('seed-trivia failed:', err);
    process.exitCode = 1;
    void pool.end();
  });
}
