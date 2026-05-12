'use client';

import { useEffect, useState } from 'react';
import { useHousehold } from '@/lib/household-context';
import { useAuth } from '@/lib/auth-context';
import { insforge } from '@/lib/insforge';
import { 
  Expense, 
  ExpenseCategory, 
  Budget, 
  getExpenses, 
  getExpenseCategories, 
  getBudgets, 
  addExpense,
  createExpenseCategory,
  updateExpense,
  deleteExpense
} from '@/services/expenseService';

import { getHouseholdMembers, HouseholdMemberDetails } from '@/services/householdService';

export default function ExpensesDashboard() {
  const { activeHousehold } = useHousehold();
  const { user } = useAuth();
  
  const [members, setMembers] = useState<HouseholdMemberDetails[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isLogExpenseModalOpen, setIsLogExpenseModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Log/Edit expense form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expensePayerId, setExpensePayerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Budget form state
  const [budgetAmount, setBudgetAmount] = useState('');
  
  useEffect(() => {
    if (!activeHousehold) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [loadedExpenses, loadedCategories, loadedBudgets, loadedMembers] = await Promise.all([
          getExpenses(activeHousehold.id),
          getExpenseCategories(activeHousehold.id),
          getBudgets(activeHousehold.id),
          getHouseholdMembers(activeHousehold.id)
        ]);
        
        setExpenses(loadedExpenses);
        setMembers(loadedMembers);
        
        // Auto-create default categories if none exist
        if (loadedCategories.length === 0) {
          const defaultCats = [
            { name: 'Hogar/Alquiler', icon: 'home', color: 'primary' },
            { name: 'Supermercado', icon: 'shopping_cart', color: 'error' },
            { name: 'Servicios', icon: 'bolt', color: 'secondary' },
            { name: 'Transporte', icon: 'directions_car', color: 'surface-variant' },
            { name: 'Entretenimiento', icon: 'attractions', color: 'primary' },
            { name: 'Salud', icon: 'medical_services', color: 'error' },
            { name: 'Otros', icon: 'more_horiz', color: 'secondary' }
          ];
          
          const createdCats = [];
          for (const cat of defaultCats) {
            try {
              const created = await createExpenseCategory(activeHousehold.id, cat);
              createdCats.push(created);
            } catch (e: any) {
              if (e.code !== '23505') { // ignore unique violation
                console.error("Error creating category:", e);
              }
            }
          }
          // Fetch again to ensure we get all (including those created by another concurrent render)
          const finalCategories = await getExpenseCategories(activeHousehold.id);
          setCategories(finalCategories);
        } else {
          setCategories(loadedCategories);
        }
        
        setBudgets(loadedBudgets);
        const currentBudget = loadedBudgets.find((b: Budget) => !b.category_id);
        if (currentBudget) setBudgetAmount(currentBudget.amount.toString());
      } catch (err: any) {
        console.error("Error loading expenses data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    const setupRealtime = async () => {
      try {
        await insforge.realtime.connect();
        const channelName = `household:${activeHousehold.id}`;
        await insforge.realtime.subscribe(channelName);
        
        insforge.realtime.on('INSERT_expenses', (payload: any) => {
          setCategories(cats => {
            const expense = { ...payload, category: cats.find(c => c.id === payload.category_id) };
            setExpenses(prev => prev.find(e => e.id === payload.id) ? prev : [expense, ...prev]);
            return cats;
          });
        });
        
        insforge.realtime.on('UPDATE_expenses', (payload: any) => {
          setCategories(cats => {
            const expense = { ...payload, category: cats.find(c => c.id === payload.category_id) };
            setExpenses(prev => prev.map(e => e.id === payload.id ? expense : e));
            return cats;
          });
        });
        
        insforge.realtime.on('DELETE_expenses', (payload: any) => {
          setExpenses(prev => prev.filter(e => e.id !== payload.id));
        });
        
        // Listen to budgets and categories
        insforge.realtime.on('INSERT_budgets', () => loadData());
        insforge.realtime.on('UPDATE_budgets', () => loadData());
        insforge.realtime.on('DELETE_budgets', () => loadData());
        
        insforge.realtime.on('INSERT_expense_categories', () => loadData());
        insforge.realtime.on('UPDATE_expense_categories', () => loadData());
        insforge.realtime.on('DELETE_expense_categories', () => loadData());
      } catch (err) {
        console.error('Error setting up realtime:', err);
      }
    };
    
    setupRealtime();
    
    return () => {
      insforge.realtime.unsubscribe(`household:${activeHousehold.id}`);
    };
  }, [activeHousehold]);

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold || !user) return;
    
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          amount: parseFloat(amount),
          description,
          category_id: categoryId || null,
          date,
          payer_id: expensePayerId || user.id
        });
      } else {
        await addExpense(activeHousehold.id, expensePayerId || user.id, {
          amount: parseFloat(amount),
          description,
          category_id: categoryId || null,
          date,
          receipt_url: null
        });
      }
      
      closeExpenseModal();
    } catch (err: any) {
      alert(err.message || "Error logging expense");
    }
  };

  const handleDeleteExpense = async () => {
    if (!editingExpense) return;
    if (confirm("¿Estás seguro de que quieres eliminar este gasto?")) {
      try {
        await deleteExpense(editingExpense.id);
        closeExpenseModal();
      } catch (err: any) {
        alert(err.message || "Error eliminando el gasto");
      }
    }
  };

  const closeExpenseModal = () => {
    setIsLogExpenseModalOpen(false);
    setEditingExpense(null);
    setAmount('');
    setDescription('');
    setCategoryId('');
    setExpensePayerId('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const openEditModal = (expense: Expense) => {
    const currentMember = members?.find(m => m.user_id === user?.id);
    const canEdit = expense.payer_id === user?.id || currentMember?.role === 'owner' || currentMember?.role === 'admin';
    if (!canEdit) return;

    setEditingExpense(expense);
    setAmount(expense.amount.toString());
    setDescription(expense.description);
    setCategoryId(expense.category_id || '');
    setExpensePayerId(expense.payer_id);
    setDate(expense.date);
    setIsLogExpenseModalOpen(true);
  };

  if (!activeHousehold) {
    return <div className="p-margin">Cargando contexto del hogar...</div>;
  }

  // Calculate totals
  const totalBudget = budgets.find(b => !b.category_id)?.amount || 0;
  const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const percentSpent = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
  const remaining = totalBudget - totalSpent;
  
  // Category mapping
  const categoryTotals = categories.map(cat => {
    const spent = expenses
      .filter(e => e.category_id === cat.id)
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    const catBudget = budgets.find(b => b.category_id === cat.id)?.amount || (totalBudget > 0 ? (totalBudget / categories.length) : 0);
    const pct = catBudget > 0 ? Math.min(100, Math.round((spent / catBudget) * 100)) : 0;
    
    return { ...cat, spent, catBudget, pct };
  });

  // Safe formatting function
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };
  
  // Find top category
  let topCategory = { name: 'Ninguna', pct: 0 };
  categoryTotals.forEach(cat => {
    if (cat.pct > topCategory.pct) topCategory = { name: cat.name, pct: cat.pct };
  });

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col gap-xl">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Gastos y Presupuestos</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Resumen del Hogar
          </p>
        </div>
        <div className="flex gap-sm w-full sm:w-auto">
          <button 
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex-1 sm:flex-none px-lg py-sm rounded-lg font-label-md text-label-md border border-outline text-secondary hover:bg-surface-container-low transition-colors flex items-center justify-center gap-sm"
          >
            <span className="material-symbols-outlined">tune</span>
            Gestionar Presupuesto
          </button>
          <button 
            onClick={() => {
              setExpensePayerId(user?.id || '');
              setIsLogExpenseModalOpen(true);
            }}
            className="flex-1 sm:flex-none px-lg py-sm rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm"
          >
            <span className="material-symbols-outlined">add</span>
            Anotar Gasto
          </button>
        </div>
      </div>

      {loading && expenses.length === 0 ? (
        <div className="flex justify-center p-xl">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
        </div>
      ) : (
        <>
          {/* Top Section: Overview Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
            {/* Total Budget Card */}
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-h3 text-h3 text-on-surface mb-sm">Presupuesto Mensual Total</h3>
                <div className="flex items-baseline gap-sm mb-lg">
                  <span className="font-h1 text-h1 text-primary">{formatCurrency(totalSpent)}</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">/ {formatCurrency(totalBudget)}</span>
                </div>
              </div>
              <div className="w-full">
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-2">
                  <span>{percentSpent}% Gastado</span>
                  <span>{formatCurrency(remaining)} Restante</span>
                </div>
                <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${percentSpent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="flex flex-col gap-md">
              <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-sm mb-2 text-on-surface-variant">
                  <span className="material-symbols-outlined">calendar_today</span>
                  <span className="font-label-md text-label-md">Promedio Diario</span>
                </div>
                <div className="font-h2 text-h2 text-on-surface" suppressHydrationWarning>{formatCurrency(totalSpent / Math.max(1, new Date().getDate()))}</div>
                <div className="font-label-sm text-label-sm text-secondary mt-1">Este mes</div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-sm mb-2 text-on-surface-variant">
                  <span className="material-symbols-outlined">category</span>
                  <span className="font-label-md text-label-md">Categoría Top</span>
                </div>
                <div className="font-h2 text-h2 text-on-surface">{topCategory.name}</div>
                <div className="font-label-sm text-label-sm text-error mt-1">{topCategory.pct}% del presupuesto asignado</div>
              </div>
            </div>
          </div>

          {/* Middle Section: Categories Grid */}
          <div>
            <h2 className="font-h3 text-h3 text-on-surface mb-md">Gastos por Categoría</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-md">
              {categoryTotals.map(cat => {
                let colorClass = 'bg-primary-container text-on-primary-container';
                let barColor = 'bg-primary';
                
                if (cat.color === 'error') {
                  colorClass = 'bg-error-container text-on-error-container';
                  barColor = 'bg-error';
                } else if (cat.color === 'secondary') {
                  colorClass = 'bg-secondary-container text-on-secondary-container';
                  barColor = 'bg-secondary';
                } else if (cat.color === 'surface-variant') {
                  colorClass = 'bg-surface-variant text-on-surface-variant';
                  barColor = 'bg-surface-tint';
                }
                
                return (
                  <div key={cat.id} className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm">
                    <div className="flex items-center gap-sm mb-md">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <span className="material-symbols-outlined">{cat.icon}</span>
                      </div>
                      <span className="font-h3 text-h3 text-on-surface">{cat.name}</span>
                    </div>
                    <div className="font-h2 text-h2 text-on-surface mb-1">{formatCurrency(cat.spent)}</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant mb-3">de {formatCurrency(cat.catBudget)} pres.</div>
                    <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${cat.pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Section: Recent Expenses */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden mb-xl">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center">
              <h2 className="font-h3 text-h3 text-on-surface">Gastos Recientes</h2>
              <button className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors">Ver Todos</button>
            </div>
            <div className="overflow-x-auto">
              {expenses.length === 0 ? (
                <div className="p-xl text-center text-on-surface-variant font-body-md">
                  No hay gastos registrados. ¡Anota el primero!
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant font-label-md text-label-md text-on-surface-variant">
                      <th className="p-md font-medium">Fecha</th>
                      <th className="p-md font-medium">Descripción</th>
                      <th className="p-md font-medium">Categoría</th>
                      <th className="p-md font-medium">Pagado por</th>
                      <th className="p-md font-medium text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant">
                    {expenses.slice(0, 5).map(expense => {
                      const payer = members?.find(m => m.user_id === expense.payer_id);
                      
                      let badgeClass = 'bg-surface-container-high text-on-surface-variant';
                      if (expense.category?.color === 'error') badgeClass = 'bg-error-container text-on-error-container';
                      else if (expense.category?.color === 'primary') badgeClass = 'bg-primary-container text-on-primary-container';
                      else if (expense.category?.color === 'secondary') badgeClass = 'bg-secondary-container text-on-secondary-container';
                      
                      return (
                        <tr 
                          key={expense.id} 
                          onClick={() => openEditModal(expense)}
                          className="hover:bg-surface-container-lowest transition-colors cursor-pointer"
                        >
                          <td className="p-md" suppressHydrationWarning>{new Date(expense.date).toLocaleDateString()}</td>
                          <td className="p-md font-medium">{expense.description}</td>
                          <td className="p-md">
                            {expense.category ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full font-label-sm text-label-sm ${badgeClass}`}>
                                {expense.category.name}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant text-sm">Ninguna</span>
                            )}
                          </td>
                          <td className="p-md">
                            <span className="w-6 h-6 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center font-label-sm text-label-sm">
                              {payer?.name?.substring(0, 2).toUpperCase() || '??'}
                            </span>
                          </td>
                          <td className="p-md text-right font-medium">{formatCurrency(Number(expense.amount))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Log Expense Modal */}
      {isLogExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h2 className="font-h3 text-h3 text-on-surface font-semibold flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">{editingExpense ? 'edit' : 'add_circle'}</span>
                {editingExpense ? 'Editar Gasto' : 'Anotar Gasto'}
              </h2>
              <button 
                onClick={closeExpenseModal}
                className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleLogExpense} className="p-lg flex flex-col gap-md">
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-on-surface font-medium">Monto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant py-2 pl-8 pr-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-on-surface font-medium">Descripción</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface rounded-lg border border-outline-variant p-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Ej: Supermercado Coto"
                />
              </div>
              
              <div className="flex gap-md">
                <div className="flex flex-col gap-1 w-1/2">
                  <label className="font-label-md text-on-surface font-medium">Categoría</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant p-2 text-on-surface focus:border-primary outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1 w-1/2">
                  <label className="font-label-md text-on-surface font-medium">Pagado por</label>
                  <select
                    value={expensePayerId}
                    onChange={(e) => setExpensePayerId(e.target.value)}
                    required
                    className="w-full bg-surface rounded-lg border border-outline-variant p-2 text-on-surface focus:border-primary outline-none"
                  >
                    <option value="" disabled>Selecciona pagador</option>
                    {members?.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1 w-full">
                <label className="font-label-md text-on-surface font-medium">Fecha</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-surface rounded-lg border border-outline-variant p-2 text-on-surface focus:border-primary outline-none"
                />
              </div>
              
              <div className="pt-md mt-md border-t border-outline-variant flex justify-between gap-sm items-center">
                {editingExpense ? (
                  <button 
                    type="button"
                    onClick={handleDeleteExpense}
                    className="px-md py-2 rounded-lg font-label-md text-error hover:bg-error-container transition-colors"
                  >
                    Eliminar
                  </button>
                ) : <div></div>}
                <div className="flex gap-sm">
                  <button 
                    type="button"
                    onClick={closeExpenseModal}
                    className="px-md py-2 rounded-lg font-label-md text-secondary hover:bg-surface-container-high transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-md py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    {editingExpense ? 'Guardar Cambios' : 'Guardar Gasto'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h2 className="font-h3 text-h3 text-on-surface font-semibold flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">tune</span>
                Gestionar Presupuesto
              </h2>
              <button 
                onClick={() => setIsBudgetModalOpen(false)}
                className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!activeHousehold) return;
              try {
                // Delete existing total budget
                await insforge.database
                  .from('budgets')
                  .delete()
                  .eq('household_id', activeHousehold.id)
                  .is('category_id', null);
                  
                // Create new total budget
                await insforge.database
                  .from('budgets')
                  .insert([{
                    household_id: activeHousehold.id,
                    amount: parseFloat(budgetAmount) || 0,
                    period: 'MONTHLY',
                    start_date: new Date().toISOString().split('T')[0]
                  }]);
                  
                setIsBudgetModalOpen(false);
              } catch (err: any) {
                alert(err.message || "Error saving budget");
              }
            }} className="p-lg flex flex-col gap-md">
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-on-surface font-medium">Presupuesto Total Mensual</label>
                <p className="font-label-sm text-on-surface-variant mb-2">Define el límite máximo de gastos para el hogar en este mes.</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant py-2 pl-8 pr-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="5000.00"
                  />
                </div>
              </div>
              
              <div className="pt-md mt-md border-t border-outline-variant flex justify-end gap-sm">
                <button 
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-md py-2 rounded-lg font-label-md text-secondary hover:bg-surface-container-high transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-md py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Guardar Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
