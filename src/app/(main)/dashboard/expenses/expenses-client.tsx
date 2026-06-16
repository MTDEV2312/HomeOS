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
import { useToast } from '@/lib/toast-context';
import { getErrorMessage } from '@/lib/errors';

interface SplitInfo {
  cleanDescription: string;
  splitType: 'all' | 'custom' | 'loan';
  targetMembers: string[];
  paidAmounts: Record<string, number>;
}

const parseDescription = (desc: string): SplitInfo => {
  if (!desc) {
    return { cleanDescription: '', splitType: 'all', targetMembers: [], paidAmounts: {} };
  }
  
  const paidMatch = desc.match(/\|paid:([^|]+)\|/);
  const paidAmounts: Record<string, number> = {};
  let cleanDesc = desc;
  
  if (paidMatch) {
    cleanDesc = cleanDesc.replace(/\|paid:[^|]+\|/, '').trim();
    paidMatch[1].split(',').forEach(item => {
      const [id, val] = item.split(':');
      if (id && val) {
        paidAmounts[id.trim()] = parseFloat(val) || 0;
      }
    });
  }

  const splitMatch = cleanDesc.match(/\|split:([^|]+)\|/);
  if (splitMatch) {
    const cleanDescription = cleanDesc.replace(/\|split:[^|]+\|/, '').trim();
    const targetMembers = splitMatch[1].split(',').map(id => id.trim());
    return { cleanDescription, splitType: 'custom', targetMembers, paidAmounts };
  }
  
  const loanMatch = cleanDesc.match(/\|loan:([^|]+)\|/);
  if (loanMatch) {
    const cleanDescription = cleanDesc.replace(/\|loan:[^|]+\|/, '').trim();
    const targetMembers = loanMatch[1].split(',').map(id => id.trim());
    return { cleanDescription, splitType: 'loan', targetMembers, paidAmounts };
  }
  
  return { cleanDescription: cleanDesc.trim(), splitType: 'all', targetMembers: [], paidAmounts };
};

const serializeDescription = (
  cleanDesc: string, 
  splitType: 'all' | 'custom' | 'loan', 
  targetMembers: string[],
  paidAmounts: Record<string, number>
): string => {
  let result = cleanDesc;
  
  if (splitType === 'custom' && targetMembers.length > 0) {
    result = `${result} |split:${targetMembers.join(',')}|`;
  } else if (splitType === 'loan' && targetMembers.length > 0) {
    result = `${result} |loan:${targetMembers.join(',')}|`;
  }
  
  const paidEntries = Object.entries(paidAmounts)
    .filter(([id, val]) => targetMembers.includes(id) && val > 0)
    .map(([id, val]) => `${id}:${val}`);
    
  if (paidEntries.length > 0 && splitType !== 'all') {
    result = `${result} |paid:${paidEntries.join(',')}|`;
  }
  
  return result;
};

