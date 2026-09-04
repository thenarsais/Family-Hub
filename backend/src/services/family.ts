import { query, queryOne } from '../database/connection';
import type { Database } from '../types/database';

import crypto from 'crypto';

export type Family = Database['public']['Tables']['families']['Row'];
export type FamilyMember = Database['public']['Tables']['family_members']['Row'];

/** A family_members row enriched with the joined user's name/email (both null
 *  when the member has no linked users row). `color` is the calendar colour
 *  key (migration 006); null until a parent assigns one. */
export type FamilyMemberWithUser = FamilyMember & {
  name: string | null;
  email: string | null;
  color: string | null;
};
export type FamilySettings = Database['public']['Tables']['family_settings']['Row'];
type FamilySettingsInsert = Database['public']['Tables']['family_settings']['Insert'];
type FamilyInvitation = Database['public']['Tables']['family_invitations']['Row'];

interface FamilyWithMembers extends Family {
  member_count: number;
  members: FamilyMember[];
}

// Only these columns may be updated via PATCH /api/family/settings -- the route
// passes req.body straight through with no validation, so this whitelist is what
// stands between an arbitrary request body and a raw SQL UPDATE statement.
const UPDATABLE_SETTINGS_COLUMNS = [
  'theme', 'language', 'timezone', 'notifications_enabled', 'sound_notifications',
  'email_digest_frequency', 'parental_controls_enabled', 'require_age_verification',
  'max_screen_time_minutes', 'bedtime_enabled', 'bedtime_start', 'bedtime_end',
  'enable_smart_home_control', 'points_system_enabled', 'badges_system_enabled',
  'leaderboard_enabled', 'privacy_mode', 'allow_google_calendar_sync',
];

class FamilyService {
  /**
   * Get user's family
   */
  async getUserFamily(userId: string): Promise<FamilyWithMembers | null> {
    try {
      const familyMember = await queryOne<{ family_id: string }>(
        `SELECT family_id FROM family_members WHERE user_id = $1 AND is_active = true LIMIT 1`,
        [userId]
      );

      if (!familyMember) {
        return null;
      }

      const family = await queryOne<Family>(
        `SELECT * FROM families WHERE id = $1 LIMIT 1`,
        [familyMember.family_id]
      );

      if (!family) {
        return null;
      }

      const membersResult = await query<FamilyMember>(
        `SELECT * FROM family_members WHERE family_id = $1 AND is_active = true`,
        [family.id]
      );

      return {
        ...family,
        member_count: membersResult.rows.length,
        members: membersResult.rows,
      };
    } catch (error) {
      console.error('Failed to get user family:', error);
      throw error;
    }
  }

