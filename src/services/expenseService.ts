import { insforge } from '@/lib/insforge';

export type ExpenseCategory = {
  id: string;
  household_id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
};

export type Expense = {
  id: string;
  household_id: string;
  payer_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  date: string;
  receipt_url: string | null;
  created_at: string;
  // Included from joins
  category?: ExpenseCategory;
};

export type Budget = {
  id: string;
  household_id: string;
  category_id: string | null;
  amount: number;
  period: string;
  start_date: string;
  created_at: string;
};

type ExpenseRow = Expense & { expense_categories?: ExpenseCategory | null };

export const getExpenseCategories = async (householdId: string): Promise<ExpenseCategory[]> => {
  const { data, error } = await insforge.database
    .from('expense_categories')
    .select('*')
    .eq('household_id', householdId)
    .order('name');
  
  if (error) throw error;
  return data;
};

export const createExpenseCategory = async (
  householdId: string, 
  data: Omit<ExpenseCategory, 'id' | 'household_id' | 'created_at'>
): Promise<ExpenseCategory> => {
  const { data: newCategory, error } = await insforge.database
    .from('expense_categories')
    .insert([{ ...data, household_id: householdId }])
    .select()
    .single();
    
  if (error) throw error;
  return newCategory;
};

export const getExpenses = async (householdId: string): Promise<Expense[]> => {
  const { data, error } = await insforge.database
    .from('expenses')
    .select(`
      *,
      expense_categories:category_id (*)
    `)
    .eq('household_id', householdId)
    .order('date', { ascending: false });
    
  if (error) throw error;
  
  // Transform data to map the joined category
  const rows = (data || []) as ExpenseRow[];
  return rows.map((item) => ({
    ...item,
    category: item.expense_categories || undefined
  }));
};

export const addExpense = async (
  householdId: string, 
  payerId: string, 
  data: Omit<Expense, 'id' | 'household_id' | 'payer_id' | 'created_at' | 'category'>
): Promise<Expense> => {
  const { data: newExpense, error } = await insforge.database
    .from('expenses')
    .insert([{ 
      ...data, 
      household_id: householdId, 
      payer_id: payerId 
    }])
    .select()
    .single();
    
  if (error) throw error;
  return newExpense;
};

export const updateExpense = async (
  id: string,
  data: Partial<Omit<Expense, 'id' | 'household_id' | 'created_at' | 'category'>>
): Promise<Expense> => {
  const { data: updatedExpense, error } = await insforge.database
    .from('expenses')
    .update(data)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return updatedExpense;
};

export const deleteExpense = async (id: string): Promise<void> => {
  const { error } = await insforge.database
    .from('expenses')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
};

export const getBudgets = async (householdId: string): Promise<Budget[]> => {
  const { data, error } = await insforge.database
    .from('budgets')
    .select('*')
    .eq('household_id', householdId);
    
  if (error) throw error;
  return data;
};

export const addBudget = async (
  householdId: string,
  data: Omit<Budget, 'id' | 'household_id' | 'created_at'>
): Promise<Budget> => {
  const { data: newBudget, error } = await insforge.database
    .from('budgets')
    .insert([{ ...data, household_id: householdId }])
    .select()
    .single();
    
  if (error) throw error;
  return newBudget;
};

export const getMonthlyBudget = async (
  householdId: string,
  year: number,
  month: number
): Promise<Budget | null> => {
  const allBudgets = await getBudgets(householdId);
  if (!allBudgets || allBudgets.length === 0) return null;

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  
  // Specific budget for this month and year
  const specificBudget = allBudgets.find(
    (b) => b.period === 'MONTHLY' && b.start_date && b.start_date.startsWith(monthPrefix)
  );
  if (specificBudget) return specificBudget;

  // Fallback: general baseline monthly budget
  const baselineBudget = allBudgets.find((b) => b.period === 'MONTHLY');
  return baselineBudget || null;
};

export const setMonthlyBudget = async (
  householdId: string,
  amount: number,
  year: number,
  month: number
): Promise<Budget> => {
  const allBudgets = await getBudgets(householdId);
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const startDate = `${monthPrefix}-01`;

  const existing = allBudgets.find(
    (b) => b.period === 'MONTHLY' && b.start_date && b.start_date.startsWith(monthPrefix)
  );

  if (existing) {
    const { data: updated, error } = await insforge.database
      .from('budgets')
      .update({ amount })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return updated as Budget;
  }

  // Create new monthly budget
  const { data: created, error } = await insforge.database
    .from('budgets')
    .insert([{
      household_id: householdId,
      amount,
      period: 'MONTHLY',
      start_date: startDate,
      category_id: null,
    }])
    .select()
    .single();

  if (error) throw error;
  return created as Budget;
};

