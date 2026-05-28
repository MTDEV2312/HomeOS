'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const handleAutoCollapse = (width: number) => {
    const stored = localStorage.getItem('sidebar-collapsed');
    
    // Si la pantalla es mediana o chica (menor a 1200px), forzamos el colapso de la sidebar
    // para priorizar el espacio de lectura y visualización del contenido útil.
    if (width < 1200) {
      setIsCollapsed(true);
    } else if (stored !== null) {
      // En pantallas grandes, respetamos la decisión manual que tomó el usuario
      setIsCollapsed(stored === 'true');
    } else {
      // Por defecto en pantallas grandes, se mantiene expandida
      setIsCollapsed(false);
    }
  };

  // Safe client mounting and auto-responsive setup
  useEffect(() => {
    setIsMounted(true);
    
    handleAutoCollapse(window.innerWidth);

    const handleResize = () => {
      handleAutoCollapse(window.innerWidth);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navItems = [
    { name: 'Inicio', path: '/dashboard', icon: 'dashboard' },
    { name: 'Mi Residencia', path: '/dashboard/household', icon: 'home' },
    { name: 'Miembros', path: '/dashboard/members', icon: 'group' },
    { name: 'Tareas', path: '/dashboard/tasks', icon: 'task_alt' },
    { name: 'Compras', path: '/dashboard/shopping', icon: 'shopping_basket' },
    { name: 'Gastos', path: '/dashboard/expenses', icon: 'payments' },
    { name: 'Inventario', path: '/dashboard/inventory', icon: 'inventory_2' },
    { name: 'Mantenimiento', path: '/dashboard/maintenance', icon: 'home_repair_service' },
    { name: 'Documentos', path: '/dashboard/documents', icon: 'folder' },
  ];

  // Return a shell skeleton during SSR hydration to avoid layout shifts
  if (!isMounted) {
    return (
      <nav className="hidden md:flex flex-col h-full py-lg px-md gap-sm bg-surface-container-low border-r border-outline-variant shadow-sm w-64 shrink-0" />
    );
  }

  return (
    <nav 
      className={`hidden md:flex flex-col h-full py-lg gap-sm bg-surface-container-low border-r border-outline-variant shadow-sm shrink-0 transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'w-[78px] px-sm' : 'w-64 px-md'
      }`}
    >
      {/* Floating Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute top-6 -right-3 w-6 h-6 rounded-full bg-surface border border-outline-variant text-on-surface hover:bg-primary hover:text-white flex items-center justify-center shadow-md z-50 transition-all duration-200 cursor-pointer"
        title={isCollapsed ? "Expandir menú (Ctrl + \\)" : "Contraer menú (Ctrl + \\)"}
      >
        <span className="material-symbols-outlined text-[14px] font-bold">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {/* Header / Brand */}
      <div 
        className={`flex items-center mb-lg transition-all duration-300 overflow-hidden shrink-0 ${
          isCollapsed ? 'justify-center px-0' : 'gap-md px-md'
        }`}
      >
        <div className="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container overflow-hidden p-1 shrink-0">
          <Logo size={40} />
        </div>
        <div 
          className={`flex flex-col transition-all duration-300 origin-left ${
            isCollapsed 
              ? 'w-0 opacity-0 scale-95 overflow-hidden pointer-events-none' 
              : 'w-auto opacity-100 scale-100'
          }`}
        >
          <div className="font-h3 text-h3 font-bold text-primary whitespace-nowrap">HomeOS</div>
          <div className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Panel de Control</div>
        </div>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-unit py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          
          return (
            <Link
              key={item.name}
              href={item.path}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center rounded-lg font-label-md text-label-md transition-all duration-300 group ${
                isCollapsed ? 'justify-center p-sm px-0' : 'gap-md px-md py-sm'
              } ${
                isActive 
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' 
                  : 'text-secondary hover:bg-surface-container-highest hover:text-on-surface'
              }`}
            >
              <span 
                className={`material-symbols-outlined shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'material-symbols-filled' : ''}`}
              >
                {item.icon}
              </span>
              <span 
                className={`transition-all duration-300 origin-left whitespace-nowrap ${
                  isCollapsed 
                    ? 'w-0 opacity-0 scale-95 overflow-hidden pointer-events-none' 
                    : 'w-auto opacity-100 scale-100 ml-1'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Bottom Settings & Help */}
      <div className="flex flex-col gap-unit mt-auto pt-md border-t border-outline-variant shrink-0">
        <Link 
          href="/dashboard/settings" 
          title={isCollapsed ? "Configuración" : undefined}
          className={`flex items-center rounded-lg font-label-md text-label-md transition-all duration-300 group ${
            isCollapsed ? 'justify-center p-sm px-0' : 'gap-md px-md py-sm'
          } ${
            pathname.startsWith('/dashboard/settings')
              ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' 
              : 'text-secondary hover:bg-surface-container-highest hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined shrink-0 transition-transform duration-300 group-hover:scale-110">settings</span>
          <span 
            className={`transition-all duration-300 origin-left whitespace-nowrap ${
              isCollapsed 
                ? 'w-0 opacity-0 scale-95 overflow-hidden pointer-events-none' 
                : 'w-auto opacity-100 scale-100 ml-1'
            }`}
          >
            Configuración
          </span>
        </Link>
        <Link 
          href="/help" 
          title={isCollapsed ? "Ayuda" : undefined}
          className={`flex items-center rounded-lg font-label-md text-label-md transition-all duration-300 group ${
            isCollapsed ? 'justify-center p-sm px-0' : 'gap-md px-md py-sm'
          } ${
            pathname.startsWith('/help')
              ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' 
              : 'text-secondary hover:bg-surface-container-highest hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined shrink-0 transition-transform duration-300 group-hover:scale-110">help</span>
          <span 
            className={`transition-all duration-300 origin-left whitespace-nowrap ${
              isCollapsed 
                ? 'w-0 opacity-0 scale-95 overflow-hidden pointer-events-none' 
                : 'w-auto opacity-100 scale-100 ml-1'
            }`}
          >
            Ayuda
          </span>
        </Link>
      </div>
    </nav>
  );
}