export default function ExpensesDashboard() {
  const { activeHousehold } = useHousehold();
  const { user } = useAuth();
  
  const [members, setMembers] = useState<HouseholdMemberDetails[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToast();
  
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
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});

  // Split form state
  const [splitType, setSplitType] = useState<'all' | 'custom' | 'loan'>('all');
  const [selectedSplitMembers, setSelectedSplitMembers] = useState<string[]>([]);
  const [selectedLoanDebtors, setSelectedLoanDebtors] = useState<string[]>([]);
  const [paidAmounts, setPaidAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    const payerId = expensePayerId || user?.id;
    if (payerId) {
      setSelectedLoanDebtors(prev => prev.filter(id => id !== payerId));
    }
  }, [expensePayerId, user?.id]);
  
  // View options state
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
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
            } catch (e: unknown) {
              const errorCode = typeof e === 'object' && e && 'code' in e ? (e as { code?: string }).code : undefined;
              if (errorCode !== '23505') {
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
      } catch (err: unknown) {
        console.error("Error loading expenses data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    let active = true;

    const onInsertExpense = (payload: Expense) => {
      if (!active) return;
      setCategories(cats => {
        const expense = { ...payload, category: cats.find(c => c.id === payload.category_id) };
        setExpenses(prev => prev.find(e => e.id === payload.id) ? prev : [expense, ...prev]);
        return cats;
      });
    };

    const onUpdateExpense = (payload: Expense) => {
      if (!active) return;
      setCategories(cats => {
        const expense = { ...payload, category: cats.find(c => c.id === payload.category_id) };
        setExpenses(prev => prev.map(e => e.id === payload.id ? expense : e));
        return cats;
      });
    };

    const onDeleteExpense = (payload: Expense) => {
      if (!active) return;
      setExpenses(prev => prev.filter(e => e.id !== payload.id));
    };

    const onBudgetOrCategoryChange = () => {
      if (!active) return;
      loadData();
    };

    const setupRealtime = async () => {
      try {
        await insforge.realtime.connect();
        const channelName = `household:${activeHousehold.id}`;
        await insforge.realtime.subscribe(channelName);
        
        insforge.realtime.on('INSERT_expenses', onInsertExpense);
        insforge.realtime.on('UPDATE_expenses', onUpdateExpense);
        insforge.realtime.on('DELETE_expenses', onDeleteExpense);
        
        insforge.realtime.on('INSERT_budgets', onBudgetOrCategoryChange);
        insforge.realtime.on('UPDATE_budgets', onBudgetOrCategoryChange);
        insforge.realtime.on('DELETE_budgets', onBudgetOrCategoryChange);
        
        insforge.realtime.on('INSERT_expense_categories', onBudgetOrCategoryChange);
        insforge.realtime.on('UPDATE_expense_categories', onBudgetOrCategoryChange);
        insforge.realtime.on('DELETE_expense_categories', onBudgetOrCategoryChange);
      } catch (err) {
        console.error('Error setting up realtime:', err);
      }
    };
    
    setupRealtime();
    
    return () => {
      active = false;
      insforge.realtime.unsubscribe(`household:${activeHousehold.id}`);
      insforge.realtime.off('INSERT_expenses', onInsertExpense);
      insforge.realtime.off('UPDATE_expenses', onUpdateExpense);
      insforge.realtime.off('DELETE_expenses', onDeleteExpense);
      
      insforge.realtime.off('INSERT_budgets', onBudgetOrCategoryChange);
      insforge.realtime.off('UPDATE_budgets', onBudgetOrCategoryChange);
      insforge.realtime.off('DELETE_budgets', onBudgetOrCategoryChange);
      
      insforge.realtime.off('INSERT_expense_categories', onBudgetOrCategoryChange);
      insforge.realtime.off('UPDATE_expense_categories', onBudgetOrCategoryChange);
      insforge.realtime.off('DELETE_expense_categories', onBudgetOrCategoryChange);
    };
  }, [activeHousehold]);

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold || !user) return;
    
    if (splitType === 'custom' && selectedSplitMembers.length < 2) {
      showError('Error de validación', 'Debés seleccionar al menos 2 miembros para dividir el gasto.');
      return;
    }
    if (splitType === 'loan' && selectedLoanDebtors.length < 1) {
      showError('Error de validación', 'Por favor, seleccioná al menos 1 miembro que debe saldar el préstamo.');
      return;
    }

    const totalAmountVal = parseFloat(amount);
    const parsedPaidAmounts: Record<string, number> = {};
    
    if (splitType === 'custom') {
      const shareAmount = totalAmountVal / selectedSplitMembers.length;
      for (const memberId of selectedSplitMembers) {
        if (memberId === (expensePayerId || user?.id)) continue;
        const valStr = paidAmounts[memberId];
        if (valStr) {
          const val = parseFloat(valStr);
          if (isNaN(val) || val < 0) {
            showError('Error de validación', 'Los montos abonados deben ser números válidos y mayores o iguales a 0.');
            return;
          }
          if (val > shareAmount + 0.01) {
            const memberName = members.find(m => m.user_id === memberId)?.name || 'miembro';
            showError('Error de validación', `El abono de ${memberName} ($${val.toFixed(2)}) no puede superar su cuota de $${shareAmount.toFixed(2)}.`);
            return;
          }
          if (val > 0) {
            parsedPaidAmounts[memberId] = val;
          }
        }
      }
    } else if (splitType === 'loan') {
      const shareAmount = totalAmountVal / selectedLoanDebtors.length;
      for (const memberId of selectedLoanDebtors) {
        const valStr = paidAmounts[memberId];
        if (valStr) {
          const val = parseFloat(valStr);
          if (isNaN(val) || val < 0) {
            showError('Error de validación', 'Los montos abonados deben ser números válidos y mayores o iguales a 0.');
            return;
          }
          if (val > shareAmount + 0.01) {
            const memberName = members.find(m => m.user_id === memberId)?.name || 'miembro';
            showError('Error de validación', `El abono de ${memberName} ($${val.toFixed(2)}) no puede superar su cuota de $${shareAmount.toFixed(2)}.`);
            return;
          }
          if (val > 0) {
            parsedPaidAmounts[memberId] = val;
          }
        }
      }
    }

    try {
      const fullDescription = serializeDescription(
        description,
        splitType,
        splitType === 'custom' 
          ? selectedSplitMembers 
          : splitType === 'loan' 
            ? selectedLoanDebtors 
            : [],
        parsedPaidAmounts
      );

      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          amount: parseFloat(amount),
          description: fullDescription,
          category_id: categoryId || null,
          date,
          payer_id: expensePayerId || user.id
        });
      } else {
        await addExpense(activeHousehold.id, expensePayerId || user.id, {
          amount: parseFloat(amount),
          description: fullDescription,
          category_id: categoryId || null,
          date,
          receipt_url: null
        });
      }
      
      closeExpenseModal();
      success('Gasto registrado', 'El gasto se ha registrado correctamente.');
    } catch (err: unknown) {
      showError('Error al guardar el gasto', getErrorMessage(err));
    }
  };

  const handleDeleteExpense = async () => {
    if (!editingExpense) return;
    if (confirm("¿Estás seguro de que quieres eliminar este gasto?")) {
      try {
        await deleteExpense(editingExpense.id);
        closeExpenseModal();
        success('Gasto eliminado', 'El gasto se ha eliminado correctamente.');
      } catch (err: unknown) {
        showError('Error eliminando el gasto', getErrorMessage(err));
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
    setSplitType('all');
    setSelectedSplitMembers([]);
    setSelectedLoanDebtors([]);
    setPaidAmounts({});
  };

  const openEditModal = (expense: Expense) => {
    const currentMember = members?.find(m => m.user_id === user?.id);
    const canEdit = expense.payer_id === user?.id || currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN';
    if (!canEdit) return;

    const { cleanDescription, splitType: parsedSplitType, targetMembers, paidAmounts: parsedPaidAmounts } = parseDescription(expense.description);

    setEditingExpense(expense);
    setAmount(expense.amount.toString());
    setDescription(cleanDescription);
    setCategoryId(expense.category_id || '');
    setExpensePayerId(expense.payer_id);
    setDate(expense.date);
    setSplitType(parsedSplitType);

    const mappedPaid: Record<string, string> = {};
    Object.entries(parsedPaidAmounts || {}).forEach(([id, val]) => {
      mappedPaid[id] = val.toString();
    });
    setPaidAmounts(mappedPaid);

    if (parsedSplitType === 'custom') {
      setSelectedSplitMembers(targetMembers);
      setSelectedLoanDebtors([]);
    } else if (parsedSplitType === 'loan') {
      setSelectedLoanDebtors(targetMembers);
      setSelectedSplitMembers(members.map(m => m.user_id));
    } else {
      setSelectedSplitMembers(members.map(m => m.user_id));
      setSelectedLoanDebtors([]);
    }
    setIsLogExpenseModalOpen(true);
  };

  if (!activeHousehold) {
    return <div className="p-margin">Cargando contexto del hogar...</div>;
  }

  // Calculate totals (Only for the current month)
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const currentMonthExpenses = expenses.filter(exp => exp.date >= currentMonthStr);

  const totalBudget = budgets.find(b => !b.category_id)?.amount || 0;
  const totalSpent = currentMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const percentSpent = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
  const remaining = totalBudget - totalSpent;
  
  // Category mapping (Spent only in the current month)
  const categoryTotals = categories.map(cat => {
    const spent = currentMonthExpenses
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

  // --- Calculation of Balances & Suggested Transfers (Current Month) ---
  const memberBalances = members.map(m => {
    return {
      ...m,
      spent: 0, // total amount paid by this member
      share: 0, // total share of expenses this member owes
      balance: 0,
    };
  });

  // Calculate spent and share for each member
  currentMonthExpenses.forEach(exp => {
    const { splitType: expSplitType, targetMembers, paidAmounts } = parseDescription(exp.description);
    const initialAmount = Number(exp.amount);
    let totalPaidBack = 0;

    if (expSplitType === 'custom' && targetMembers.length > 0) {
      const shareAmount = initialAmount / targetMembers.length;
      targetMembers.forEach(memberId => {
        const paidBack = paidAmounts[memberId] || 0;
        totalPaidBack += paidBack;
        
        const mb = memberBalances.find(m => m.user_id === memberId);
        if (mb) {
          mb.share += (shareAmount - paidBack);
        }
      });
    } else if (expSplitType === 'loan' && targetMembers.length > 0) {
      const shareAmount = initialAmount / targetMembers.length;
      targetMembers.forEach(debtorId => {
        const paidBack = paidAmounts[debtorId] || 0;
        totalPaidBack += paidBack;
        
        const mb = memberBalances.find(m => m.user_id === debtorId);
        if (mb) {
          mb.share += (shareAmount - paidBack);
        }
      });
    } else {
      // default: split among all members
      const nMembers = memberBalances.length;
      const shareAmount = nMembers > 0 ? initialAmount / nMembers : 0;
      memberBalances.forEach(mb => {
        mb.share += shareAmount;
      });
    }

    const payer = memberBalances.find(m => m.user_id === exp.payer_id);
    if (payer) {
      payer.spent += (initialAmount - totalPaidBack);
    }
  });

  // Balance = spent - share
  memberBalances.forEach(mb => {
    mb.balance = mb.spent - mb.share;
  });

  interface Transfer {
    fromName: string;
    toName: string;
    amount: number;
  }

  const suggestedTransfers: Transfer[] = [];
  
  const numMembers = members.length;
  if (numMembers > 1) {
    const debtors = memberBalances
      .filter(mb => mb.balance < -0.01)
      .map(mb => ({ name: mb.name, amountOwed: Math.abs(mb.balance) }))
      .sort((a, b) => b.amountOwed - a.amountOwed);

    const creditors = memberBalances
      .filter(mb => mb.balance > 0.01)
      .map(mb => ({ name: mb.name, amountOwed: mb.balance }))
      .sort((a, b) => b.amountOwed - a.amountOwed);

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const transferAmount = Math.min(debtor.amountOwed, creditor.amountOwed);
      
      if (transferAmount > 0.01) {
        suggestedTransfers.push({
          fromName: debtor.name,
          toName: creditor.name,
          amount: transferAmount
        });
      }

      debtor.amountOwed -= transferAmount;
      creditor.amountOwed -= transferAmount;

      if (debtor.amountOwed <= 0.01) dIdx++;
      if (creditor.amountOwed <= 0.01) cIdx++;
    }
  }

  const activeDebtors = splitType === 'custom'
    ? selectedSplitMembers.filter(id => id !== (expensePayerId || user?.id))
    : splitType === 'loan'
      ? selectedLoanDebtors
      : [];

  // Filter and slice/full list based on state
  const displayedExpenses = showAllExpenses
    ? expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              expense.amount.toString().includes(searchQuery);
        const matchesCategory = !filterCategory || expense.category_id === filterCategory;
        return matchesSearch && matchesCategory;
      })
    : expenses.slice(0, 5);

  return (
    <div className="flex flex-col gap-xl w-full min-w-0">
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
            onClick={() => {
              const catBudgets: Record<string, string> = {};
              categories.forEach(cat => {
                const b = budgets.find(bg => bg.category_id === cat.id);
                catBudgets[cat.id] = b ? b.amount.toString() : '';
              });
              setCategoryBudgets(catBudgets);
              setIsBudgetModalOpen(true);
            }}
            className="flex-1 sm:flex-none px-lg py-sm rounded-lg font-label-md text-label-md border border-outline text-secondary hover:bg-surface-container-low transition-colors flex items-center justify-center gap-sm"
          >
            <span className="material-symbols-outlined">tune</span>
            Gestionar Presupuesto
          </button>
          <button 
            onClick={() => {
              setExpensePayerId(user?.id || '');
              setSelectedSplitMembers(members.map(m => m.user_id));
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

          {/* Balance Section: Accounts & Debts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
            {/* Resumen de Aportes Card */}
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm flex flex-col gap-md">
              <h3 className="font-h3 text-h3 text-on-surface font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">groups</span>
                Balances de Miembros (Este Mes)
              </h3>
              <div className="divide-y divide-outline-variant">
                {memberBalances.map(mb => {
                  const isCreditor = mb.balance > 0.01;
                  const isDebtor = mb.balance < -0.01;
                  const balanceColor = isCreditor 
                    ? 'text-primary' 
                    : isDebtor 
                      ? 'text-error' 
                      : 'text-on-surface-variant';
                  
                  return (
                    <div key={mb.member_id} className="flex justify-between items-center py-md">
                      <div className="flex items-center gap-sm">
                        <span className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center font-label-md text-label-md">
                          {mb.name.substring(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <span className="block font-label-lg text-label-lg text-on-surface">{mb.name}</span>
                          <span className="block font-body-sm text-body-sm text-on-surface-variant">Aportó: {formatCurrency(mb.spent)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-h3 text-h3 font-bold ${balanceColor}`}>
                          {mb.balance > 0.01 ? '+' : ''}{formatCurrency(mb.balance)}
                        </span>
                        <span className="block font-label-sm text-label-sm text-on-surface-variant">
                          {isCreditor ? 'A favor' : isDebtor ? 'En contra' : 'Saldado'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suggested Transfers Card */}
            <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm flex flex-col gap-md">
              <h3 className="font-h3 text-h3 text-on-surface font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Cómo Saldar Cuentas
              </h3>
              <div className="flex-1 flex flex-col justify-center">
                {suggestedTransfers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-md gap-sm text-on-surface-variant text-center">
                    <span className="material-symbols-outlined text-4xl text-primary/50 font-light">verified</span>
                    <p className="font-body-md text-body-md">¡Todo saldado! No hay deudas pendientes para este mes.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-sm">
                    {suggestedTransfers.map((t, idx) => (
                      <div key={idx} className="bg-surface-container-low p-md rounded-xl border border-outline-variant flex items-center justify-between gap-sm">
                        <div className="min-w-0">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold block truncate">{t.fromName}</span>
                          <span className="font-body-xs text-body-xs text-on-surface-variant">debe transferir a</span>
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold block truncate">{t.toName}</span>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="font-h2 text-h2 font-bold text-primary">{formatCurrency(t.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section: Recent Expenses */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden mb-xl">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h2 className="font-h3 text-h3 text-on-surface">
                {showAllExpenses ? 'Todos los Gastos' : 'Gastos Recientes'}
              </h2>
              <button 
                onClick={() => {
                  setShowAllExpenses(!showAllExpenses);
                  if (showAllExpenses) {
                    setSearchQuery('');
                    setFilterCategory('');
                  }
                }}
                className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-md">
                  {showAllExpenses ? 'arrow_back' : 'visibility'}
                </span>
                {showAllExpenses ? 'Ver Recientes' : 'Ver Todos'}
              </button>
            </div>

            {showAllExpenses && (
              <div className="p-md bg-surface-container-low border-b border-outline-variant flex flex-col sm:flex-row gap-sm items-center justify-between animate-fade-in">
                <div className="relative w-full sm:w-72">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por descripción o monto..."
                    className="w-full bg-surface rounded-lg border border-outline-variant py-2 pl-9 pr-3 text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="flex gap-sm w-full sm:w-auto items-center">
                  <span className="font-label-md text-on-surface-variant hidden sm:inline">Filtrar por:</span>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full sm:w-48 bg-surface rounded-lg border border-outline-variant p-2 text-on-surface font-body-md focus:border-primary outline-none"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              {expenses.length === 0 ? (
                <div className="p-xl text-center text-on-surface-variant font-body-md">
                  No hay gastos registrados. ¡Anota el primero!
                </div>
              ) : displayedExpenses.length === 0 ? (
                <div className="p-xl text-center text-on-surface-variant font-body-md">
                  No se encontraron gastos que coincidan con la búsqueda.
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[550px]">
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
                    {displayedExpenses.map(expense => {
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
                          <td className="p-md font-medium">{parseDescription(expense.description).cleanDescription}</td>
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
                            <span 
                              className="w-6 h-6 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center font-label-sm text-label-sm"
                              title={`Pagado por: ${payer?.name || 'Unknown'}`}
                              aria-label={`Pagado por ${payer?.name || 'desconocido'}`}
                            >
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pb-20 md:pb-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
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
            
            <div className="overflow-y-auto">
            <form id="expenseForm" onSubmit={handleLogExpense} className="p-lg flex flex-col gap-md">
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
              
              <div className="flex flex-col sm:flex-row gap-md">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
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
                
                <div className="flex flex-col gap-1 flex-1 min-w-0">
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

              {/* Split Type Selector */}
              <div className="flex flex-col gap-1 w-full border-t border-outline-variant pt-md">
                <label className="font-label-md text-on-surface font-medium">División del Gasto</label>
                <select
                  value={splitType}
                  onChange={(e) => {
                    const newType = e.target.value as 'all' | 'custom' | 'loan';
                    setSplitType(newType);
                    if (newType === 'custom' && selectedSplitMembers.length === 0) {
                      setSelectedSplitMembers(members.map(m => m.user_id));
                    } else if (newType === 'loan' && selectedLoanDebtors.length === 0) {
                      const otherMember = members.find(m => m.user_id !== (expensePayerId || user?.id));
                      setSelectedLoanDebtors(otherMember ? [otherMember.user_id] : []);
                    }
                  }}
                  className="w-full bg-surface rounded-lg border border-outline-variant p-2 text-on-surface focus:border-primary outline-none"
                >
                  <option value="all">Dividir por igual entre todos</option>
                  <option value="custom">Dividir entre miembros seleccionados (2 o más)</option>
                  <option value="loan">Préstamo personal (Debido por 1 o más miembros)</option>
                </select>
              </div>

              {/* Custom Split Checkboxes */}
              {splitType === 'custom' && (
                <div className="flex flex-col gap-2 bg-surface-container-low p-3 rounded-lg border border-outline-variant animate-fade-in">
                  <label className="font-label-sm text-on-surface font-medium">¿Quiénes participan? (Mínimo 2)</label>
                  <div className="grid grid-cols-2 gap-sm">
                    {members.map(m => {
                      const isChecked = selectedSplitMembers.includes(m.user_id);
                      return (
                        <label key={m.user_id} className="flex items-center gap-2 cursor-pointer py-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedSplitMembers(selectedSplitMembers.filter(id => id !== m.user_id));
                              } else {
                                setSelectedSplitMembers([...selectedSplitMembers, m.user_id]);
                              }
                            }}
                            className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                          />
                          <span className="font-body-sm text-on-surface truncate">{m.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Personal Loan Checkboxes */}
              {splitType === 'loan' && (
                <div className="flex flex-col gap-2 bg-surface-container-low p-3 rounded-lg border border-outline-variant animate-fade-in">
                  <label className="font-label-sm text-on-surface font-medium">¿Quiénes deben saldar el préstamo? (1 o más)</label>
                  <div className="grid grid-cols-2 gap-sm">
                    {members
                      .filter(m => m.user_id !== (expensePayerId || user?.id))
                      .map(m => {
                        const isChecked = selectedLoanDebtors.includes(m.user_id);
                        return (
                          <label key={m.user_id} className="flex items-center gap-2 cursor-pointer py-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedLoanDebtors(selectedLoanDebtors.filter(id => id !== m.user_id));
                                } else {
                                  setSelectedLoanDebtors([...selectedLoanDebtors, m.user_id]);
                                }
                              }}
                              className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                            />
                            <span className="font-body-sm text-on-surface truncate">{m.name}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Paid Back Amounts (Abonos) */}
              {activeDebtors.length > 0 && (
                <div className="flex flex-col gap-2 bg-surface-container-low p-3 rounded-lg border border-outline-variant animate-fade-in mt-md">
                  <label className="font-label-md text-on-surface font-semibold">Abonos / Pagos Parciales Recibidos</label>
                  <p className="font-label-sm text-on-surface-variant mb-1">Registrá cuánto dinero te ha devuelto cada miembro para esta deuda.</p>
                  
                  <div className="flex flex-col gap-sm">
                    {activeDebtors.map(debtorId => {
                      const memberName = members.find(m => m.user_id === debtorId)?.name || 'Miembro';
                      const totalAmt = parseFloat(amount) || 0;
                      const shareAmount = splitType === 'custom'
                        ? totalAmt / Math.max(1, selectedSplitMembers.length)
                        : totalAmt / Math.max(1, selectedLoanDebtors.length);
                        
                      const paidVal = parseFloat(paidAmounts[debtorId] || '0') || 0;
                      const remainingDebt = Math.max(0, shareAmount - paidVal);
                      
                      return (
                        <div key={debtorId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm bg-surface p-2 rounded-md border border-outline-variant">
                          <div className="min-w-0">
                            <span className="block font-label-md text-on-surface truncate font-medium">{memberName}</span>
                            <span className="block font-body-xs text-on-surface-variant">
                              Deuda total: {formatCurrency(shareAmount)} | Pendiente: <strong className="text-primary">{formatCurrency(remainingDebt)}</strong>
                            </span>
                          </div>
                          <div className="relative w-32 shrink-0">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={shareAmount}
                              value={paidAmounts[debtorId] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPaidAmounts(prev => ({
                                  ...prev,
                                  [debtorId]: val
                                }));
                              }}
                              className="w-full bg-surface-container-lowest rounded-md border border-outline-variant py-1 pl-6 pr-2 text-on-surface text-sm focus:border-primary outline-none transition-all"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
            </form>
            </div>

            <div className="p-lg border-t border-outline-variant flex flex-col sm:flex-row sm:justify-between gap-sm shrink-0 bg-surface-container-lowest">
              {editingExpense ? (
                <button 
                  type="button"
                  onClick={handleDeleteExpense}
                  className="w-full sm:w-auto px-md py-2 rounded-lg font-label-md text-error border border-error/30 hover:bg-error-container transition-colors order-last sm:order-first"
                >
                  Eliminar
                </button>
              ) : <div className="hidden sm:block"></div>}
              <div className="flex flex-col-reverse sm:flex-row gap-sm w-full sm:w-auto">
                <button 
                  type="button"
                  onClick={closeExpenseModal}
                  className="w-full sm:w-auto px-md py-2 rounded-lg font-label-md text-on-surface-variant border border-outline-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  form="expenseForm"
                  className="w-full sm:w-auto px-md py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm"
                >
                  {editingExpense ? 'Guardar Cambios' : 'Guardar Gasto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pb-20 md:pb-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low shrink-0">
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
            
            <div className="overflow-y-auto">
            <form id="budgetForm" onSubmit={async (e) => {
              e.preventDefault();
              if (!activeHousehold) return;
              try {
                // Delete existing budgets for this household
                await insforge.database
                  .from('budgets')
                  .delete()
                  .eq('household_id', activeHousehold.id);
                  
                const budgetRows = [];
                
                // General budget
                const parsedGeneral = parseFloat(budgetAmount);
                if (!isNaN(parsedGeneral) && parsedGeneral >= 0) {
                  budgetRows.push({
                    household_id: activeHousehold.id,
                    category_id: null,
                    amount: parsedGeneral,
                    period: 'MONTHLY',
                    start_date: new Date().toISOString().split('T')[0]
                  });
                }

                // Category budgets
                Object.entries(categoryBudgets).forEach(([catId, amtStr]) => {
                  const amt = parseFloat(amtStr);
                  if (!isNaN(amt) && amt > 0) {
                    budgetRows.push({
                      household_id: activeHousehold.id,
                      category_id: catId,
                      amount: amt,
                      period: 'MONTHLY',
                      start_date: new Date().toISOString().split('T')[0]
                    });
                  }
                });

                if (budgetRows.length > 0) {
                  await insforge.database
                    .from('budgets')
                    .insert(budgetRows);
                }
                  
                setIsBudgetModalOpen(false);
                success('Presupuesto guardado', 'El presupuesto se ha guardado correctamente.');
              } catch (err: unknown) {
                showError('Error guardando presupuesto', getErrorMessage(err));
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

              {/* Category Budgets */}
              <div className="flex flex-col gap-sm border-t border-outline-variant pt-md">
                <label className="font-label-md text-on-surface font-medium">Presupuestos por Categoría (Opcional)</label>
                <p className="font-label-sm text-on-surface-variant mb-2">Define límites específicos para categorías individuales.</p>
                
                <div className="flex flex-col gap-sm max-h-[30vh] overflow-y-auto pr-xs">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between gap-md bg-surface-container-low p-2 rounded-lg border border-outline-variant">
                      <div className="flex items-center gap-sm min-w-0">
                        <span className="material-symbols-outlined text-primary shrink-0">{cat.icon}</span>
                        <span className="font-label-md text-on-surface truncate">{cat.name}</span>
                      </div>
                      <div className="relative w-32 shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={categoryBudgets[cat.id] || ''}
                          onChange={(e) => setCategoryBudgets({
                            ...categoryBudgets,
                            [cat.id]: e.target.value
                          })}
                          className="w-full bg-surface rounded-md border border-outline-variant py-1 pl-6 pr-2 text-on-surface text-sm focus:border-primary outline-none transition-all"
                          placeholder="Sin límite"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
            </div>
            
            <div className="p-lg border-t border-outline-variant flex justify-end gap-sm shrink-0 bg-surface-container-lowest">
              <button 
                type="button"
                onClick={() => setIsBudgetModalOpen(false)}
                className="px-md py-2 rounded-lg font-label-md text-secondary hover:bg-surface-container-high transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="budgetForm"
                className="px-md py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm"
              >
                Guardar Presupuesto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
