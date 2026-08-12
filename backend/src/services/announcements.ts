import { getSupabase } from './supabase'
import type { Database } from '../types/database';

type Announcement = Database['public']['Tables']['announcements']['Row'];
type AnnouncementInsert = Database['public']['Tables']['announcements']['Insert'];

interface AnnouncementWithReadStatus extends Announcement {
  is_read: boolean;
  reader_count: number;
}

class AnnouncementService {
  /**
   * Get all active announcements for a user
   */
  async getAnnouncementsForUser(userId: string): Promise<AnnouncementWithReadStatus[]> {
    try {
      // Get user's family ID first
      const { data: familyMember } = await getSupabase()
        .from('family_members')
        .select('family_id')
        .eq('user_id', userId)
        .single();

      if (!familyMember) {
        return [];
      }

      // Get all active announcements for family
      const { data: announcements, error } = await getSupabase()
        .from('announcements')
        .select(
          `
          id,
          family_id,
          created_by_id,
          title,
          message,
          announcement_type,
          priority,
          target_audience,
          target_user_ids,
          is_pinned,
          expires_at,
          created_at,
          updated_at
        `,
        )
        .eq('family_id', familyMember.family_id)
        .or(
          `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`,
        )
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check read status for each announcement
      const { data: reads } = await getSupabase()
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', userId);

      const readIds = new Set(reads?.map((r) => r.announcement_id) || []);

      // Filter by target audience and add read status
      const filtered = (announcements || [])
        .filter((announcement) => {
          if (announcement.target_audience === 'all') return true;
          if (announcement.target_audience === 'specific') {
            return announcement.target_user_ids?.includes(userId);
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
  ): Promise<any> {
    try {
      const { data: announcement, error } = await getSupabase()
        .from('announcements')
        .insert({
          created_by_id: createdById,
          title: data.title,
          message: data.message,
          family_id: data.family_id,
          announcement_type: data.announcement_type || 'general',
          priority: data.priority || 'normal',
          target_audience: data.target_audience || 'all',
          target_user_ids: data.target_user_ids || [],
          is_pinned: data.is_pinned || false,
          expires_at: data.expires_at,
        })
        .select()
        .single();

      if (error) throw error;
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
      const { error } = await getSupabase()
        .from('announcement_reads')
        .insert({
          announcement_id: announcementId,
          user_id: userId,
        });

      // Ignore conflict error (already read)
      if (error && error.code !== '23505') {
        throw error;
      }
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
  ): Promise<any> {
    try {
      const { data: announcement, error } = await getSupabase()
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
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
      const { error } = await getSupabase()
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
      const { count, error } = await getSupabase()
        .from('announcement_reads')
        .select('*', { count: 'exact' })
        .eq('announcement_id', announcementId);

      if (error) throw error;
      return count || 0;
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




