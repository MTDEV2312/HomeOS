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

export interface CachedAvatar {
  url: string | null;
  timestamp: number;
}

export const AVATAR_CACHE_KEY = 'homeos_avatar_cache_v1';
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const avatarMemoryCache = new Map<string, CachedAvatar>();
const inFlightAvatarRequests = new Map<string, Promise<string | null>>();

function getSessionStorageMap(): Record<string, CachedAvatar> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(AVATAR_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CachedAvatar>;
  } catch {
    return {};
  }
}

function setSessionStorageMap(map: Record<string, CachedAvatar>): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export const getCachedAvatar = (userId: string): { hit: boolean; url: string | null } => {
  const now = Date.now();

  // Tier 1: In-memory cache
  const mem = avatarMemoryCache.get(userId);
  if (mem) {
    if (now - mem.timestamp < CACHE_TTL_MS) {
      return { hit: true, url: mem.url };
    }
    avatarMemoryCache.delete(userId);
  }

  // Tier 2: sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const sessionMap = getSessionStorageMap();
      const sessionItem = sessionMap[userId];
      if (sessionItem) {
        if (now - sessionItem.timestamp < CACHE_TTL_MS) {
          avatarMemoryCache.set(userId, sessionItem);
          return { hit: true, url: sessionItem.url };
        }
        delete sessionMap[userId];
        setSessionStorageMap(sessionMap);
      }
    } catch {
      // Ignore sessionStorage read errors
    }
  }

  return { hit: false, url: null };
};

export const setCachedAvatar = (userId: string, url: string | null): void => {
  const item: CachedAvatar = {
    url,
    timestamp: Date.now(),
  };
  avatarMemoryCache.set(userId, item);

  if (typeof window !== 'undefined') {
    try {
      const map = getSessionStorageMap();
      map[userId] = item;
      setSessionStorageMap(map);
    } catch {
      // Ignore sessionStorage write errors
    }
  }
};

export const invalidateAvatarCache = (userId?: string): void => {
  if (userId) {
    avatarMemoryCache.delete(userId);
    inFlightAvatarRequests.delete(userId);
    if (typeof window !== 'undefined') {
      try {
        const map = getSessionStorageMap();
        if (userId in map) {
          delete map[userId];
          setSessionStorageMap(map);
        }
      } catch {
        // Ignore sessionStorage write errors
      }
    }
  } else {
    avatarMemoryCache.clear();
    inFlightAvatarRequests.clear();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(AVATAR_CACHE_KEY);
      } catch {
        // Ignore sessionStorage errors
      }
    }
  }
};

export const fetchUserAvatarWithDeduplication = async (userId: string): Promise<string | null> => {
  const cached = getCachedAvatar(userId);
  if (cached.hit) {
    return cached.url;
  }

  const existingRequest = inFlightAvatarRequests.get(userId);
  if (existingRequest) {
    return existingRequest;
  }

  const promise = (async (): Promise<string | null> => {
    try {
      const { data, error } = await insforge.auth.getProfile(userId);
      if (error) {
        setCachedAvatar(userId, null);
        return null;
      }
      const rawData = data as unknown as {
        profile?: { avatar_url?: string | null };
        avatar_url?: string | null;
      };
      const avatarUrl = rawData?.profile?.avatar_url || rawData?.avatar_url || null;
      setCachedAvatar(userId, avatarUrl);
      return avatarUrl;
    } catch {
      setCachedAvatar(userId, null);
      return null;
    } finally {
      inFlightAvatarRequests.delete(userId);
    }
  })();

  inFlightAvatarRequests.set(userId, promise);
  return promise;
};

export const getHouseholdMembers = async (
  householdId: string,
  currentUserId?: string
): Promise<HouseholdMemberDetails[]> => {
  const { data, error } = await insforge.database
    .rpc('get_household_members_details', { h_id: householdId });

  if (error) throw error;
  const rawMembers = (data || []) as HouseholdMemberDetails[];

  if (rawMembers.length === 0) {
    return [];
  }

  const members: HouseholdMemberDetails[] = rawMembers.map((m) => ({ ...m }));
  const uncachedUserIds = new Set<string>();

  for (const m of members) {
    // 1. If avatar_url is already returned by DB RPC, store in cache and keep
    if (m.avatar_url) {
      setCachedAvatar(m.user_id, m.avatar_url);
      continue;
    }

    // 2. If current user, skip fetching
    if (currentUserId && m.user_id === currentUserId) {
      const cached = getCachedAvatar(m.user_id);
      if (cached.hit) {
        m.avatar_url = cached.url;
      }
      continue;
    }

    // 3. Check multi-tier cache (including null negative cache hits)
    const cached = getCachedAvatar(m.user_id);
    if (cached.hit) {
      m.avatar_url = cached.url;
    } else {
      // 4. Otherwise, queue for parallel fetch
      uncachedUserIds.add(m.user_id);
    }
  }

  // Fetch uncached members in parallel via Promise.allSettled
  if (uncachedUserIds.size > 0) {
    const uniqueIds = Array.from(uncachedUserIds);
    const results = await Promise.allSettled(
      uniqueIds.map((id) => fetchUserAvatarWithDeduplication(id))
    );

    const resolvedMap = new Map<string, string | null>();
    results.forEach((res, index) => {
      const id = uniqueIds[index];
      if (res.status === 'fulfilled') {
        resolvedMap.set(id, res.value);
      } else {
        resolvedMap.set(id, null);
      }
    });

    for (const m of members) {
      if (resolvedMap.has(m.user_id)) {
        m.avatar_url = resolvedMap.get(m.user_id) ?? null;
      }
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

  type RawHouseholdRow = {
    household_id: string;
    role: HouseholdMember['role'];
    households: Household | Household[] | null;
  };

  const normalized = ((data as unknown as RawHouseholdRow[]) || [])
    .map((item) => {
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
