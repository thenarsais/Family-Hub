import { useState, useEffect } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient, type ApiEnvelope } from '../services/api';
import { useAuth } from './useAuth';

type FamilyMember = components['schemas']['FamilyMember'];
type Family = components['schemas']['Family'];
type FamilySettings = components['schemas']['FamilySettings'];
type FamilySettingsUpdate = components['schemas']['FamilySettingsUpdatable'];

interface UseFamilyReturn {
  family: Family | null;
  members: FamilyMember[];
  settings: FamilySettings | null;
  loading: boolean;
  error: string | null;
  inviteMember: (email: string, role: FamilyMember["role"]) => Promise<string>;
  updateMemberRole: (memberId: string, role: FamilyMember["role"]) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateSettings: (settings: FamilySettingsUpdate) => Promise<void>;
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
        apiClient.get<ApiEnvelope<Family>>('/api/family', { headers: { 'x-user-id': user.id } }),
        apiClient.get<ApiEnvelope<FamilyMember[]>>('/api/family/members', { headers: { 'x-user-id': user.id } }),
        apiClient.get<ApiEnvelope<FamilySettings>>('/api/family/settings', { headers: { 'x-user-id': user.id } }),
      ]);

      setFamily(familyResponse.data?.data || null);
      setMembers(membersResponse.data?.data || []);
      setSettings(settingsResponse.data?.data || null);
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

  const inviteMember = async (email: string, role: FamilyMember["role"]): Promise<string> => {
    if (!user?.id) throw new Error('User not authenticated');

    const response = await apiClient.post<ApiEnvelope<{ invite_token?: string }>>(
      '/api/family/members/invite',
      { email, role },
      { headers: { 'x-user-id': user.id } },
    );

    return response.data?.data?.invite_token || '';
  };

  const updateMemberRole = async (memberId: string, role: FamilyMember["role"]): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    await apiClient.patch(
      `/api/family/members/${memberId}/role`,
      { role },
      { headers: { 'x-user-id': user.id } },
    );

    setMembers((prev) =>
      prev.map((m) => (m.user_id === memberId ? { ...m, role } : m)),
    );
  };

  const removeMember = async (memberId: string): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    await apiClient.delete(`/api/family/members/${memberId}`, {
      headers: { 'x-user-id': user.id },
    });

    setMembers((prev) => prev.filter((m) => m.user_id !== memberId));
  };

  const updateSettings = async (newSettings: FamilySettingsUpdate): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    const response = await apiClient.patch<ApiEnvelope<FamilySettings>>(
      '/api/family/settings',
      newSettings,
      { headers: { 'x-user-id': user.id } },
    );

    setSettings(response.data?.data || null);
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
