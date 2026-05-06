"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  LayoutDashboard, 
  CheckSquare, 
  ShoppingCart, 
  Wallet, 
  Package, 
  Wrench, 
  FileText, 
  Settings, 
  LogOut,
  Home,
  ChevronRight,
  Users
} from 'lucide-react';

const mainNav = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
];

const moduleNav = [
  { name: 'Tareas', href: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Compras', href: '/dashboard/shopping', icon: ShoppingCart },
  { name: 'Gastos', href: '/dashboard/expenses', icon: Wallet },
  { name: 'Inventario', href: '/dashboard/inventory', icon: Package },
  { name: 'Mantenimiento', href: '/dashboard/maintenance', icon: Wrench },
  { name: 'Documentos', href: '/dashboard/documents', icon: FileText },
];

const systemNav = [
  { name: 'Miembros', href: '/dashboard/members', icon: Users },
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const displayName = user?.profile?.name || user?.email?.split('@')[0] || 'Usuario';
  const initials = displayName.charAt(0).toUpperCase();

  const renderNavItems = (items: typeof mainNav) =>
    items.map((item) => (
      <Link
        key={item.name}
        href={item.href}
        className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
      >
        <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
        <span className="flex-1">{item.name}</span>
        {isActive(item.href) && (
          <ChevronRight className="w-4 h-4 opacity-50" />
        )}
      </Link>
    ));

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight">HomeOS</span>
            <span className="block text-[10px] text-white/30 font-medium tracking-widest uppercase">Mini ERP</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {renderNavItems(mainNav)}

        <div className="sidebar-section-label">Módulos</div>
        {renderNavItems(moduleNav)}

        <div className="sidebar-section-label">Sistema</div>
        {renderNavItems(systemNav)}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/5 relative">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-400/80 to-primary-600/80 rounded-full flex items-center justify-center ring-2 ring-white/10">
            <span className="text-white font-semibold text-sm">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">
              {displayName}
            </p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-4 py-2 mt-1 text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}