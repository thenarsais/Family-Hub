import { query, queryOne } from '../database/connection';

export interface LearningProgress {
  id: string;
  userId: string;
  lessonId: string;
  category: 'alphabet' | 'numbers' | 'vocabulary';
  phase: string;
  completed: boolean;
  pointsEarned: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class LearningService {
  /**
   * Record lesson completion
   */
  async completeLesson(
    userId: string,
    lessonId: string,
    category: string,
    phase: string,
    pointsValue: number = 10
  ): Promise<LearningProgress> {
    const result = await queryOne<any>(
      `INSERT INTO learning_progress (user_id, lesson_id, category, phase, completed, points_earned, completed_at)
       VALUES ($1, $2, $3, $4, true, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET
       completed = true,
       points_earned = $5,
       completed_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
       RETURNING id, user_id, lesson_id, category, phase, completed, points_earned, completed_at, created_at, updated_at`,
      [userId, lessonId, category, phase, pointsValue]
    );

    if (!result) throw new Error('Failed to record lesson completion');

    // Award points
    await query(
      `INSERT INTO point_transactions (user_id, amount, source, description)
       VALUES ($1, $2, 'learning', $3)`,
      [userId, pointsValue, `Completed lesson: ${lessonId}`]
    );

    return this.mapProgress(result);
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
      await query(
        `INSERT INTO point_transactions (user_id, amount, source, description)
         VALUES ($1, $2, 'learning', $3)`,
        [userId, pointsEarned, `Quiz question: ${lessonId}:${questionNumber}`]
      );
    }
  }

  /**
   * Get user's progress in a phase
   */
  async getPhaseProgress(userId: string, phase: string): Promise<{
    totalLessons: number;
    completedLessons: number;
    percentComplete: number;
    pointsEarned: number;
  }> {
    const result = await queryOne<any>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed,
        SUM(points_earned) as points_earned
       FROM learning_progress
       WHERE user_id = $1 AND phase = $2`,
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
   * Get overall learning statistics
   */
  async getLearningStats(userId: string): Promise<{
    totalLessonsCompleted: number;
    totalPointsEarned: number;
    alphabet: { completed: number; total: number };
    numbers: { completed: number; total: number };
    vocabulary: { completed: number; total: number };
  }> {
    const result = await queryOne<any>(
      `SELECT
        COUNT(*) as total_completed,
        SUM(points_earned) as total_points,
        SUM(CASE WHEN phase = 'phase_1_alphabet' AND completed = true THEN 1 ELSE 0 END) as alphabet_completed,
        SUM(CASE WHEN phase = 'phase_1_alphabet' THEN 1 ELSE 0 END) as alphabet_total,
        SUM(CASE WHEN phase = 'phase_2_numbers' AND completed = true THEN 1 ELSE 0 END) as numbers_completed,
        SUM(CASE WHEN phase = 'phase_2_numbers' THEN 1 ELSE 0 END) as numbers_total,
        SUM(CASE WHEN phase = 'phase_3_vocabulary' AND completed = true THEN 1 ELSE 0 END) as vocab_completed,
        SUM(CASE WHEN phase = 'phase_3_vocabulary' THEN 1 ELSE 0 END) as vocab_total
       FROM learning_progress
       WHERE user_id = $1 AND completed = true`,
      [userId]
    );

    return {
      totalLessonsCompleted: parseInt(result?.total_completed || '0'),
      totalPointsEarned: parseInt(result?.total_points || '0'),
      alphabet: {
        completed: parseInt(result?.alphabet_completed || '0'),
        total: parseInt(result?.alphabet_total || '0'),
      },
      numbers: {
        completed: parseInt(result?.numbers_completed || '0'),
        total: parseInt(result?.numbers_total || '0'),
      },
      vocabulary: {
        completed: parseInt(result?.vocab_completed || '0'),
        total: parseInt(result?.vocab_total || '0'),
      },
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
    const result = await queryOne<any>(
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
  async getRecentActivity(userId: string, limit: number = 20): Promise<any[]> {
    const results = await query<any>(
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

  private mapProgress(row: any): LearningProgress {
    return {
      id: row.id,
      userId: row.user_id,
      lessonId: row.lesson_id,
      category: row.category,
      phase: row.phase,
      completed: row.completed,
      pointsEarned: row.points_earned,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
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
