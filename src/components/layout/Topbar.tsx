'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useHousehold } from '@/lib/household-context';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Home, PlusCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { getTasks } from '@/services/taskService';
import { getAllItemsForHousehold } from '@/services/shoppingService';
import { getInventoryItems } from '@/services/inventoryService';
import { getHouseholdDocuments } from '@/services/documentService';
import { getExpenses } from '@/services/expenseService';
import { getAssets, getAllMaintenanceSchedules } from '@/services/maintenanceService';

// Define search result type
interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'tasks' | 'shopping' | 'inventory' | 'documents' | 'expenses' | 'maintenance';
  url: string;
  icon: string;
  globalIndex: number;
}

// interface CategorizedResults {
//   tasks: SearchResult[];
//   shopping: SearchResult[];
//   inventory: SearchResult[];
//   documents: SearchResult[];
//   expenses: SearchResult[];
//   maintenance: SearchResult[];
// }

export function Topbar() {
  const { user, signOut } = useAuth();
  const { activeHousehold, householdsList, switchHousehold } = useHousehold();
  const router = useRouter();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [householdDropdownOpen, setHouseholdDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [rawData, setRawData] = useState<{
    tasks: any[];
    shopping: any[];
    inventory: any[];
    documents: any[];
    expenses: any[];
    assets: any[];
    schedules: any[];
  } | null>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const [lastFetched, setLastFetched] = useState<number>(0);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const householdDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  // Fetch search data across all categories
  const fetchData = async () => {
    if (!activeHousehold) return;
    
    // Cache for 30 seconds
    if (rawData && Date.now() - lastFetched < 30000) {
      return;
    }
    
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getTasks(activeHousehold.id),
        getAllItemsForHousehold(activeHousehold.id),
        getInventoryItems(activeHousehold.id),
        getHouseholdDocuments(activeHousehold.id),
        getExpenses(activeHousehold.id),
        getAssets(activeHousehold.id),
        getAllMaintenanceSchedules(activeHousehold.id),
      ]);
      
      const [
        tasksRes,
        shoppingRes,
        inventoryRes,
        documentsRes,
        expensesRes,
        assetsRes,
        schedulesRes
      ] = results;
      
      setRawData({
        tasks: tasksRes.status === 'fulfilled' ? tasksRes.value : [],
        shopping: shoppingRes.status === 'fulfilled' ? shoppingRes.value : [],
        inventory: inventoryRes.status === 'fulfilled' ? inventoryRes.value : [],
        documents: documentsRes.status === 'fulfilled' ? documentsRes.value : [],
        expenses: expensesRes.status === 'fulfilled' ? expensesRes.value : [],
        assets: assetsRes.status === 'fulfilled' ? assetsRes.value : [],
        schedules: schedulesRes.status === 'fulfilled' ? schedulesRes.value : [],
      });
      setLastFetched(Date.now());
    } catch (err) {
      console.error('Error fetching search data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter local rawData by search query
  const getFilteredResults = () => {
    const flat: SearchResult[] = [];
    
    const mapWithGlobalIndex = (items: Omit<SearchResult, 'globalIndex'>[]) => {
      return items.map(item => {
        const mapped = {
          ...item,
          globalIndex: flat.length
        };
        flat.push(mapped);
        return mapped;
      });
    };

    if (!searchQuery || searchQuery.trim().length < 2 || !rawData) {
      return {
        categorized: {
          tasks: [],
          shopping: [],
          inventory: [],
          documents: [],
          expenses: [],
          maintenance: [],
        },
        flat: []
      };
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    // Filter tasks
    const tasks = mapWithGlobalIndex(
      rawData.tasks
        .filter(t => t.title.toLowerCase().includes(query) || (t.description && t.description.toLowerCase().includes(query)))
        .slice(0, 3)
        .map(t => ({
          id: t.id,
          title: t.title,
          subtitle: `Estado: ${t.status === 'COMPLETED' ? 'Completada' : 'Pendiente'} • Prioridad: ${t.priority}`,
          category: 'tasks',
          url: '/dashboard/tasks',
          icon: 'task_alt'
        }))
    );
    
    // Filter shopping
    const shopping = mapWithGlobalIndex(
      rawData.shopping
        .filter(s => s.item_name.toLowerCase().includes(query) || (s.category && s.category.toLowerCase().includes(query)))
        .slice(0, 3)
        .map(s => ({
          id: s.id,
          title: s.item_name,
          subtitle: `Cantidad: ${s.quantity || '1'} • ${s.is_purchased ? 'Comprado' : 'Pendiente'}`,
          category: 'shopping',
          url: '/dashboard/shopping',
          icon: 'shopping_cart'
        }))
    );
    
    // Filter inventory
    const inventory = mapWithGlobalIndex(
      rawData.inventory
        .filter(i => i.name.toLowerCase().includes(query) || (i.brand && i.brand.toLowerCase().includes(query)) || (i.location && i.location.toLowerCase().includes(query)))
        .slice(0, 3)
        .map(i => ({
          id: i.id,
          title: i.name,
          subtitle: `Stock: ${i.current_quantity} ${i.unit} • Ubicación: ${i.location || 'N/A'}`,
          category: 'inventory',
          url: '/dashboard/inventory',
          icon: 'inventory_2'
        }))
    );
    
    // Filter documents
    const documents = mapWithGlobalIndex(
      rawData.documents
        .filter(d => d.title.toLowerCase().includes(query) || d.category.toLowerCase().includes(query))
        .slice(0, 3)
        .map(d => ({
          id: d.id,
          title: d.title,
          subtitle: `Tipo: ${d.category} • Subido: ${new Date(d.created_at).toLocaleDateString()}`,
          category: 'documents',
          url: '/dashboard/documents',
          icon: 'description'
        }))
    );
    
    // Filter expenses
    const expenses = mapWithGlobalIndex(
      rawData.expenses
        .filter(e => e.description && e.description.toLowerCase().includes(query))
        .slice(0, 3)
        .map(e => ({
          id: e.id,
          title: e.description,
          subtitle: `Monto: $${e.amount.toLocaleString()} • Fecha: ${e.date}`,
          category: 'expenses',
          url: '/dashboard/expenses',
          icon: 'payments'
        }))
    );
    
    // Filter maintenance
    const filteredAssets = rawData.assets
      .filter(a => a.name.toLowerCase().includes(query) || (a.location && a.location.toLowerCase().includes(query)))
      .slice(0, 2)
      .map(a => ({
        id: a.id,
        title: a.name,
        subtitle: `Equipo • Ubicación: ${a.location || 'N/A'}`,
        category: 'maintenance' as const,
        url: '/dashboard/maintenance',
        icon: 'handyman'
      }));
      
    const filteredSchedules = rawData.schedules
      .filter(s => s.task_description.toLowerCase().includes(query) || (s.asset && s.asset.name.toLowerCase().includes(query)))
      .slice(0, 2)
      .map(s => ({
        id: s.id,
        title: s.task_description,
        subtitle: `Agenda • Equipo: ${s.asset?.name || 'N/A'} • Próximo: ${s.next_due || 'Sin programar'}`,
        category: 'maintenance' as const,
        url: '/dashboard/maintenance',
        icon: 'event_repeat'
      }));
      
    const maintenance = mapWithGlobalIndex([...filteredAssets, ...filteredSchedules].slice(0, 3));
    
    return {
      categorized: {
        tasks,
        shopping,
        inventory,
        documents,
        expenses,
        maintenance
      },
      flat
    };
  };

  const handleSelectResult = (item: SearchResult) => {
    router.push(item.url);
    setIsFocused(false);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { flat } = getFilteredResults();
    if (flat.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prevIndex) => (prevIndex + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prevIndex) => (prevIndex - 1 + flat.length) % flat.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[selectedIndex]) {
        handleSelectResult(flat[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsFocused(false);
      setSearchOpen(false);
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-primary/20 text-primary font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const renderSearchResults = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant gap-2.5">
          <div className="w-6 h-6 rounded-full border-2 border-primary/25 border-t-primary animate-spin"></div>
          <p className="font-label-sm text-label-sm text-on-surface-variant/80">Cargando base de datos...</p>
        </div>
      );
    }

    const { categorized, flat } = getFilteredResults();
    
    if (searchQuery.trim().length >= 2 && flat.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant text-center px-4">
          <span className="material-symbols-outlined text-[40px] text-outline/40 mb-2">search_off</span>
          <p className="font-title-sm text-title-sm text-on-surface font-semibold">Sin resultados</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant/80 mt-1 max-w-[280px]">
            No encontramos coincidencias para &quot;<span className="font-semibold text-on-surface">{searchQuery}</span>&quot; en este hogar.
          </p>
        </div>
      );
    }

    const categories: { key: keyof typeof categorized; label: string; bg: string; text: string; icon: string }[] = [
      { key: 'tasks', label: 'Tareas', bg: 'bg-sky-100 dark:bg-sky-950/50', text: 'text-sky-600 dark:text-sky-400', icon: 'task_alt' },
      { key: 'shopping', label: 'Compras', bg: 'bg-amber-100 dark:bg-amber-950/50', text: 'text-amber-600 dark:text-amber-400', icon: 'shopping_cart' },
      { key: 'inventory', label: 'Inventario', bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400', icon: 'inventory_2' },
      { key: 'expenses', label: 'Gastos', bg: 'bg-rose-100 dark:bg-rose-950/50', text: 'text-rose-600 dark:text-rose-400', icon: 'payments' },
      { key: 'documents', label: 'Documentos', bg: 'bg-indigo-100 dark:bg-indigo-950/50', text: 'text-indigo-600 dark:text-indigo-400', icon: 'description' },
      { key: 'maintenance', label: 'Equipos y Mantenimiento', bg: 'bg-teal-100 dark:bg-teal-950/50', text: 'text-teal-600 dark:text-teal-400', icon: 'handyman' },
    ];

    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-2 py-0.5 text-[10px] text-on-surface-variant/60 border-b border-outline-variant/30">
          <span>Coincidencias en este hogar</span>
          <span className="hidden sm:inline">Use ↑↓ para navegar, ↵ para ir</span>
        </div>
        
        {categories.map(({ key, label, bg, text, icon }) => {
          const items = categorized[key];
          if (items.length === 0) return null;
          
          return (
            <div key={key} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 px-2 py-0.5">
                <span className={`material-symbols-outlined text-[12px] ${text}`}>{icon}</span>
                <span className="font-label-sm text-[10px] text-on-surface-variant font-bold tracking-wider uppercase">
                  {label}
                </span>
                <span className="text-[9px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-full ml-auto font-medium">
                  {items.length}
                </span>
              </div>
              
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const isActive = item.globalIndex === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(item.globalIndex)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-150 ${
                        isActive
                          ? 'bg-primary/10 text-primary border-l-2 border-primary pl-2 shadow-sm'
                          : 'text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center shrink-0 ${bg} ${text}`}>
                        <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`font-semibold text-body-md truncate block ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                          {highlightMatch(item.title, searchQuery)}
                        </span>
                        <span className="text-[11px] text-on-surface-variant/80 block mt-0.5 truncate">
                          {item.subtitle}
                        </span>
                      </div>
                      <span className={`material-symbols-outlined text-[16px] text-primary/70 transition-opacity ml-auto shrink-0 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                        chevron_right
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (householdDropdownRef.current && !householdDropdownRef.current.contains(e.target as Node)) {
        setHouseholdDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
        setIsFocused(true);
        fetchData();
      }
      // / key (only if not already focusing an input/textarea)
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
        setIsFocused(true);
        fetchData();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]);

  // Auto-focus search on open
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const closeAllDropdowns = () => {
    setUserDropdownOpen(false);
    setHouseholdDropdownOpen(false);
  };

  return (
    <header className="flex justify-between items-center h-14 sm:h-16 px-3 sm:px-md w-full bg-surface-container-lowest border-b border-outline-variant shadow-sm z-40 shrink-0 relative">
      {/* Left side */}
      <div className="flex items-center gap-2 sm:gap-md min-w-0">
        <div className="w-8 h-8 hidden md:block relative text-primary shrink-0">
          <Logo size={32} />
        </div>
        <span className="font-h3 text-h3 font-bold text-primary hidden md:block mr-2 shrink-0">HomeOS</span>
        
        {/* Household Switcher */}
        {activeHousehold && (
          <div className="relative" ref={householdDropdownRef}>
            <button 
              onClick={() => {
                setHouseholdDropdownOpen(!householdDropdownOpen);
                setUserDropdownOpen(false);
                setSearchOpen(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 hover:bg-surface-container-high rounded-lg px-2 sm:px-3 py-1.5 transition-colors border border-outline-variant bg-surface"
            >
              <Home className="w-4 h-4 text-primary shrink-0" />
              <span className="font-label-md text-label-md text-on-surface max-w-[100px] sm:max-w-[140px] md:max-w-[200px] truncate">
                {activeHousehold.name}
              </span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0">expand_more</span>
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
                      className={`w-full text-left px-4 py-2.5 font-body-md text-body-md transition-colors flex items-center justify-between
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

        {/* Theme toggle — desktop only in topbar, mobile goes into user dropdown */}
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* Desktop inline search */}
        <div className="relative hidden md:block" ref={searchContainerRef}>
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            ref={searchInputRef}
            className="pl-xl pr-12 py-sm rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant w-64 transition-all duration-200 focus:w-80"
            placeholder="Buscar... (Ctrl+K o /)"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onFocus={() => {
              setIsFocused(true);
              fetchData();
            }}
            onKeyDown={handleSearchKeyDown}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none px-1.5 py-0.5 rounded border border-outline-variant bg-surface-container text-[10px] font-medium text-on-surface-variant font-sans">
            <span className="text-[9px]">⌘</span>K
          </div>
          
          {/* Desktop Search Results Dropdown */}
          {isFocused && (searchQuery.trim().length >= 2 || loading) && (
            <div className="absolute right-0 top-full mt-2 w-[480px] max-h-[480px] overflow-y-auto bg-surface/95 backdrop-blur-md rounded-xl shadow-2xl border border-outline-variant/60 z-50 p-3 scrollbar-thin animate-slide-up">
              {renderSearchResults()}
            </div>
          )}
        </div>

        {/* Mobile search toggle */}
        <button 
          onClick={() => {
            setSearchOpen(!searchOpen);
            closeAllDropdowns();
          }}
          className={`md:hidden p-2 rounded-full flex items-center justify-center transition-colors duration-200 ${
            searchOpen 
              ? 'bg-primary-container text-on-primary-container' 
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">{searchOpen ? 'close' : 'search'}</span>
        </button>

        {/* Notifications */}
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors duration-200 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>

        {/* User menu */}
        <div className="relative" ref={userDropdownRef}>
          <button 
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setHouseholdDropdownOpen(false);
              setSearchOpen(false);
            }}
            className="flex items-center gap-1 sm:gap-2 hover:bg-surface-container-high rounded-full p-1 sm:pl-2 sm:pr-3 transition-colors"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-variant overflow-hidden border border-outline-variant flex items-center justify-center font-bold text-primary shrink-0 text-sm">
              {user?.profile?.name ? (user.profile.name as string).charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
            </div>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant hidden sm:block">expand_more</span>
          </button>
          
          {userDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant overflow-hidden z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
                <p className="font-label-sm text-label-sm text-on-surface truncate font-semibold">{user?.profile?.name || 'Usuario'}</p>
                <p className="text-[12px] text-on-surface-variant truncate">{user?.email}</p>
              </div>
              
              {/* Theme toggle — mobile only inside dropdown */}
              <div className="md:hidden px-4 py-3 border-b border-outline-variant">
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Tema</p>
                <ThemeToggle />
              </div>

              {/* Settings */}
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

              {/* Help */}
              <button 
                onClick={() => {
                  setUserDropdownOpen(false);
                  router.push('/help');
                }}
                className="w-full text-left px-4 py-3 font-label-sm text-label-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">help</span>
                Ayuda
              </button>

              {/* Logout */}
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

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full bg-surface-container-lowest border-b border-outline-variant shadow-md p-3 z-50 animate-fade-in flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              ref={searchInputRef}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant"
              placeholder="Buscar en HomeOS..."
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onFocus={() => {
                setIsFocused(true);
                fetchData();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchOpen(false);
                
                const { flat } = getFilteredResults();
                if (flat.length === 0) return;
                
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedIndex((prevIndex) => (prevIndex + 1) % flat.length);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedIndex((prevIndex) => (prevIndex - 1 + flat.length) % flat.length);
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (flat[selectedIndex]) {
                    handleSelectResult(flat[selectedIndex]);
                  }
                }
              }}
            />
          </div>
          
          {(searchQuery.trim().length >= 2 || loading) && (
            <div className="mt-2 border-t border-outline-variant/30 pt-2">
              {renderSearchResults()}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
