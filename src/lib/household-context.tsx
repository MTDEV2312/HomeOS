"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import {
  getHouseholdMembers,
  getUserHouseholds,
  Household,
  HouseholdMember,
  HouseholdMemberDetails,
  UserHousehold,
} from '@/services/householdService';

type ActiveHouseholdContextType = {
  activeHousehold: Household | null;
  activeRole: HouseholdMember['role'] | null;
  householdsList: UserHousehold[];
  isLoadingHousehold: boolean;
  refreshHousehold: () => Promise<void>;
  switchHousehold: (householdId: string) => void;
  // Household members
  members: HouseholdMemberDetails[];
  isLoadingMembers: boolean;
  refreshMembers: () => Promise<void>;
  // Aliases for compatibility
  currentHousehold: Household | null;
  households: UserHousehold[];
  setCurrentHousehold?: (h: Household | null) => void;
  refreshHouseholds: () => Promise<void>;
};

const HouseholdContext = createContext<ActiveHouseholdContextType>({
  activeHousehold: null,
  activeRole: null,
  householdsList: [],
  isLoadingHousehold: true,
  refreshHousehold: async () => {},
  switchHousehold: () => {},
  members: [],
  isLoadingMembers: false,
  refreshMembers: async () => {},
  currentHousehold: null,
  households: [],
  refreshHouseholds: async () => {},
});

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [activeHousehold, setActiveHousehold] = useState<Household | null>(null);
  const [activeRole, setActiveRole] = useState<HouseholdMember['role'] | null>(null);
  const [householdsList, setHouseholdsList] = useState<UserHousehold[]>([]);
  const [isLoadingHousehold, setIsLoadingHousehold] = useState(true);
  const [members, setMembers] = useState<HouseholdMemberDetails[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const refreshHousehold = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setActiveHousehold(null);
      setActiveRole(null);
      setHouseholdsList([]);
      setIsLoadingHousehold(false);
      return;
    }

    try {
      setIsLoadingHousehold(true);
      const households = await getUserHouseholds(user.id);
      if (households && households.length > 0) {
        setHouseholdsList(households);
        
        // Check if there's a stored preference
        const storedId = localStorage.getItem('homeos-active-household');
        let selected = households.find((h) => h.households.id === storedId);
        
        if (!selected) {
          selected = households[0];
        }
        
        setActiveHousehold(selected.households);
        setActiveRole(selected.role);
        if (selected.households.id !== storedId) {
          localStorage.setItem('homeos-active-household', selected.households.id);
        }
      } else {
        setHouseholdsList([]);
        setActiveHousehold(null);
        setActiveRole(null);
        localStorage.removeItem('homeos-active-household');
      }
    } catch {
      setActiveHousehold(null);
      setActiveRole(null);
    } finally {
      setIsLoadingHousehold(false);
    }
  }, [user, authLoading]);

  const activeHouseholdId = activeHousehold?.id;

  const refreshMembers = useCallback(async () => {
    if (!activeHouseholdId) {
      setMembers([]);
      return;
    }

    try {
      setIsLoadingMembers(true);
      const data = await getHouseholdMembers(activeHouseholdId, user?.id);
      if (user?.id && user.profile?.avatar_url) {
        setMembers(data.map(m => m.user_id === user.id ? { ...m, avatar_url: (user.profile.avatar_url as string) || m.avatar_url } : m));
      } else {
        setMembers(data);
      }
    } catch (err) {
      console.error('Failed to load household members:', err);
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [activeHouseholdId, user]);

  const switchHousehold = (householdId: string) => {
    const selected = householdsList.find(h => h.households.id === householdId);
    if (selected) {
      setActiveHousehold(selected.households);
      setActiveRole(selected.role);
      localStorage.setItem('homeos-active-household', householdId);
    }
  };

  useEffect(() => {
    refreshHousehold();
  }, [refreshHousehold, authLoading]);

  useEffect(() => {
    if (activeHousehold?.id) {
      refreshMembers();
    } else {
      setMembers([]);
    }
  }, [activeHousehold?.id, refreshMembers]);

  return (
    <HouseholdContext.Provider
      value={{
        activeHousehold,
        activeRole,
        householdsList,
        isLoadingHousehold,
        refreshHousehold,
        switchHousehold,
        members,
        isLoadingMembers,
        refreshMembers,
        currentHousehold: activeHousehold,
        households: householdsList,
        setCurrentHousehold: setActiveHousehold,
        refreshHouseholds: refreshHousehold,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  return useContext(HouseholdContext);
}
