import { insforge } from '@/lib/insforge';

export type Household = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joined_at: string;
};

export type HouseholdMemberDetails = {
  member_id: string;
  user_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joined_at: string;
  email: string;
  name: string;
  avatar_url?: string | null;
};

export type UserHousehold = {
  household_id: string;
  role: HouseholdMember['role'];
  households: Household;
};

export const createHousehold = async (name: string, userId: string): Promise<Household> => {
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const { data: household, error: householdError } = await insforge.database
    .from('households')
    .insert([{ name, invite_code: inviteCode, owner_id: userId }])
    .select()
    .single();

  if (householdError) throw householdError;

  const { error: memberError } = await insforge.database
    .from('household_members')
    .insert([{ household_id: household.id, user_id: userId, role: 'OWNER' }]);

  if (memberError) throw memberError;

  return household as Household;
};

export const joinHousehold = async (inviteCode: string): Promise<Household> => {
  const { data, error } = await insforge.database
    .rpc('join_household_by_invite_code', { code: inviteCode.toUpperCase() });

  if (error) {
    if (error.message.includes('Ya sos miembro')) {
      throw new Error('Ya sos miembro de este hogar');
    }
    if (error.message.includes('no válido')) {
      throw new Error('Código de invitación no válido o hogar no encontrado');
    }
    throw error;
  }

  return data as Household;
};

const avatarCache = new Map<string, string | null>();

export const invalidateAvatarCache = (userId?: string) => {
  if (userId) {
    avatarCache.delete(userId);
  } else {
    avatarCache.clear();
  }
};

export const getHouseholdMembers = async (householdId: string): Promise<HouseholdMemberDetails[]> => {
  const { data, error } = await insforge.database
    .rpc('get_household_members_details', { h_id: householdId });

  if (error) throw error;
  const rawMembers = (data || []) as HouseholdMemberDetails[];

  if (rawMembers.length === 0) {
    return [];
  }

  const members = rawMembers.map((m) => ({ ...m }));
  const missingUserIds: string[] = [];

  for (const m of members) {
    if (m.avatar_url) {
      avatarCache.set(m.user_id, m.avatar_url);
    } else if (avatarCache.has(m.user_id)) {
      m.avatar_url = avatarCache.get(m.user_id) || null;
    } else if (m.user_id) {
      missingUserIds.push(m.user_id);
    }
  }

  const uniqueMissingIds = Array.from(new Set(missingUserIds));

  if (uniqueMissingIds.length > 0) {
    try {
      const results = await Promise.allSettled(
        uniqueMissingIds.map((userId) => insforge.auth.getProfile(userId))
      );

      results.forEach((res, index) => {
        const userId = uniqueMissingIds[index];
        if (res.status === 'fulfilled' && !res.value.error && res.value.data?.profile) {
          const avatarUrl = res.value.data.profile.avatar_url ?? null;
          avatarCache.set(userId, avatarUrl);
        } else {
          avatarCache.set(userId, null);
        }
      });

      for (const m of members) {
        if (!m.avatar_url && avatarCache.has(m.user_id)) {
          m.avatar_url = avatarCache.get(m.user_id) || null;
        }
      }
    } catch (enrichError) {
      console.warn('Could not enrich household members with auth profiles:', enrichError);
    }
  }

  return members;
};

export const getUserHouseholds = async (userId: string): Promise<UserHousehold[]> => {
  const { data, error } = await insforge.database
    .from('household_members')
    .select('household_id, role, households(*)')
    .eq('user_id', userId);
    
  if (error) throw error;
  const normalized = (data || [])
    .map((item: any) => {
      const household = Array.isArray(item.households)
        ? item.households[0]
        : item.households;

      if (!household) return null;

      return {
        household_id: item.household_id,
        role: item.role,
        households: household as Household,
      };
    })
    .filter((item: any): item is UserHousehold => Boolean(item));

  return normalized;
};

export const updateHousehold = async (householdId: string, updates: { name?: string }): Promise<Household> => {
  const { data, error } = await insforge.database
    .from('households')
    .update(updates)
    .eq('id', householdId)
    .select()
    .single();

  if (error) throw error;
  return data as Household;
};

export const regenerateInviteCode = async (householdId: string): Promise<string> => {
  const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  const { error } = await insforge.database
    .from('households')
    .update({ invite_code: newCode })
    .eq('id', householdId);

  if (error) throw error;
  return newCode;
};

export const removeMember = async (householdId: string, userIdToRemove: string) => {
  const { error } = await insforge.database
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userIdToRemove);

  if (error) throw error;
};

export const updateMemberRole = async (householdId: string, userIdToUpdate: string, newRole: 'ADMIN' | 'MEMBER') => {
  const { error } = await insforge.database
    .from('household_members')
    .update({ role: newRole })
    .eq('household_id', householdId)
    .eq('user_id', userIdToUpdate);

  if (error) throw error;
};

export const leaveHousehold = async (householdId: string, userId: string) => {
  // Verify user is not the owner (owners can't leave, they must transfer or delete)
  const { data: membership, error: checkError } = await insforge.database
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', userId)
    .single();

  if (checkError) throw checkError;
  if (membership?.role === 'OWNER') {
    throw new Error('El propietario no puede abandonar el hogar. Debés transferir la propiedad o eliminar el hogar primero.');
  }

  const { error } = await insforge.database
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userId);

  if (error) throw error;
};

export const deleteHousehold = async (householdId: string): Promise<void> => {
  // Verify that the household has no other members before deleting.
  const { data: members, error: membersError } = await insforge.database
    .from('household_members')
    .select('id')
    .eq('household_id', householdId);

  if (membersError) throw membersError;

  if (members && members.length > 1) {
    throw new Error('No se puede eliminar el hogar porque aún tiene otros miembros. Debés expulsarlos primero.');
  }

  const { error } = await insforge.database
    .from('households')
    .delete()
    .eq('id', householdId);

  if (error) throw error;
};

export const getHouseholdByInviteCode = async (inviteCode: string): Promise<Household | null> => {
  const { data, error } = await insforge.database
    .from('households')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return data as Household | null;
};
