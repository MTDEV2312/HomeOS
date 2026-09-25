'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter, Link } from '@/lib/navigation'
import {
  Home, Building2, Users, CheckSquare, ShoppingCart, DollarSign,
  Package, Wrench, FileText, BarChart2, Settings, HelpCircle,
  Search, Bell, ChevronDown, Sun, Moon, Monitor, Menu, X, Plus,
  LogOut, User, ChevronRight
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/lib/auth-context'
import { HouseholdProvider, useHousehold } from '@/lib/household-context'
import type { UserHousehold } from '@/services/householdService'
import ProtectedRoute from '@/components/ProtectedRoute'
import HouseholdGuard from '@/components/HouseholdGuard'
import CommandPalette from '@/components/CommandPalette'

type NavEntry = {
  to: string
  label: string
  icon: React.ElementType
  exact?: boolean
} | null

const navItems: NavEntry[] = [
  { to: '/dashboard', label: 'Inicio', icon: Home, exact: true },
  { to: '/dashboard/household', label: 'Mi residencia', icon: Building2 },
  { to: '/dashboard/members', label: 'Miembros', icon: Users },
  null,
  { to: '/dashboard/tasks', label: 'Tareas', icon: CheckSquare },
  { to: '/dashboard/shopping', label: 'Compras', icon: ShoppingCart },
  { to: '/dashboard/expenses', label: 'Gastos', icon: DollarSign },
  null,
  { to: '/dashboard/inventory', label: 'Inventario', icon: Package },
  { to: '/dashboard/maintenance', label: 'Mantenimiento', icon: Wrench },
  { to: '/dashboard/documents', label: 'Documentos', icon: FileText },
  null,
  { to: '/dashboard/reports', label: 'Reportes', icon: BarChart2 },
  null,
  { to: '/dashboard/settings', label: 'Configuración', icon: Settings },
  { to: '/help', label: 'Ayuda', icon: HelpCircle },
]

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) {
    return email.slice(0, 2).toUpperCase()
  }
  return 'HO'
}

