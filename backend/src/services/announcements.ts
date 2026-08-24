import { query, queryOne } from '../database/connection';
import type { Database } from '../types/database';

type Announcement = Database['public']['Tables']['announcements']['Row'];
type AnnouncementInsert = Database['public']['Tables']['announcements']['Insert'];

interface AnnouncementWithReadStatus extends Announcement {
  is_read: boolean;
  reader_count: number;
}

// PATCH /api/announcements/:id passes req.body straight through with no runtime
// validation (the Partial<AnnouncementInsert> type only checks at compile time) --
// this whitelist is what stands between an arbitrary request body and a raw SQL
// UPDATE statement.
const UPDATABLE_ANNOUNCEMENT_COLUMNS = [
  'title', 'message', 'announcement_type', 'priority',
  'target_audience', 'target_user_ids', 'is_pinned', 'expires_at',
];

class AnnouncementService {
  /**
   * Get all active announcements for a user
   */
  async getAnnouncementsForUser(userId: string): Promise<AnnouncementWithReadStatus[]> {
    try {
      const familyMember = await queryOne<{ family_id: string }>(
        `SELECT family_id FROM family_members WHERE user_id = $1 LIMIT 1`,
        [userId]
      );

      if (!familyMember) {
        return [];
      }

      const announcementsResult = await query<Announcement>(
        `SELECT id, family_id, created_by_id, title, message, announcement_type, priority,
                target_audience, target_user_ids, is_pinned, expires_at, created_at, updated_at
         FROM announcements
         WHERE family_id = $1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
         ORDER BY is_pinned DESC, created_at DESC`,
        [familyMember.family_id]
      );

      const readsResult = await query<{ announcement_id: string }>(
        `SELECT announcement_id FROM announcement_reads WHERE user_id = $1`,
        [userId]
      );

      const readIds = new Set(readsResult.rows.map((r) => r.announcement_id));

      // Filter by target audience and add read status
      const filtered = announcementsResult.rows
        .filter((announcement) => {
          if (announcement.target_audience === 'all') return true;
          if (announcement.target_audience === 'specific') {
            return (announcement.target_user_ids as unknown as string[] | null)?.includes(userId);
          }
          // Check user role for children/parents filtering
          // TODO: Implement role-based filtering
          return true;
        })
        .map((announcement) => ({
          ...announcement,
          is_read: readIds.has(announcement.id),
          reader_count: 0, // TODO: Get actual reader count
        }));

      return filtered;
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      throw error;
    }
  }

  /**
   * Create an announcement (parent/admin only)
   */
  async createAnnouncement(
    createdById: string,
    data: {
      family_id: string;
      title: string;
      message: string;
      announcement_type?: string;
      priority?: string;
      target_audience?: string;
      target_user_ids?: string[];
      is_pinned?: boolean;
      expires_at?: string;
    },
  ): Promise<Announcement> {
    try {
      const announcement = await queryOne<Announcement>(
        `INSERT INTO announcements
           (created_by_id, title, message, family_id, announcement_type, priority, target_audience, target_user_ids, is_pinned, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          createdById,
          data.title,
          data.message,
          data.family_id,
          data.announcement_type || 'general',
          data.priority || 'normal',
          data.target_audience || 'all',
          data.target_user_ids || [],
          data.is_pinned || false,
          data.expires_at || null,
        ]
      );

      if (!announcement) throw new Error('Failed to create announcement');
      return announcement;
    } catch (error) {
      console.error('Failed to create announcement:', error);
      throw error;
    }
  }

  /**
   * Mark announcement as read
   */
  async markAsRead(announcementId: string, userId: string): Promise<void> {
    try {
      // ON CONFLICT DO NOTHING: silently ignore if already read (same UNIQUE
      // (announcement_id, user_id) constraint the old Supabase-error-code check
      // against '23505' was working around)
      await query(
        `INSERT INTO announcement_reads (announcement_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (announcement_id, user_id) DO NOTHING`,
        [announcementId, userId]
      );
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
      throw error;
    }
  }

  /**
   * Update announcement
   */
  async updateAnnouncement(
    id: string,
    updates: Partial<AnnouncementInsert>,
  ): Promise<Announcement | null> {
    try {
      const columns = Object.keys(updates || {}).filter((k) => UPDATABLE_ANNOUNCEMENT_COLUMNS.includes(k)) as (keyof AnnouncementInsert)[];

      if (columns.length === 0) {
        return queryOne<Announcement>(`SELECT * FROM announcements WHERE id = $1`, [id]);
      }

      const setClauses = columns.map((col, i) => `${col} = $${i + 2}`);
      const values = columns.map((col) => updates[col]);

      const announcement = await queryOne<Announcement>(
        `UPDATE announcements
         SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id, ...values]
      );

      return announcement;
    } catch (error) {
      console.error('Failed to update announcement:', error);
      throw error;
    }
  }

  /**
   * Delete announcement
   */
  async deleteAnnouncement(id: string): Promise<void> {
    try {
      await query(`DELETE FROM announcements WHERE id = $1`, [id]);
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      throw error;
    }
  }

  /**
   * Get read count for announcement
   */
  async getReadCount(announcementId: string): Promise<number> {
    try {
      const result = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM announcement_reads WHERE announcement_id = $1`,
        [announcementId]
      );
      return result ? parseInt(result.count, 10) : 0;
    } catch (error) {
      console.error('Failed to get read count:', error);
      throw error;
    }
  }
}

// Singleton pattern
let announcementService: AnnouncementService;

export function getAnnouncementService(): AnnouncementService {
  if (!announcementService) {
    announcementService = new AnnouncementService();
  }
  return announcementService;
}
