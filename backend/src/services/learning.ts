import { query, queryOne } from '../database/connection';
import * as PointsRepository from '../database/repositories/PointsRepository';

export interface LearningProgress {
  id: string;
  userId: string;
  lessonId: string;
  category: 'alphabet' | 'numbers' | 'vocabulary';
  phase: string;
  completed: boolean;
  pointsEarned: number;
  completedAt?: Date;
  traced: boolean;
  tracePointsEarned: number;
  tracedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface LearningProgressRow {
  id: string;
  user_id: string;
  lesson_id: string;
  category: 'alphabet' | 'numbers' | 'vocabulary';
  phase: string;
  completed: boolean;
  points_earned: number;
  completed_at: string | null;
  traced: boolean;
  trace_points_earned: number;
  traced_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Points awarded the first (and only) time a lesson is successfully traced. */
export const TRACE_POINTS = 15;

interface PhaseProgressRow {
  total: string | null;
  completed: string | null;
  points_earned: string | null;
}

interface QuizPerformanceRow {
  total: string | null;
  correct: string | null;
  points_earned: string | null;
}

interface RecentActivityRow {
  type: 'lesson' | 'quiz';
  subject: string;
  created_at: string;
  points_earned: number;
}

export type LessonCategory = 'alphabet' | 'numbers' | 'vocabulary';

/** Normalised lesson content — always has `text` (the Gujarati glyph/word). */
export interface LessonContent {
  text: string;
  romanization: string;
  pronunciation: string;
  english: string;
  word?: string;
}

export interface Lesson {
  id: string;
  category: LessonCategory;
  phase: string;
  subcategory: string;
  sequenceOrder: number;
  content: LessonContent;
  pointsValue: number;
}

/** A lesson plus this user's progress on it. */
export interface LessonWithProgress extends Lesson {
  completed: boolean;
  pointsEarned: number;
  traced: boolean;
}

export interface LessonFilter {
  category?: string;
  phase?: string;
  subcategory?: string;
}

interface LessonRow {
  id: string;
  category: LessonCategory;
  phase: string;
  subcategory: string;
  sequence_order: number;
  content: LessonContent;
  points_value: number;
  completed?: boolean | null;
  points_earned?: number | null;
  traced?: boolean | null;
}

export class LearningService {
  private mapLesson(row: LessonRow): Lesson {
    return {
      id: row.id,
      category: row.category,
      phase: row.phase,
      subcategory: row.subcategory,
      sequenceOrder: row.sequence_order,
      content: row.content,
      pointsValue: row.points_value,
    };
  }

  /** The curriculum, optionally filtered. Ordered for stable browse UI. */
  async getLessons(filter: LessonFilter = {}): Promise<Lesson[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    for (const key of ['category', 'phase', 'subcategory'] as const) {
      if (filter[key]) {
        params.push(filter[key]);
        where.push(`${key} = $${params.length}`);
      }
    }
    const { rows } = await query<LessonRow>(
      `SELECT id, category, phase, subcategory, sequence_order, content, points_value
       FROM learning_lessons
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY phase, subcategory, sequence_order`,
      params
    );
    return rows.map((r) => this.mapLesson(r));
  }

  /** The curriculum with this user's per-lesson completion folded in. */
  async getLessonsWithProgress(userId: string, filter: LessonFilter = {}): Promise<LessonWithProgress[]> {
    const where: string[] = [];
    const params: unknown[] = [userId];
    for (const key of ['category', 'phase', 'subcategory'] as const) {
      if (filter[key]) {
        params.push(filter[key]);
        where.push(`l.${key} = $${params.length}`);
      }
    }
    const { rows } = await query<LessonRow>(
      `SELECT l.id, l.category, l.phase, l.subcategory, l.sequence_order, l.content, l.points_value,
              COALESCE(p.completed, false) AS completed,
              COALESCE(p.points_earned, 0) AS points_earned,
              COALESCE(p.traced, false) AS traced
       FROM learning_lessons l
       LEFT JOIN learning_progress p ON p.lesson_id = l.id AND p.user_id = $1
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY l.phase, l.subcategory, l.sequence_order`,
      params
    );
    return rows.map((r) => ({
      ...this.mapLesson(r),
      completed: !!r.completed,
      pointsEarned: r.points_earned ?? 0,
      traced: !!r.traced,
    }));
  }

  async getLessonById(lessonId: string, userId?: string): Promise<LessonWithProgress | null> {
    const { rows } = await query<LessonRow>(
      `SELECT l.id, l.category, l.phase, l.subcategory, l.sequence_order, l.content, l.points_value,
              COALESCE(p.completed, false) AS completed,
              COALESCE(p.points_earned, 0) AS points_earned,
              COALESCE(p.traced, false) AS traced
       FROM learning_lessons l
       LEFT JOIN learning_progress p ON p.lesson_id = l.id AND p.user_id = $2
       WHERE l.id = $1`,
      [lessonId, userId ?? null]
    );
    if (!rows[0]) return null;
    return {
      ...this.mapLesson(rows[0]),
      completed: !!rows[0].completed,
      pointsEarned: rows[0].points_earned ?? 0,
      traced: !!rows[0].traced,
    };
  }

  /**
   * Record lesson completion. `category` / `phase` / `points_value` are read
   * from the lesson row, not trusted from the caller. Throws 'not-found' for an
   * unknown lesson id.
   */
  async completeLesson(userId: string, lessonId: string): Promise<LearningProgress> {
    const lesson = await queryOne<{ category: string; phase: string; points_value: number }>(
      `SELECT category, phase, points_value FROM learning_lessons WHERE id = $1`,
      [lessonId]
    );
    if (!lesson) throw new Error('not-found');

    const result = await queryOne<LearningProgressRow>(
      `INSERT INTO learning_progress (user_id, lesson_id, category, phase, completed, points_earned, completed_at)
       VALUES ($1, $2, $3, $4, true, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET
       completed = true,
       points_earned = $5,
       completed_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
       RETURNING id, user_id, lesson_id, category, phase, completed, points_earned, completed_at,
                 traced, trace_points_earned, traced_at, created_at, updated_at`,
      [userId, lessonId, lesson.category, lesson.phase, lesson.points_value]
    );

    if (!result) throw new Error('Failed to record lesson completion');

    // Award points via the one real points ledger (activity_points), not a
    // separate learning-only ledger -- see 002_chores_and_learning_schema.sql.
    await PointsRepository.addPoints(userId, lesson.points_value, 'learning', `Completed lesson: ${lessonId}`);

    return this.mapProgress(result);
  }

  /**
   * Record a trace-mode session (T-25 / FR-143). Independent of `completed` --
   * a lesson can be traced without ever going through Learn/Quiz. Points are
   * awarded once per lesson, ever: a repeat trace is practice only, no second
   * ledger entry and `traced_at`/`trace_points_earned` are left untouched.
   */
  async completeTrace(userId: string, lessonId: string): Promise<LearningProgress & { alreadyTraced: boolean }> {
    const lesson = await queryOne<{ category: string; phase: string }>(
      `SELECT category, phase FROM learning_lessons WHERE id = $1`,
      [lessonId]
    );
    if (!lesson) throw new Error('not-found');

    const existing = await queryOne<{ traced: boolean }>(
      `SELECT traced FROM learning_progress WHERE user_id = $1 AND lesson_id = $2`,
      [userId, lessonId]
    );
    const alreadyTraced = existing?.traced === true;

    const result = await queryOne<LearningProgressRow>(
      `INSERT INTO learning_progress (user_id, lesson_id, category, phase, traced, traced_at, trace_points_earned)
       VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, $5)
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET
       traced = true,
       traced_at = COALESCE(learning_progress.traced_at, CURRENT_TIMESTAMP),
       trace_points_earned = CASE WHEN learning_progress.traced
         THEN learning_progress.trace_points_earned ELSE $5 END,
       updated_at = CURRENT_TIMESTAMP
       RETURNING id, user_id, lesson_id, category, phase, completed, points_earned, completed_at,
                 traced, trace_points_earned, traced_at, created_at, updated_at`,
      [userId, lessonId, lesson.category, lesson.phase, TRACE_POINTS]
    );

    if (!result) throw new Error('Failed to record trace completion');

    if (!alreadyTraced) {
      await PointsRepository.addPoints(userId, TRACE_POINTS, 'learning', `Traced lesson: ${lessonId}`);
    }

    return { ...this.mapProgress(result), alreadyTraced };
  }

  /**
   * Record quiz answer
   */
  async recordQuizAnswer(
    userId: string,
    lessonId: string,
    questionNumber: number,
    selectedAnswer: number,
    correctAnswer: number,
    pointsEarned: number
  ): Promise<void> {
    const isCorrect = selectedAnswer === correctAnswer;

    await query(
      `INSERT INTO learning_quiz_answers (user_id, lesson_id, question_number, selected_answer, correct_answer, is_correct, points_earned)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, lessonId, questionNumber, selectedAnswer, correctAnswer, isCorrect, isCorrect ? pointsEarned : 0]
    );

    if (isCorrect) {
      await PointsRepository.addPoints(userId, pointsEarned, 'learning', `Quiz question: ${lessonId}:${questionNumber}`);
    }
  }

  /**
   * Get user's progress in a phase. Totals come from `learning_lessons` (the
   * whole phase), not just the rows the user has touched.
   */
  async getPhaseProgress(userId: string, phase: string): Promise<{
    totalLessons: number;
    completedLessons: number;
    percentComplete: number;
    pointsEarned: number;
  }> {
    const result = await queryOne<PhaseProgressRow>(
      `SELECT
        COUNT(*) AS total,
        COUNT(p.id) FILTER (WHERE p.completed) AS completed,
        COALESCE(SUM(p.points_earned) FILTER (WHERE p.completed), 0) AS points_earned
       FROM learning_lessons l
       LEFT JOIN learning_progress p ON p.lesson_id = l.id AND p.user_id = $1
       WHERE l.phase = $2`,
      [userId, phase]
    );

    const total = parseInt(result?.total || '0');
    const completed = parseInt(result?.completed || '0');

    return {
      totalLessons: total,
      completedLessons: completed,
      percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
      pointsEarned: parseInt(result?.points_earned || '0'),
    };
  }

  /**
   * Overall learning stats. `total` per category is the full curriculum count;
   * `completed` / points come from this user's progress.
   */
  async getLearningStats(userId: string): Promise<{
    totalLessonsCompleted: number;
    totalPointsEarned: number;
    alphabet: { completed: number; total: number };
    numbers: { completed: number; total: number };
    vocabulary: { completed: number; total: number };
  }> {
    const { rows } = await query<{
      category: LessonCategory;
      total: string;
      completed: string;
      points: string;
    }>(
      `SELECT l.category,
              COUNT(*) AS total,
              COUNT(p.id) FILTER (WHERE p.completed) AS completed,
              COALESCE(SUM(p.points_earned) FILTER (WHERE p.completed), 0)
                + COALESCE(SUM(p.trace_points_earned) FILTER (WHERE p.traced), 0) AS points
       FROM learning_lessons l
       LEFT JOIN learning_progress p ON p.lesson_id = l.id AND p.user_id = $1
       GROUP BY l.category`,
      [userId]
    );

    const byCat = (cat: LessonCategory) => {
      const r = rows.find((x) => x.category === cat);
      return { completed: parseInt(r?.completed || '0'), total: parseInt(r?.total || '0') };
    };

    return {
      totalLessonsCompleted: rows.reduce((n, r) => n + parseInt(r.completed || '0'), 0),
      totalPointsEarned: rows.reduce((n, r) => n + parseInt(r.points || '0'), 0),
      alphabet: byCat('alphabet'),
      numbers: byCat('numbers'),
      vocabulary: byCat('vocabulary'),
    };
  }

  /**
   * Get quiz performance
   */
  async getQuizPerformance(userId: string): Promise<{
    totalAnswered: number;
    correctAnswers: number;
    accuracy: number;
    pointsEarned: number;
  }> {
    const result = await queryOne<QuizPerformanceRow>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) as correct,
        SUM(points_earned) as points_earned
       FROM learning_quiz_answers
       WHERE user_id = $1`,
      [userId]
    );

    const total = parseInt(result?.total || '0');
    const correct = parseInt(result?.correct || '0');

    return {
      totalAnswered: total,
      correctAnswers: correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      pointsEarned: parseInt(result?.points_earned || '0'),
    };
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(userId: string, limit: number = 20): Promise<RecentActivityRow[]> {
    const results = await query<RecentActivityRow>(
      `SELECT 'lesson' as type, lesson_id as subject, completed_at as created_at, points_earned
       FROM learning_progress WHERE user_id = $1 AND completed = true
       UNION ALL
       SELECT 'quiz' as type, CONCAT(lesson_id, ':', question_number) as subject, created_at, points_earned
       FROM learning_quiz_answers WHERE user_id = $1 AND is_correct = true
       ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );

    return results.rows;
  }

  private mapProgress(row: LearningProgressRow): LearningProgress {
    return {
      id: row.id,
      userId: row.user_id,
      lessonId: row.lesson_id,
      category: row.category,
      phase: row.phase,
      completed: row.completed,
      pointsEarned: row.points_earned,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      traced: row.traced,
      tracePointsEarned: row.trace_points_earned,
      tracedAt: row.traced_at ? new Date(row.traced_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

let learningService: LearningService | null = null;

export function getLearningService(): LearningService {
  if (!learningService) {
    learningService = new LearningService();
  }
  return learningService;
}
