import { supabase } from '@/lib/supabase';

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

  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert([{ name, invite_code: inviteCode, owner_id: userId }])
    .select()
    .single();

  if (householdError) throw householdError;

  const { error: memberError } = await supabase
    .from('household_members')
    .insert([{ household_id: household.id, user_id: userId, role: 'OWNER' }]);

  if (memberError) throw memberError;

  return household as Household;
};

export const joinHousehold = async (inviteCode: string): Promise<Household> => {
  const { data, error } = await supabase
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

export const getHouseholdMembers = async (householdId: string): Promise<HouseholdMemberDetails[]> => {
  const { data, error } = await supabase
    .rpc('get_household_members_details', { h_id: householdId });

  if (error) throw error;
  return (data || []) as HouseholdMemberDetails[];
};

export const getUserHouseholds = async (userId: string): Promise<UserHousehold[]> => {
  const { data, error } = await supabase
    .from('household_members')
    .select('household_id, role, households(*)')
    .eq('user_id', userId);

  if (error) throw error;
  const normalized = (data || [])
    .map((item: { household_id: string; role: HouseholdMember['role']; households: Household | Household[] | null }) => {
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
    .filter((item): item is UserHousehold => Boolean(item));

  return normalized;
};

export const updateHousehold = async (householdId: string, updates: { name?: string }): Promise<Household> => {
  const { data, error } = await supabase
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
  const { error } = await supabase
    .from('households')
    .update({ invite_code: newCode })
    .eq('id', householdId);

  if (error) throw error;
  return newCode;
};

export const removeMember = async (householdId: string, userIdToRemove: string) => {
  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userIdToRemove);

  if (error) throw error;
};

export const updateMemberRole = async (householdId: string, userIdToUpdate: string, newRole: 'ADMIN' | 'MEMBER') => {
  const { error } = await supabase
    .from('household_members')
    .update({ role: newRole })
    .eq('household_id', householdId)
    .eq('user_id', userIdToUpdate);

  if (error) throw error;
};

export const leaveHousehold = async (householdId: string, userId: string) => {
  const { data: membership, error: checkError } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', userId)
    .single();

  if (checkError) throw checkError;
  if (membership?.role === 'OWNER') {
    throw new Error('El propietario no puede abandonar el hogar. Debés transferir la propiedad o eliminar el hogar primero.');
  }

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userId);

  if (error) throw error;
};

export const deleteHousehold = async (householdId: string): Promise<void> => {
  const { data: members, error: membersError } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', householdId);

  if (membersError) throw membersError;

  if (members && members.length > 1) {
    throw new Error('No se puede eliminar el hogar porque aún tiene otros miembros. Debés expulsarlos primero.');
  }

  const { error } = await supabase
    .from('households')
    .delete()
    .eq('id', householdId);

  if (error) throw error;
};

export const getHouseholdByInviteCode = async (inviteCode: string): Promise<Household | null> => {
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return data as Household | null;
};
