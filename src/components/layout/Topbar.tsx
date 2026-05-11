'use client';
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useHousehold } from '@/lib/household-context';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Home, PlusCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';

export function Topbar() {
  const { user, signOut } = useAuth();
  const { activeHousehold, householdsList, switchHousehold } = useHousehold();
  const router = useRouter();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [householdDropdownOpen, setHouseholdDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="flex justify-between items-center h-16 px-md w-full bg-surface-container-lowest border-b border-outline-variant shadow-sm z-40 shrink-0 relative">
      <div className="flex items-center gap-md">
        <div className="w-8 h-8 hidden md:block relative text-primary">
          <Logo size={32} />
        </div>
        <span className="font-h3 text-h3 font-bold text-primary hidden md:block mr-2">HomeOS</span>
        
        {/* Household Switcher */}
        {activeHousehold && (
          <div className="relative">
            <button 
              onClick={() => {
                setHouseholdDropdownOpen(!householdDropdownOpen);
                setUserDropdownOpen(false);
              }}
              className="flex items-center gap-2 hover:bg-surface-container-high rounded-lg px-3 py-1.5 transition-colors border border-outline-variant bg-surface"
            >
              <Home className="w-4 h-4 text-primary" />
              <span className="font-label-md text-label-md text-on-surface max-w-[120px] md:max-w-[200px] truncate">
                {activeHousehold.name}
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
            </button>
            
            {householdDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant overflow-hidden z-50">
                <div className="px-4 py-2 border-b border-outline-variant bg-surface-container-low">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Mis Hogares</p>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {householdsList.map((h) => (
                    <button
                      key={h.households.id}
                      onClick={() => {
                        switchHousehold(h.households.id);
                        setHouseholdDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 font-body-md text-body-md transition-colors flex items-center justify-between
                        ${activeHousehold.id === h.households.id 
                          ? 'bg-primary-container text-on-primary-container' 
                          : 'text-on-surface hover:bg-surface-container-high'}`}
                    >
                      <span className="truncate">{h.households.name}</span>
                      {activeHousehold.id === h.households.id && (
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-outline-variant p-2">
                  <button
                    onClick={() => {
                      setHouseholdDropdownOpen(false);
                      router.push('/household-setup');
                    }}
                    className="w-full text-left px-2 py-2 font-label-md text-label-md text-primary hover:bg-primary-container/50 rounded transition-colors flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Crear o unirse a otro
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <ThemeToggle />
      </div>
      <div className="flex items-center gap-md">
        <div className="relative hidden md:block">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="pl-xl pr-md py-sm rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant w-64"
            placeholder="Buscar..."
            type="text"
          />
        </div>
        <button className="p-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors duration-200 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="relative">
          <button 
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setHouseholdDropdownOpen(false);
            }}
            className="flex items-center gap-2 hover:bg-surface-container-high rounded-full pl-2 pr-4 py-1 transition-colors border border-transparent hover:border-outline-variant"
          >
            <div className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden border border-outline-variant flex items-center justify-center font-bold text-primary shrink-0">
              {user?.profile?.name ? (user.profile.name as string).charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
            </div>
            <span className="font-label-sm text-label-sm text-on-surface hidden md:block max-w-[100px] truncate">
              {user?.profile?.name || user?.email?.split('@')[0]}
            </span>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
          </button>
          
          {userDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
                <p className="font-label-sm text-label-sm text-on-surface truncate">{user?.profile?.name || 'Usuario'}</p>
                <p className="font-body-md text-[12px] text-on-surface-variant truncate">{user?.email}</p>
              </div>
              <button 
                onClick={() => {
                  setUserDropdownOpen(false);
                  router.push('/dashboard/settings');
                }}
                className="w-full text-left px-4 py-3 font-label-sm text-label-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                Configuración
              </button>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 font-label-sm text-label-sm text-error hover:bg-error/10 transition-colors flex items-center gap-2 border-t border-outline-variant"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
