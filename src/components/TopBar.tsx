"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Bell, Search, Menu, X, Settings } from 'lucide-react';
import Link from 'next/link';

interface TopBarProps {
  title: string;
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export default function TopBar({ title, onMenuToggle, sidebarOpen }: TopBarProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const displayName = user?.profile?.name || user?.email?.split('@')[0] || 'U';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="top-bar">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-60 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Settings shortcut */}
        <Link
          href="/dashboard/settings"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
        </Link>

        {/* User avatar */}
        <Link
          href="/dashboard/settings"
          className="ml-1 w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center ring-2 ring-primary-100 hover:ring-primary-200 transition-all"
        >
          <span className="text-white font-semibold text-xs">{initials}</span>
        </Link>
      </div>
    </header>
  );
}