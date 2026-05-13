'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Inicio', path: '/dashboard', icon: 'dashboard' },
    { name: 'Hogar', path: '/dashboard/household', icon: 'home' },
    { name: 'Miembros', path: '/dashboard/members', icon: 'group' },
    { name: 'Tareas', path: '/dashboard/tasks', icon: 'task_alt' },
    { name: 'Compras', path: '/dashboard/shopping', icon: 'shopping_basket' },
    { name: 'Gastos', path: '/dashboard/expenses', icon: 'payments' },
    { name: 'Inventario', path: '/dashboard/inventory', icon: 'inventory_2' },
    { name: 'Mantenim.', path: '/dashboard/maintenance', icon: 'build' },
    { name: 'Docs', path: '/dashboard/documents', icon: 'folder' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 safe-area-bottom">
      <div 
        className="flex overflow-x-auto px-1 py-1 gap-0.5"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(`${item.path}/`));
          
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl shrink-0 transition-all duration-200 min-w-[48px] ${
                isActive 
                  ? 'text-primary' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <div className={`flex items-center justify-center w-9 h-6 rounded-full mb-0.5 transition-colors ${isActive ? 'bg-primary-container' : 'bg-transparent'}`}>
                <span 
                  className="material-symbols-outlined text-[18px]" 
                  style={isActive ? { fontVariationSettings: "'FILL' 1", color: 'var(--md-sys-color-on-primary-container)' } : {}}
                >
                  {item.icon}
                </span>
              </div>
              <span className={`text-[8px] font-medium tracking-wide leading-tight ${isActive ? 'font-bold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
