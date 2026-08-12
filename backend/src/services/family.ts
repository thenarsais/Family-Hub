import { getSupabase } from './supabase'
import type { Database } from '../types/database';

import crypto from 'crypto';

export type Family = Database['public']['Tables']['families']['Row'];
export type FamilyMember = Database['public']['Tables']['family_members']['Row'];
export type FamilySettings = Database['public']['Tables']['family_settings']['Row'];

interface FamilyWithMembers extends Family {
  member_count: number;
  members: FamilyMember[];
}

class FamilyService {
  /**
   * Get user's family
   */
  async getUserFamily(userId: string): Promise<FamilyWithMembers | null> {
    try {
      // Get user's family
      const { data: familyMember } = await getSupabase()
        .from('family_members')
        .select('family_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!familyMember) {
        return null;
      }

      // Get family details
      const { data: family } = await getSupabase()
        .from('families')
        .select('*')
        .eq('id', familyMember.family_id)
        .single();

      if (!family) {
        return null;
      }

      // Get all family members
      const { data: members } = await getSupabase()
        .from('family_members')
        .select('*')
        .eq('family_id', family.id)
        .eq('is_active', true);

      return {
        ...family,
        member_count: members?.length || 0,
        members: members || [],
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
  ): Promise<any> {
    try {
      const { data: family, error } = await getSupabase()
        .from('families')
        .insert({
          name: data.name,
          description: data.description,
          created_by_id: createdById,
          max_children: data.max_children || 5,
          max_parents: data.max_parents || 2,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await getSupabase()
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: createdById,
          role: 'admin',
          invited_by_id: null,
        });

      // Create default settings for family
      await getSupabase()
        .from('family_settings')
        .insert({
          family_id: family.id,
          theme: 'light',
          language: 'en',
          timezone: 'America/New_York',
        });

      return family;
    } catch (error) {
      console.error('Failed to create family:', error);
      throw error;
    }
  }

  /**
   * Get family members
   */
  async getFamilyMembers(familyId: string): Promise<any[]> {
    try {
      const { data, error } = await getSupabase()
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('role', { ascending: true });

      if (error) throw error;
      return data || [];
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
      // Generate unique invite token
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const { data, error } = await getSupabase()
        .from('family_invitations')
        .insert({
          family_id: familyId,
          invited_email: email,
          inviting_parent_id: invitedByUserId,
          role,
          invite_token: inviteToken,
          expires_at: expiresAt.toISOString(),
        })
        .select('invite_token')
        .single();

      if (error) throw error;

      return inviteToken;
    } catch (error) {
      console.error('Failed to invite family member:', error);
      throw error;
    }
  }

  /**
   * Accept family invitation
   */
  async acceptInvitation(inviteToken: string, userId: string): Promise<any> {
    try {
      // Get invitation
      const { data: invitation, error: inviteError } = await getSupabase()
        .from('family_invitations')
        .select('*')
        .eq('invite_token', inviteToken)
        .single();

      if (inviteError) throw inviteError;

      if (!invitation) {
        throw new Error('Invalid or expired invitation');
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation expired');
      }

      // Add member to family
      const { data: member, error: memberError } = await getSupabase()
        .from('family_members')
        .insert({
          family_id: invitation.family_id,
          user_id: userId,
          role: invitation.role,
          invited_by_id: invitation.inviting_parent_id,
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // Mark invitation as accepted
      await getSupabase()
        .from('family_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('invite_token', inviteToken);

      return member;
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    familyId: string,
    memberId: string,
    newRole: string,
  ): Promise<any> {
    try {
      const { data, error } = await getSupabase()
        .from('family_members')
        .update({ role: newRole })
        .eq('family_id', familyId)
        .eq('user_id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update member role:', error);
      throw error;
    }
  }

  /**
   * Remove member from family
   */
  async removeMember(familyId: string, memberId: string): Promise<void> {
    try {
      const { error } = await getSupabase()
        .from('family_members')
        .update({ is_active: false })
        .eq('family_id', familyId)
        .eq('user_id', memberId);

      if (error) throw error;
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
      const { data, error } = await getSupabase()
        .from('family_settings')
        .select('*')
        .eq('family_id', familyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get family settings:', error);
      throw error;
    }
  }

  /**
   * Update family settings
   */
  async updateFamilySettings(familyId: string, updates: any): Promise<any> {
    try {
      const { data, error } = await getSupabase()
        .from('family_settings')
        .update(updates)
        .eq('family_id', familyId)
        .select()
        .single();

      if (error) throw error;
      return data;
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




