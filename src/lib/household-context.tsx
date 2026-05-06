"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { getUserHouseholds } from '@/services/householdService';

type ActiveHouseholdContextType = {
  activeHousehold: any | null;
  activeRole: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  householdsList: any[];
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
  const [activeHousehold, setActiveHousehold] = useState<any | null>(null);
  const [activeRole, setActiveRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER' | null>(null);
  const [householdsList, setHouseholdsList] = useState<any[]>([]);
  const [isLoadingHousehold, setIsLoadingHousehold] = useState(true);

  const refreshHousehold = async () => {
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
        let selected = households.find((h: any) => h.households.id === storedId);
        
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
  };

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
  }, [user]);

  return (
    <HouseholdContext.Provider value={{ activeHousehold, activeRole, householdsList, isLoadingHousehold, refreshHousehold, switchHousehold }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  return useContext(HouseholdContext);
}