  /**
   * Create a new family
   */
  async createFamily(
    createdById: string,
    data: {
      name: string;
      description?: string;
      max_children?: number;
      max_parents?: number;
    },
  ): Promise<Family> {
    try {
      const family = await queryOne<Family>(
        `INSERT INTO families (name, description, created_by_id, max_children, max_parents)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [data.name, data.description || null, createdById, data.max_children || 5, data.max_parents || 2]
      );

      if (!family) throw new Error('Failed to create family');

      // Add creator as admin member
      await query(
        `INSERT INTO family_members (family_id, user_id, role, invited_by_id)
         VALUES ($1, $2, 'admin', NULL)`,
        [family.id, createdById]
      );

      // Create default settings for family
      await query(
        `INSERT INTO family_settings (family_id, theme, language, timezone)
         VALUES ($1, 'light', 'en', 'America/New_York')`,
        [family.id]
      );

      return family;
    } catch (error) {
      console.error('Failed to create family:', error);
      throw error;
    }
  }

  /**
   * Get family members
   */
  async getFamilyMembers(familyId: string): Promise<FamilyMemberWithUser[]> {
    try {
      const result = await query<FamilyMemberWithUser>(
        `SELECT fm.*, u.name, u.email
           FROM family_members fm
           LEFT JOIN users u ON u.id = fm.user_id
          WHERE fm.family_id = $1 AND fm.is_active = true
          ORDER BY fm.role ASC`,
        [familyId]
      );
      return result.rows;
    } catch (error) {
      console.error('Failed to get family members:', error);
      throw error;
    }
  }

  /**
   * Add member to family (by email)
   */
  async inviteFamilyMember(
    familyId: string,
    invitedByUserId: string,
    email: string,
    role: 'admin' | 'parent' | 'child' | 'guardian',
  ): Promise<string> {
    try {
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const result = await queryOne<{ invite_token: string }>(
        `INSERT INTO family_invitations (family_id, invited_email, inviting_parent_id, role, invite_token, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING invite_token`,
        [familyId, email, invitedByUserId, role, inviteToken, expiresAt.toISOString()]
      );

      if (!result) throw new Error('Failed to create invitation');

      return result.invite_token;
    } catch (error) {
      console.error('Failed to invite family member:', error);
      throw error;
    }
  }

  /**
   * Accept family invitation
   */
  async acceptInvitation(inviteToken: string, userId: string): Promise<FamilyMember> {
    try {
      const invitation = await queryOne<FamilyInvitation>(
        `SELECT * FROM family_invitations WHERE invite_token = $1 LIMIT 1`,
        [inviteToken]
      );

      if (!invitation) {
        throw new Error('Invalid or expired invitation');
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation expired');
      }

      const member = await queryOne<FamilyMember>(
        `INSERT INTO family_members (family_id, user_id, role, invited_by_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [invitation.family_id, userId, invitation.role, invitation.inviting_parent_id]
      );

      if (!member) throw new Error('Failed to add family member');

      await query(
        `UPDATE family_invitations SET accepted_at = CURRENT_TIMESTAMP WHERE invite_token = $1`,
        [inviteToken]
      );

      return member;
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  }

  /**
   * Directly add a member to a family, bypassing the email invite/accept
   * token flow. Used for parent-provisioned child accounts (COPPA
   * compliance, FRAMEWORK.md Decision #29) where the parent is creating the
   * account themselves, not inviting someone who accepts independently.
   */
  async addMember(
    familyId: string,
    userId: string,
    role: 'admin' | 'parent' | 'child' | 'guardian',
    addedById: string,
  ): Promise<FamilyMember> {
    const member = await queryOne<FamilyMember>(
      `INSERT INTO family_members (family_id, user_id, role, invited_by_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [familyId, userId, role, addedById]
    );

    if (!member) throw new Error('Failed to add family member');
    return member;
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    familyId: string,
    memberId: string,
    newRole: string,
  ): Promise<FamilyMember | null> {
    try {
      const result = await queryOne<FamilyMember>(
        `UPDATE family_members SET role = $1, updated_at = CURRENT_TIMESTAMP
         WHERE family_id = $2 AND user_id = $3
         RETURNING *`,
        [newRole, familyId, memberId]
      );
      return result;
    } catch (error) {
      console.error('Failed to update member role:', error);
      throw error;
    }
  }

  /**
   * Set (or clear, with null) a family member's calendar colour key.
   * `memberId` is the member's user_id, matching updateMemberRole.
   */
  async updateMemberColor(
    familyId: string,
    memberId: string,
    color: string | null,
  ): Promise<FamilyMember | null> {
    try {
      const result = await queryOne<FamilyMember>(
        `UPDATE family_members SET color = $1, updated_at = CURRENT_TIMESTAMP
         WHERE family_id = $2 AND user_id = $3
         RETURNING *`,
        [color, familyId, memberId]
      );
      return result;
    } catch (error) {
      console.error('Failed to update member colour:', error);
      throw error;
    }
  }

  /**
   * Remove member from family
   */
  async removeMember(familyId: string, memberId: string): Promise<void> {
    try {
      await query(
        `UPDATE family_members SET is_active = false, updated_at = CURRENT_TIMESTAMP
         WHERE family_id = $1 AND user_id = $2`,
        [familyId, memberId]
      );
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  }

  /**
   * Get family settings
   */
  async getFamilySettings(familyId: string): Promise<FamilySettings | null> {
    try {
      return await queryOne<FamilySettings>(
        `SELECT * FROM family_settings WHERE family_id = $1 LIMIT 1`,
        [familyId]
      );
    } catch (error) {
      console.error('Failed to get family settings:', error);
      throw error;
    }
  }

  /**
   * Update family settings
   */
  async updateFamilySettings(familyId: string, updates: Partial<FamilySettingsInsert>): Promise<FamilySettings | null> {
    try {
      const columns = Object.keys(updates || {}).filter((k) => UPDATABLE_SETTINGS_COLUMNS.includes(k)) as (keyof FamilySettingsInsert)[];

      if (columns.length === 0) {
        return this.getFamilySettings(familyId);
      }

      const setClauses = columns.map((col, i) => `${col} = $${i + 2}`);
      const values = columns.map((col) => updates[col]);

      const result = await queryOne<FamilySettings>(
        `UPDATE family_settings
         SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE family_id = $1
         RETURNING *`,
        [familyId, ...values]
      );

      return result;
    } catch (error) {
      console.error('Failed to update family settings:', error);
      throw error;
    }
  }
}

// Singleton pattern
let familyService: FamilyService;

export function getFamilyService(): FamilyService {
  if (!familyService) {
    familyService = new FamilyService();
  }
  return familyService;
}