function NavItem({
  item,
  onNavigate,
}: {
  item: { to: string; label: string; icon: React.ElementType; exact?: boolean }
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const isActive = item.exact ? pathname === item.to : pathname.startsWith(item.to)

  return (
    <Link
      href={item.to}
      onClick={onNavigate}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded text-[13px] font-medium transition-all duration-150 mb-0.5 ${
        isActive
          ? 'text-olive dark:text-dark-olive bg-olive-soft dark:bg-dark-olive-soft border-l-2 border-olive dark:border-dark-olive font-semibold'
          : 'text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink hover:bg-olive-soft/50 dark:hover:bg-dark-olive-soft/50'
      }`}
    >
      <item.icon size={14} className={isActive ? 'text-olive dark:text-dark-olive' : ''} />
      {item.label}
    </Link>
  )
}

interface SidebarContentProps {
  householdName: string
  activeHouseholdId?: string
  householdsList: UserHousehold[]
  houseMenuOpen: boolean
  setHouseMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  switchHousehold: (id: string) => void
  isDark: boolean
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  userName: string
  userEmail: string
  initials: string
  userAvatar?: string
  onNavigate?: () => void
  onSetupHousehold: () => void
}

function SidebarContent({
  householdName,
  activeHouseholdId,
  householdsList,
  houseMenuOpen,
  setHouseMenuOpen,
  switchHousehold,
  isDark,
  setTheme,
  userName,
  userEmail,
  initials,
  userAvatar,
  onNavigate,
  onSetupHousehold,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full select-none">
      {/* Brand header */}
      <div className="px-5 py-5 border-b border-line dark:border-dark-line">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="text-[15px] font-semibold tracking-tight text-ink dark:text-dark-ink flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-olive dark:bg-dark-olive inline-block shrink-0" />
            HomeOS
          </Link>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-1.5 rounded text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink hover:bg-olive-soft/40 dark:hover:bg-dark-olive-soft/40 transition-colors"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Household Switcher */}
      <div className="px-4 py-3 border-b border-line dark:border-dark-line relative">
        <button
          onClick={() => setHouseMenuOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-olive-soft dark:hover:bg-dark-olive-soft transition-colors text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 size={13} className="text-olive dark:text-dark-olive shrink-0" />
            <span className="text-[12px] font-semibold tracking-wider uppercase text-muted dark:text-dark-muted truncate">
              {householdName}
            </span>
          </div>
          <ChevronDown size={12} className="text-muted dark:text-dark-muted shrink-0 ml-1" />
        </button>

        {houseMenuOpen && (
          <div className="absolute left-4 right-4 top-12 py-1 border border-line dark:border-dark-line rounded bg-surface dark:bg-dark-surface shadow-xl z-30">
            <div className="px-3 py-1.5 text-[10px] text-muted dark:text-dark-muted font-semibold uppercase tracking-widest">
              Hogares
            </div>
            {householdsList.map(h => {
              const isSelected = h.households.id === activeHouseholdId
              return (
                <button
                  key={h.households.id}
                  onClick={() => {
                    switchHousehold(h.households.id)
                    setHouseMenuOpen(false)
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[13px] flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'text-olive dark:text-dark-olive bg-olive-soft/50 dark:bg-dark-olive-soft/50 font-medium'
                      : 'text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink hover:bg-bg dark:hover:bg-dark-bg'
                  }`}
                >
                  <span className="truncate">{h.households.name}</span>
                  {isSelected && <CheckSquare size={12} className="shrink-0 text-olive dark:text-dark-olive" />}
                </button>
              )
            })}
            <div className="border-t border-line dark:border-dark-line my-1" />
            <button
              onClick={() => {
                onSetupHousehold()
                setHouseMenuOpen(false)
              }}
              className="w-full text-left px-3 py-1.5 text-[13px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink hover:bg-bg dark:hover:bg-dark-bg flex items-center gap-2"
            >
              <Plus size={12} /> Crear otro hogar
            </button>
            <button
              onClick={() => {
                onSetupHousehold()
                setHouseMenuOpen(false)
              }}
              className="w-full text-left px-3 py-1.5 text-[13px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink hover:bg-bg dark:hover:bg-dark-bg flex items-center gap-2"
            >
              <ChevronRight size={12} /> Unirme a uno
            </button>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {navItems.map((item, i) =>
          !item ? (
            <div key={`sep-${i}`} className="my-2 border-t border-line dark:border-dark-line" />
          ) : (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          )
        )}
      </nav>

      {/* User profile footer */}
      <div className="px-4 py-4 border-t border-line dark:border-dark-line">
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className="flex items-center gap-2.5 p-1 rounded hover:bg-olive-soft/50 dark:hover:bg-dark-olive-soft/50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-olive dark:bg-dark-olive text-white text-[11px] font-semibold flex items-center justify-center shrink-0 overflow-hidden">
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-ink dark:text-dark-ink truncate">{userName}</div>
            <div className="text-[11px] text-muted dark:text-dark-muted truncate">{userEmail}</div>
          </div>
        </Link>
      </div>
    </div>
  )
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, isDark } = useTheme()
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { activeHousehold, householdsList, switchHousehold } = useHousehold()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [houseMenuOpen, setHouseMenuOpen] = useState(false)

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen(prev => !prev)
      }
      if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault()
        setCmdOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Close menus on path navigation
  useEffect(() => {
    setSidebarOpen(false)
    setUserMenuOpen(false)
    setHouseMenuOpen(false)
  }, [pathname])

  const userName = (user?.profile?.name as string) || user?.email?.split('@')[0] || 'Usuario'
  const userEmail = user?.email || ''
  const userAvatar = (user?.profile?.avatar_url as string) || undefined
  const initials = getInitials(user?.profile?.name as string, user?.email)
  const householdName = activeHousehold?.name || 'Mi residencia'

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (err) {
      console.error('Sign out error', err)
    }
  }

  const handleSetupHousehold = () => {
    router.push('/household-setup')
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg flex text-ink dark:text-dark-ink">
      {/* Desktop Sidebar (224px / w-56) */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-line dark:border-dark-line bg-surface dark:bg-dark-surface fixed left-0 top-0 h-full z-30">
        <SidebarContent
          householdName={householdName}
          activeHouseholdId={activeHousehold?.id}
          householdsList={householdsList}
          houseMenuOpen={houseMenuOpen}
          setHouseMenuOpen={setHouseMenuOpen}
          switchHousehold={switchHousehold}
          isDark={isDark}
          setTheme={setTheme}
          userName={userName}
          userEmail={userEmail}
          initials={initials}
          userAvatar={userAvatar}
          onSetupHousehold={handleSetupHousehold}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink/30 dark:bg-black/60 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-surface dark:bg-dark-surface border-r border-line dark:border-dark-line z-10 shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
            >
              <X size={18} />
            </button>
            <SidebarContent
              householdName={householdName}
              activeHouseholdId={activeHousehold?.id}
              householdsList={householdsList}
              houseMenuOpen={houseMenuOpen}
              setHouseMenuOpen={setHouseMenuOpen}
              switchHousehold={switchHousehold}
              isDark={isDark}
              setTheme={setTheme}
              userName={userName}
              userEmail={userEmail}
              initials={initials}
              userAvatar={userAvatar}
              onNavigate={() => setSidebarOpen(false)}
              onSetupHousehold={handleSetupHousehold}
            />
          </aside>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 bg-surface/95 dark:bg-dark-surface/95 backdrop-blur-sm border-b border-line dark:border-dark-line flex items-center px-4 lg:px-6 gap-3">
          <button
            className="lg:hidden p-1.5 -ml-1 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink rounded transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>

          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-olive dark:bg-dark-olive" />
            HomeOS
          </div>

          <div className="flex-1 flex items-center">
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 border border-line dark:border-dark-line rounded-[4px] text-muted dark:text-dark-muted hover:border-olive/50 dark:hover:border-dark-olive/50 transition-colors text-[13px] w-full max-w-xs bg-bg/40 dark:bg-dark-bg/40"
            >
              <Search size={13} className="shrink-0" />
              <span className="flex-1 text-left truncate">Buscar…</span>
              <span className="text-[11px] font-mono bg-bg dark:bg-dark-bg px-1.5 py-0.5 rounded border border-line dark:border-dark-line shrink-0">⌘K</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              className="relative p-2 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors rounded"
              onClick={() => toast('No hay notificaciones nuevas.')}
              title="Notificaciones"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-terracotta rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded hover:bg-olive-soft dark:hover:bg-dark-olive-soft transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-olive dark:bg-dark-olive text-white text-[11px] font-semibold flex items-center justify-center shrink-0 overflow-hidden">
                  {userAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <ChevronDown size={12} className="text-muted dark:text-dark-muted hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-10 w-56 bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[6px] shadow-xl z-50 py-1"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-line dark:border-dark-line">
                    <div className="text-[13px] font-semibold text-ink dark:text-dark-ink truncate">{userName}</div>
                    <div className="text-[11px] text-muted dark:text-dark-muted mt-0.5 truncate">{userEmail}</div>
                  </div>

                  <button
                    className="w-full text-left px-4 py-2 text-[13px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink hover:bg-bg dark:hover:bg-dark-bg flex items-center gap-2"
                    onClick={() => router.push('/dashboard/settings')}
                  >
                    <User size={13} /> Configuración
                  </button>

                  <button
                    className="w-full text-left px-4 py-2 text-[13px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink hover:bg-bg dark:hover:bg-dark-bg flex items-center gap-2"
                    onClick={() => router.push('/help')}
                  >
                    <HelpCircle size={13} /> Ayuda
                  </button>

                  <div className="border-t border-line dark:border-dark-line my-1" />

                  <div className="px-4 py-2">
                    <div className="text-[11px] text-muted dark:text-dark-muted mb-1.5 font-medium">Tema</div>
                    <div className="flex gap-1">
                      {(['light', 'dark', 'system'] as const).map(t => (
                        <button
                          key={t}
                          onClick={(e) => {
                            e.stopPropagation()
                            setTheme(t)
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border transition-colors ${
                            theme === t
                              ? 'border-olive dark:border-dark-olive text-olive dark:text-dark-olive bg-olive-soft dark:bg-dark-olive-soft font-semibold'
                              : 'border-line dark:border-dark-line text-muted dark:text-dark-muted hover:border-muted'
                          }`}
                        >
                          {t === 'light' && <Sun size={10} />}
                          {t === 'dark' && <Moon size={10} />}
                          {t === 'system' && <Monitor size={10} />}
                          <span>{t === 'light' ? 'Claro' : t === 'dark' ? 'Oscuro' : 'Auto'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-line dark:border-dark-line my-1" />

                  <button
                    className="w-full text-left px-4 py-2 text-[13px] text-terracotta dark:text-dark-terracotta hover:bg-terracotta-bg/40 flex items-center gap-2"
                    onClick={handleSignOut}
                  >
                    <LogOut size={13} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 w-full min-w-0">{children}</main>
      </div>

      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
    </div>
  )
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <HouseholdProvider>
        <HouseholdGuard>
          <AppShell>{children}</AppShell>
        </HouseholdGuard>
      </HouseholdProvider>
    </ProtectedRoute>
  )
}
