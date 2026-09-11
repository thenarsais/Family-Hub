import { query, queryOne } from '../database/connection';
import * as PointsRepository from '../database/repositories/PointsRepository';

/**
 * Daily quests (FR-029 / T-23). The real v1 named in the 2026-09-01 decision:
 * "pick 3 random quests, +50 if all done." FR-030's hybrid-rotation/
 * weakness-bias/swap-economy engine is NOT built.
 *
 * Each quest maps to one of the 8 existing Activity Board sections and is
 * marked done the moment the real underlying action happens today — a
 * read-only check against that section's own table. There is no separate
 * "complete quest" write path anywhere.
 */

export const QUEST_TEMPLATES = [
  { key: 'chore', label: 'Complete a chore' },
  { key: 'habit', label: 'Complete a habit' },
  { key: 'homework', label: 'Finish a homework item' },
  { key: 'reading', label: 'Log your reading' },
  { key: 'kungfu', label: 'Log a kung fu session' },
  { key: 'trivia', label: "Answer today's trivia" },
  { key: 'mood', label: 'Check in your mood' },
  { key: 'gujarati', label: 'Complete a Gujarati lesson' },
] as const;

export type QuestKey = (typeof QUEST_TEMPLATES)[number]['key'];

const LABEL_BY_KEY: Record<QuestKey, string> = Object.fromEntries(
  QUEST_TEMPLATES.map((t) => [t.key, t.label]),
) as Record<QuestKey, string>;

export interface Quest {
  key: QuestKey;
  label: string;
  done: boolean;
}

export interface QuestsToday {
  quests: Quest[];
  allDone: boolean;
  bonusAwarded: boolean;
}

const BONUS_POINTS = 50;

/** One EXISTS check per quest type, against that section's own table. */
const DONE_CHECKS: Record<
  QuestKey,
  (userId: string, tz: string) => Promise<boolean>
> = {
  chore: (userId, tz) =>
    existsToday(
      `SELECT 1 FROM chore_completions
       WHERE user_id = $1 AND (completed_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date`,
      userId,
      tz,
    ),
  habit: (userId, tz) =>
    existsToday(
      `SELECT 1 FROM habit_completions
       WHERE user_id = $1 AND (completed_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date`,
      userId,
      tz,
    ),
  homework: (userId, tz) =>
    existsToday(
      `SELECT 1 FROM homework_items
       WHERE user_id = $1 AND completed_at IS NOT NULL
         AND (completed_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date`,
      userId,
      tz,
    ),
  reading: (userId, tz) =>
    existsToday(
      `SELECT 1 FROM reading_logs WHERE user_id = $1 AND log_date = (now() AT TIME ZONE $2)::date`,
      userId,
      tz,
    ),
  kungfu: (userId, tz) =>
    existsToday(
      `SELECT 1 FROM kungfu_logs WHERE user_id = $1 AND log_date = (now() AT TIME ZONE $2)::date`,
      userId,
      tz,
    ),
  trivia: (userId, tz) =>
    existsToday(
      `SELECT 1 FROM trivia_attempts WHERE user_id = $1 AND answered_on = (now() AT TIME ZONE $2)::date`,
      userId,
      tz,
    ),
  mood: (userId, tz) =>
    existsToday(
      `SELECT 1 FROM mood_entries
       WHERE user_id = $1 AND (recorded_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date`,
      userId,
      tz,
    ),
  gujarati: (userId, tz) =>
    existsToday(
      `SELECT 1 FROM learning_progress
       WHERE user_id = $1 AND completed = true
         AND (completed_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date`,
      userId,
      tz,
    ),
};

async function existsToday(sql: string, userId: string, tz: string): Promise<boolean> {
  const row = await queryOne<{ ok: boolean }>(`SELECT EXISTS (${sql}) AS ok`, [userId, tz]);
  return !!row?.ok;
}

function pickThree(): QuestKey[] {
  const keys = QUEST_TEMPLATES.map((t) => t.key);
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  return keys.slice(0, 3);
}

interface AssignmentRow {
  id: string;
  template_keys: QuestKey[];
  bonus_awarded: boolean;
}

export class QuestService {
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

  private async getOrAssign(userId: string, tz: string): Promise<AssignmentRow> {
    const existing = await queryOne<AssignmentRow>(
      `SELECT id, template_keys, bonus_awarded FROM quest_assignments
       WHERE user_id = $1 AND quest_date = (now() AT TIME ZONE $2)::date`,
      [userId, tz],
    );
    if (existing) return existing;

    const keys = pickThree();
    const inserted = await queryOne<AssignmentRow>(
      `INSERT INTO quest_assignments (user_id, quest_date, template_keys)
       VALUES ($1, (now() AT TIME ZONE $2)::date, $3)
       ON CONFLICT (user_id, quest_date) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING id, template_keys, bonus_awarded`,
      [userId, tz, keys],
    );
    if (!inserted) throw new Error('Failed to assign daily quests');
    return inserted;
  }

  /**
   * Today's 3 assigned quests + whether each is done (checked live against
   * the real section tables) + the all-done bonus, awarded at most once/day.
   */
  async getToday(userId: string): Promise<QuestsToday> {
    const tz = await this.familyTz(userId);
    const assignment = await this.getOrAssign(userId, tz);

    const quests: Quest[] = await Promise.all(
      assignment.template_keys.map(async (key) => ({
        key,
        label: LABEL_BY_KEY[key],
        done: await DONE_CHECKS[key](userId, tz),
      })),
    );

    const allDone = quests.length > 0 && quests.every((q) => q.done);
    let bonusAwarded = assignment.bonus_awarded;

    if (allDone && !bonusAwarded) {
      await PointsRepository.addPoints(
        userId,
        BONUS_POINTS,
        'quests',
        `Daily quest bonus: ${assignment.id}`,
      );
      await query(`UPDATE quest_assignments SET bonus_awarded = true WHERE id = $1`, [
        assignment.id,
      ]);
      bonusAwarded = true;
    }

    return { quests, allDone, bonusAwarded };
  }
}

let questService: QuestService | null = null;

export function getQuestService(): QuestService {
  if (!questService) {
    questService = new QuestService();
  }
  return questService;
}
