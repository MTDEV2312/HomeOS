'use client';

import React, { useEffect, useState } from 'react';
import { useHousehold } from '@/lib/household-context';
import { insforge } from '@/lib/insforge';
import { getTasks, Task } from '@/services/taskService';
import { getInventoryItems, InventoryItem } from '@/services/inventoryService';
import { getAllMaintenanceSchedules, MaintenanceSchedule } from '@/services/maintenanceService';
import { getExpenses, getBudgets, Expense, Budget } from '@/services/expenseService';
import { getShoppingLists, ShoppingList } from '@/services/shoppingService';
import Link from 'next/link';

export default function DashboardPage() {
  const { activeHousehold } = useHousehold();
  
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<MaintenanceSchedule[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [activeShoppingLists, setActiveShoppingLists] = useState<ShoppingList[]>([]);

  useEffect(() => {
    if (!activeHousehold) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [t, i, m, e, b, s] = await Promise.all([
          getTasks(activeHousehold.id),
          getInventoryItems(activeHousehold.id),
          getAllMaintenanceSchedules(activeHousehold.id),
          getExpenses(activeHousehold.id),
          getBudgets(activeHousehold.id),
          getShoppingLists(activeHousehold.id)
        ]);

        setTasks(t.filter(task => task.status !== 'COMPLETED'));
        setLowStockItems(i.filter(item => item.current_quantity <= item.minimum_threshold));
        
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        setUpcomingMaintenance(m.filter(sch => new Date(sch.next_due) <= nextWeek));

        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        setExpenses(e.filter(exp => exp.date >= currentMonthStart));
        setBudgets(b);
        setActiveShoppingLists(s.filter(list => list.status !== 'COMPLETED'));
        
      } catch (error) {
        console.error("Error loading dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Re-use standard channel subscription to listen for overall updates
    const setupRealtime = async () => {
      try {
        await insforge.realtime.connect();
        const channelName = `household:${activeHousehold.id}`;
        await insforge.realtime.subscribe(channelName);
        
        // Listen to all inserts/updates/deletes on relevant tables
        const tables = ['task', 'inventory_items', 'maintenance_schedule', 'expenses', 'budgets', 'shopping_lists'];
        tables.forEach(table => {
          insforge.realtime.on(`INSERT_${table}`, () => loadData());
          insforge.realtime.on(`UPDATE_${table}`, () => loadData());
          insforge.realtime.on(`DELETE_${table}`, () => loadData());
        });
      } catch (err) {
        console.error('Error setting up realtime on dashboard:', err);
      }
    };

    setupRealtime();

    return () => {
      insforge.realtime.unsubscribe(`household:${activeHousehold.id}`);
    };
  }, [activeHousehold]);

  if (!activeHousehold) return <div className="p-margin">Cargando contexto del hogar...</div>;

  // Calculate Budget Info
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isOverBudget = totalSpent > totalBudget && totalBudget > 0;

  return (
    <div className="flex flex-col gap-xl w-full min-w-0 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col gap-sm">
        <h1 className="font-h1 text-h1 text-on-surface tracking-tight">Bienvenido a casa</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Aquí tienes un resumen de lo que está pasando en {activeHousehold.name}.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-xl">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          
          {/* Quick Stats Bento */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-lg shadow-sm flex flex-col gap-md lg:col-span-2 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center z-10">
              <h2 className="font-h3 text-h3 text-on-surface font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Estado General
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-md z-10 mt-2">
              <Link href="/dashboard/tasks" className="bg-surface p-md rounded-xl border border-outline-variant flex flex-col gap-1 hover:border-primary transition-colors group/item">
                <span className="material-symbols-outlined text-secondary mb-1 group-hover/item:scale-110 transition-transform">task_alt</span>
                <span className="font-h2 text-h2 font-bold text-on-surface">{tasks.length}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Tareas pendientes</span>
              </Link>
              
              <Link href="/dashboard/inventory" className="bg-surface p-md rounded-xl border border-outline-variant flex flex-col gap-1 hover:border-error transition-colors group/item">
                <span className="material-symbols-outlined text-error mb-1 group-hover/item:scale-110 transition-transform">inventory_2</span>
                <span className="font-h2 text-h2 font-bold text-on-surface">{lowStockItems.length}</span>
                <span className="font-label-sm text-label-sm text-error">Sin stock</span>
              </Link>

              <Link href="/dashboard/shopping" className="bg-surface p-md rounded-xl border border-outline-variant flex flex-col gap-1 hover:border-primary transition-colors group/item">
                <span className="material-symbols-outlined text-tertiary mb-1 group-hover/item:scale-110 transition-transform">shopping_cart</span>
                <span className="font-h2 text-h2 font-bold text-on-surface">{activeShoppingLists.length}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Listas activas</span>
              </Link>

              <Link href="/dashboard/maintenance" className="bg-surface p-md rounded-xl border border-outline-variant flex flex-col gap-1 hover:border-primary transition-colors group/item">
                <span className="material-symbols-outlined text-primary mb-1 group-hover/item:scale-110 transition-transform">build</span>
                <span className="font-h2 text-h2 font-bold text-on-surface">{upcomingMaintenance.length}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Mantenimientos prox.</span>
              </Link>
            </div>
            {/* Decorative background element */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
          </div>

          {/* Budget Progress Bento */}
          <Link href="/dashboard/expenses" className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-lg shadow-sm flex flex-col gap-md hover:shadow-md transition-shadow relative overflow-hidden group">
            <h2 className="font-h3 text-h3 text-on-surface font-semibold flex items-center gap-2 z-10">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              Presupuesto del Mes
            </h2>
            
            <div className="flex-1 flex flex-col justify-center gap-md z-10">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Gastado</span>
                  <span className={`font-h2 text-h2 font-bold ${isOverBudget ? 'text-error' : 'text-on-surface'}`}>
                    ${totalSpent.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Presupuesto</span>
                  <span className="font-h3 text-h3 text-on-surface-variant">
                    ${totalBudget.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-error' : 'bg-primary'}`}
                  style={{ width: `${budgetPercentage}%` }}
                ></div>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant text-center">
                {totalBudget > 0 ? `${budgetPercentage.toFixed(0)}% consumido` : 'Sin presupuesto definido'}
              </span>
            </div>
            {/* Decorative background element */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors"></div>
          </Link>

          {/* Urgent Actions Bento */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-lg shadow-sm flex flex-col gap-md lg:col-span-3">
            <h2 className="font-h3 text-h3 text-on-surface font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-error">notification_important</span>
              Acción Requerida
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
              {tasks.filter(t => {
                if (!t.due_date) return false;
                const due = new Date(t.due_date);
                const today = new Date();
                return due <= today;
              }).slice(0, 3).map(task => (
                <div key={task.id} className="bg-error-container/20 p-md rounded-xl border border-error/20 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-error shrink-0">event_busy</span>
                  <div>
                    <h4 className="font-label-lg text-label-lg text-on-surface font-semibold">Tarea Vencida</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{task.title}</p>
                  </div>
                </div>
              ))}

              {lowStockItems.slice(0, 3).map(item => (
                <div key={item.id} className="bg-tertiary-container/20 p-md rounded-xl border border-tertiary/20 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-tertiary shrink-0">inventory_2</span>
                  <div>
                    <h4 className="font-label-lg text-label-lg text-on-surface font-semibold">Stock Crítico</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{item.name} ({item.current_quantity} {item.unit})</p>
                  </div>
                </div>
              ))}

              {upcomingMaintenance.slice(0, 3).map(maint => (
                <div key={maint.id} className="bg-secondary-container/20 p-md rounded-xl border border-secondary/20 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-secondary shrink-0">build</span>
                  <div>
                    <h4 className="font-label-lg text-label-lg text-on-surface font-semibold">Mantenimiento Prox.</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Vence: {new Date(maint.next_due).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}

              {tasks.length === 0 && lowStockItems.length === 0 && upcomingMaintenance.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-xl gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-primary/50">check_circle</span>
                  <p className="font-body-md text-body-md text-center">¡Todo en orden! No hay acciones urgentes.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
