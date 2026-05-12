import { insforge } from '@/lib/insforge';

export interface InventoryCategory {
  id: string;
  household_id: string;
  name: string;
  icon: string;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  household_id: string;
  category_id?: string;
  name: string;
  brand?: string;
  current_quantity: number;
  unit: string;
  minimum_threshold: number;
  expiration_date?: string;
  location?: string;
  last_restocked_at?: string;
  created_at?: string;
  category?: InventoryCategory;
}

export async function getInventoryCategories(householdId: string): Promise<InventoryCategory[]> {
  const { data, error } = await insforge.database
    .from('inventory_categories')
    .select('*')
    .eq('household_id', householdId)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function createInventoryCategory(householdId: string, category: Partial<InventoryCategory>): Promise<InventoryCategory> {
  const { data, error } = await insforge.database
    .from('inventory_categories')
    .insert([{
      ...category,
      household_id: householdId
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInventoryCategory(categoryId: string): Promise<void> {
  const { error } = await insforge.database
    .from('inventory_categories')
    .delete()
    .eq('id', categoryId);

  if (error) throw error;
}

export async function getInventoryItems(householdId: string): Promise<InventoryItem[]> {
  const { data, error } = await insforge.database
    .from('inventory_items')
    .select('*, category:inventory_categories(id, name, icon)')
    .eq('household_id', householdId)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function addInventoryItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
  const { data, error } = await insforge.database
    .from('inventory_items')
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInventoryItem(itemId: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
  const { data, error } = await insforge.database
    .from('inventory_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
  const { error } = await insforge.database
    .from('inventory_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}
