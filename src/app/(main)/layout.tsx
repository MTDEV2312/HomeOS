import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import HouseholdGuard from '@/components/HouseholdGuard';
import { HouseholdProvider } from '@/lib/household-context';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <HouseholdProvider>
        <HouseholdGuard>
          <div className="min-h-screen flex flex-col bg-background text-on-background">
            <Topbar />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto bg-surface p-xl">
                <div className="max-w-[1440px] mx-auto flex flex-col gap-xl">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </HouseholdGuard>
      </HouseholdProvider>
    </ProtectedRoute>
  );
}
