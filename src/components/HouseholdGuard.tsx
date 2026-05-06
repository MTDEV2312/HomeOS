"use client";

import { useHousehold } from '@/lib/household-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function HouseholdGuard({ children }: { children: React.ReactNode }) {
  const { activeHousehold, isLoadingHousehold } = useHousehold();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoadingHousehold && !activeHousehold && pathname !== '/household-setup' && pathname !== '/dashboard/settings') {
      router.push('/household-setup');
    }
  }, [activeHousehold, isLoadingHousehold, router, pathname]);

  if (isLoadingHousehold) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-dim">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-on-surface-variant font-body-md">Cargando hogar...</p>
      </div>
    );
  }

  if (!activeHousehold && pathname !== '/household-setup' && pathname !== '/dashboard/settings') {
    return null;
  }

  return <>{children}</>;
}
