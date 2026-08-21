import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

interface FamilyMember {
  id: string;
  user_id: string;
  family_id: string;
  role: string;
  joined_at: string;
}

interface Family {
  id: string;
  name: string;
  description?: string;
  created_by_id: string;
  members?: FamilyMember[];
  member_count?: number;
}

interface FamilySettings {
  family_id: string;
  theme: string;
  language: string;
  notifications_enabled: boolean;
  max_screen_time_minutes?: number;
}

interface UseFamilyReturn {
  family: Family | null;
  members: FamilyMember[];
  settings: FamilySettings | null;
  loading: boolean;
  error: string | null;
  inviteMember: (email: string, role: string) => Promise<string>;
  updateMemberRole: (memberId: string, role: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateSettings: (settings: Partial<FamilySettings>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useFamily(): UseFamilyReturn {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [settings, setSettings] = useState<FamilySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFamily = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) return;

      const [familyResponse, membersResponse, settingsResponse] = await Promise.all([
        apiClient.get('/family', { headers: { 'x-user-id': user.id } }),
        apiClient.get('/family/members', { headers: { 'x-user-id': user.id } }),
        apiClient.get('/family/settings', { headers: { 'x-user-id': user.id } }),
      ]);

      setFamily(familyResponse.data || null);
      setMembers(membersResponse.data || []);
      setSettings(settingsResponse.data || null);
    } catch (err: any) {
      console.error('Failed to fetch family:', err);
      setError(err.message || 'Failed to fetch family');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamily();
  }, [user?.id]);

  const inviteMember = async (email: string, role: string): Promise<string> => {
    if (!user?.id) throw new Error('User not authenticated');

    const response = await apiClient.post(
      '/family/members/invite',
      { email, role },
      { headers: { 'x-user-id': user.id } },
    );

    return response.data?.invite_token || '';
  };

  const updateMemberRole = async (memberId: string, role: string): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    await apiClient.patch(
      `/family/members/${memberId}/role`,
      { role },
      { headers: { 'x-user-id': user.id } },
    );

    setMembers((prev) =>
      prev.map((m) => (m.user_id === memberId ? { ...m, role } : m)),
    );
  };

  const removeMember = async (memberId: string): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    await apiClient.delete(`/family/members/${memberId}`, {
      headers: { 'x-user-id': user.id },
    });

    setMembers((prev) => prev.filter((m) => m.user_id !== memberId));
  };

  const updateSettings = async (newSettings: Partial<FamilySettings>): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    const response = await apiClient.patch(
      '/family/settings',
      newSettings,
      { headers: { 'x-user-id': user.id } },
    );

    setSettings(response.data || null);
  };

  return {
    family,
    members,
    settings,
    loading,
    error,
    inviteMember,
    updateMemberRole,
    removeMember,
    updateSettings,
    refresh: fetchFamily,
  };
}
