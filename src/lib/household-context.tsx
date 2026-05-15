"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { getUserHouseholds, Household, HouseholdMember, UserHousehold } from '@/services/householdService';

type ActiveHouseholdContextType = {
  activeHousehold: Household | null;
  activeRole: HouseholdMember['role'] | null;
  householdsList: UserHousehold[];
  isLoadingHousehold: boolean;
  refreshHousehold: () => Promise<void>;
  switchHousehold: (householdId: string) => void;
};

const HouseholdContext = createContext<ActiveHouseholdContextType>({
  activeHousehold: null,
  activeRole: null,
  householdsList: [],
  isLoadingHousehold: true,
  refreshHousehold: async () => {},
  switchHousehold: () => {},
});

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeHousehold, setActiveHousehold] = useState<Household | null>(null);
  const [activeRole, setActiveRole] = useState<HouseholdMember['role'] | null>(null);
  const [householdsList, setHouseholdsList] = useState<UserHousehold[]>([]);
  const [isLoadingHousehold, setIsLoadingHousehold] = useState(true);

  const refreshHousehold = useCallback(async () => {
    if (!user) {
      setActiveHousehold(null);
      setActiveRole(null);
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
    } catch (error) {
      console.error("Error loading household context", error);
      setActiveHousehold(null);
      setActiveRole(null);
    } finally {
      setIsLoadingHousehold(false);
    }
  }, [user]);

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
  }, [refreshHousehold]);

  return (
    <HouseholdContext.Provider value={{ activeHousehold, activeRole, householdsList, isLoadingHousehold, refreshHousehold, switchHousehold }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  return useContext(HouseholdContext);
}
