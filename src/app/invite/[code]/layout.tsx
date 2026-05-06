"use client";

import React from 'react';
import { HouseholdProvider } from '@/lib/household-context';

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <HouseholdProvider>
      {children}
    </HouseholdProvider>
  );
}
