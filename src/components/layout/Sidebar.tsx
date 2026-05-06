'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHousehold } from '@/lib/household-context';

export function Sidebar() {
  const pathname = usePathname();
  const { activeHousehold } = useHousehold();

  const navItems = [
    { name: 'Inicio', path: '/dashboard', icon: 'dashboard' },
    { name: 'Mi Hogar', path: '/dashboard/household', icon: 'home' },
    { name: 'Tareas', path: '/dashboard/tasks', icon: 'task_alt' },
    { name: 'Compras', path: '/dashboard/shopping', icon: 'shopping_basket' },
    { name: 'Gastos', path: '/dashboard/expenses', icon: 'payments' },
    { name: 'Inventario', path: '/dashboard/inventory', icon: 'inventory_2' },
    { name: 'Mantenimiento', path: '/dashboard/maintenance', icon: 'home_repair_service' },
  ];

  return (
    <nav className="flex flex-col h-full py-lg px-md gap-sm bg-surface-container-low border-r border-outline-variant shadow-sm w-64 hidden md:flex shrink-0">
      <div className="flex items-center gap-md px-md mb-lg">
        <div className="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container overflow-hidden">
          <span className="material-symbols-outlined">home</span>
        </div>
        <div>
          <div className="font-h3 text-h3 font-bold text-primary truncate max-w-[160px]">{activeHousehold?.name || 'Mi Hogar'}</div>
          <div className="font-label-sm text-label-sm text-on-surface-variant">Panel de Control</div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-unit">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-md px-md py-sm rounded-lg font-label-md text-label-md transition-all duration-150 ${
                isActive 
                  ? 'bg-primary-container text-on-primary-container font-bold' 
                  : 'text-secondary hover:bg-surface-container-highest'
              }`}
            >
              <span 
                className="material-symbols-outlined" 
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </div>
      
      <div className="flex flex-col gap-unit mt-auto pt-md border-t border-outline-variant">
        <Link href="/dashboard/settings" className="flex items-center gap-md px-md py-sm text-secondary hover:bg-surface-container-highest transition-all duration-150 rounded-lg font-label-md text-label-md">
          <span className="material-symbols-outlined">settings</span>
          Configuración
        </Link>
        <Link href="/help" className="flex items-center gap-md px-md py-sm text-secondary hover:bg-surface-container-highest transition-all duration-150 rounded-lg font-label-md text-label-md">
          <span className="material-symbols-outlined">help</span>
          Ayuda
        </Link>
      </div>
    </nav>
  );
}
