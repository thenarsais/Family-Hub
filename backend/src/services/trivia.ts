import crypto from 'crypto';
import { query, queryOne } from '../database/connection';
import * as PointsRepository from '../database/repositories/PointsRepository';

export type TriviaDifficulty = 'easy' | 'medium' | 'hard';

interface QuestionRow {
  id: string;
  legacy_id: string;
  question: string;
  category: string;
  difficulty: TriviaDifficulty;
  correct_answer: string;
  incorrect_answers: string[];
  hint: string | null;
  fun_fact: string | null;
  points_value: number;
  sort_order: number;
}

/** The question as shown to the learner (no answer key). */
export interface TriviaQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: TriviaDifficulty;
  options: string[];
  hint: string | null;
  pointsValue: number;
}

export interface TriviaAttempt {
  selectedAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  correctAnswer: string;
  funFact: string | null;
}

export interface TriviaToday {
  question: TriviaQuestion | null;
  attempt: TriviaAttempt | null;
  streak: number;
  stats: { answered: number; correct: number };
}

const EPOCH = '2026-01-01';

export class TriviaService {
  /** Family timezone for the daily boundary; default the family's home region. */
  private async familyTz(userId: string): Promise<string> {
    const row = await queryOne<{ timezone: string | null }>(
      `SELECT fs.timezone
       FROM family_members fm
       LEFT JOIN family_settings fs ON fs.family_id = fm.family_id
       WHERE fm.user_id = $1 AND fm.is_active = true
       LIMIT 1`,
      [userId],
    );
    return row?.timezone || 'America/Denver';
  }

  /**
   * The single question for the family-local day — deterministic, so the whole
   * household (and roughly everyone) sees the same one. Null when the bank is empty.
   */
  private async pickDailyQuestion(tz: string): Promise<QuestionRow | null> {
    const countRow = await queryOne<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM trivia_questions`,
    );
    const count = countRow?.c ?? 0;
    if (count === 0) return null;

    const dayRow = await queryOne<{ d: number }>(
      `SELECT ((now() AT TIME ZONE $1)::date - DATE '${EPOCH}')::int AS d`,
      [tz],
    );
    const day = dayRow?.d ?? 0;
    const offset = (((day % count) + count) % count);

    return queryOne<QuestionRow>(
      `SELECT * FROM trivia_questions ORDER BY sort_order, legacy_id OFFSET $1 LIMIT 1`,
      [offset],
    );
  }

  /** Stable option order for a question — same for everyone, doesn't reshuffle. */
  private orderOptions(q: QuestionRow): string[] {
    return [q.correct_answer, ...q.incorrect_answers]
      .map((opt) => ({
        opt,
        key: crypto.createHash('sha1').update(`${q.id}|${opt}`).digest('hex'),
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((x) => x.opt);
  }

  /** Consecutive family-local days ending today with a trivia attempt (right or wrong). */
  private async streak(userId: string, tz: string): Promise<number> {
    const res = await queryOne<{ len: number }>(
      `WITH days AS (
         SELECT DISTINCT answered_on AS d FROM trivia_attempts WHERE user_id = $1
       ),
       ranked AS (
         SELECT d,
                (now() AT TIME ZONE $2)::date - d AS gap,
                row_number() OVER (ORDER BY d DESC) - 1 AS rn
         FROM days
         WHERE d <= (now() AT TIME ZONE $2)::date
       )
       SELECT count(*)::int AS len FROM ranked WHERE gap = rn`,
      [userId, tz],
    );
    return res?.len ?? 0;
  }

  private async stats(userId: string): Promise<{ answered: number; correct: number }> {
    const row = await queryOne<{ answered: number; correct: number }>(
      `SELECT COUNT(*)::int AS answered,
              COUNT(*) FILTER (WHERE is_correct)::int AS correct
       FROM trivia_attempts WHERE user_id = $1`,
      [userId],
    );
    return { answered: row?.answered ?? 0, correct: row?.correct ?? 0 };
  }

  /** Today's question + this user's attempt (if any) + streak + lifetime stats. */
  async getToday(userId: string): Promise<TriviaToday> {
    const tz = await this.familyTz(userId);
    const q = await this.pickDailyQuestion(tz);
    if (!q) {
      return { question: null, attempt: null, streak: 0, stats: { answered: 0, correct: 0 } };
    }

    const attemptRow = await queryOne<{
      selected_answer: string;
      is_correct: boolean;
      points_earned: number;
    }>(
      `SELECT selected_answer, is_correct, points_earned
       FROM trivia_attempts
       WHERE user_id = $1 AND answered_on = (now() AT TIME ZONE $2)::date`,
      [userId, tz],
    );

    return {
      question: {
        id: q.id,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        options: this.orderOptions(q),
        hint: q.hint,
        pointsValue: q.points_value,
      },
      attempt: attemptRow
        ? {
            selectedAnswer: attemptRow.selected_answer,
            isCorrect: attemptRow.is_correct,
            pointsEarned: attemptRow.points_earned,
            correctAnswer: q.correct_answer,
            funFact: q.fun_fact,
          }
        : null,
      streak: await this.streak(userId, tz),
      stats: await this.stats(userId),
    };
  }

  /**
   * Record today's answer. `answer` must be one of the four options (else
   * 'bad-answer'). A second submit the same day is a no-op — returns the state.
   * Points (flat by difficulty) only on a correct answer.
   */
  async submitToday(userId: string, answer: string): Promise<TriviaToday> {
    const tz = await this.familyTz(userId);
    const q = await this.pickDailyQuestion(tz);
    if (!q) throw new Error('no-question');

    if (!this.orderOptions(q).includes(answer)) throw new Error('bad-answer');

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM trivia_attempts
       WHERE user_id = $1 AND answered_on = (now() AT TIME ZONE $2)::date`,
      [userId, tz],
    );

    if (!existing) {
      const isCorrect = answer === q.correct_answer;
      const points = isCorrect ? q.points_value : 0;
      await query(
        `INSERT INTO trivia_attempts
           (user_id, question_id, answered_on, selected_answer, is_correct, points_earned)
         VALUES ($1, $2, (now() AT TIME ZONE $3)::date, $4, $5, $6)
         ON CONFLICT (user_id, answered_on) DO NOTHING`,
        [userId, q.id, tz, answer, isCorrect, points],
      );
      if (isCorrect) {
        await PointsRepository.addPoints(userId, points, 'trivia', `Daily trivia: ${q.legacy_id}`);
      }
    }

    return this.getToday(userId);
  }
}

let triviaService: TriviaService | null = null;

export function getTriviaService(): TriviaService {
  if (!triviaService) triviaService = new TriviaService();
  return triviaService;
}
