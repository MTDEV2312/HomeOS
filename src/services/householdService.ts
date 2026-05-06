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

export const joinHousehold = async (inviteCode: string, userId: string): Promise<Household> => {
  const { data: household, error: householdError } = await insforge.database
    .from('households')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .maybeSingle();

  if (householdError) throw householdError;
  if (!household) throw new Error('Código de invitación no válido o hogar no encontrado');

  const { error: memberError } = await insforge.database
    .from('household_members')
    .insert([{ household_id: household.id, user_id: userId, role: 'MEMBER' }]);

  if (memberError) {
    if (memberError.message.includes('unique')) {
        throw new Error('Ya eres miembro de este hogar');
    }
    throw memberError;
  }

  return household as Household;
};

export const getHouseholdMembers = async (householdId: string): Promise<HouseholdMemberDetails[]> => {
  const { data, error } = await insforge.database
    .rpc('get_household_members_details', { h_id: householdId });

  if (error) throw error;
  return data as HouseholdMemberDetails[];
};

export const getUserHouseholds = async (userId: string) => {
  const { data, error } = await insforge.database
    .from('household_members')
    .select('household_id, role, households(*)')
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
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

export const updateHousehold = async (householdId: string, updates: { name?: string }) => {
  const { data, error } = await insforge.database
    .from('households')
    .update(updates)
    .eq('id', householdId)
    .select()
    .single();

  if (error) throw error;
  return data as Household;
};

export const regenerateInviteCode = async (householdId: string) => {
  const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  const { data, error } = await insforge.database
    .from('households')
    .update({ invite_code: newCode })
    .eq('id', householdId)
    .select()
    .single();

  if (error) throw error;
  return data as Household;
};

export const leaveHousehold = async (householdId: string, userId: string) => {
  const { error } = await insforge.database
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userId);

  if (error) throw error;
};
