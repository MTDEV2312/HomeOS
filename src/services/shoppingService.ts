import { insforge } from '@/lib/insforge';

export type ShoppingList = {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type ShoppingListItem = {
  id: string;
  list_id: string;
  added_by: string;
  item_name: string;
  quantity: string | null;
  category: string | null;
  is_purchased: boolean;
  purchased_at: string | null;
  purchased_by: string | null;
  price: number | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export const getShoppingLists = async (householdId: string): Promise<ShoppingList[]> => {
  const { data, error } = await insforge.database
    .from('shopping_lists')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ShoppingList[];
};

export const createShoppingList = async (
  householdId: string, 
  name: string, 
  description?: string
): Promise<ShoppingList> => {
  const { data, error } = await insforge.database
    .from('shopping_lists')
    .insert([{ household_id: householdId, name, description }])
    .select()
    .single();

  if (error) throw error;
  return data as ShoppingList;
};

export const updateShoppingList = async (
  listId: string, 
  updates: Partial<ShoppingList>
): Promise<ShoppingList> => {
  const { data, error } = await insforge.database
    .from('shopping_lists')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', listId)
    .select()
    .single();

  if (error) throw error;
  return data as ShoppingList;
};

export const deleteShoppingList = async (listId: string): Promise<void> => {
  const { error } = await insforge.database
    .from('shopping_lists')
    .delete()
    .eq('id', listId);

  if (error) throw error;
};

export const getShoppingListItems = async (listId: string): Promise<ShoppingListItem[]> => {
  const { data, error } = await insforge.database
    .from('shopping_list_items')
    .select('*')
    .eq('list_id', listId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as ShoppingListItem[];
};

export const getAllItemsForHousehold = async (householdId: string): Promise<ShoppingListItem[]> => {
  // Fetch all lists for the household
  const { data: lists, error: listsError } = await insforge.database
    .from('shopping_lists')
    .select('id')
    .eq('household_id', householdId);

  if (listsError) throw listsError;
  if (!lists || lists.length === 0) return [];

  const listIds = lists.map(l => l.id);

  // Fetch all items belonging to those lists
  const { data: items, error: itemsError } = await insforge.database
    .from('shopping_list_items')
    .select('*')
    .in('list_id', listIds);

  if (itemsError) throw itemsError;
  return items as ShoppingListItem[];
};

export const addShoppingListItem = async (
  listId: string,
  addedBy: string,
  itemData: { item_name: string; quantity?: string; category?: string; assigned_to?: string }
): Promise<ShoppingListItem> => {
  const { data, error } = await insforge.database
    .from('shopping_list_items')
    .insert([{ 
      list_id: listId, 
      added_by: addedBy, 
      item_name: itemData.item_name,
      quantity: itemData.quantity,
      category: itemData.category,
      assigned_to: itemData.assigned_to
    }])
    .select()
    .single();

  if (error) throw error;
  return data as ShoppingListItem;
};

export const updateShoppingListItem = async (
  itemId: string,
  updates: Partial<ShoppingListItem>
): Promise<ShoppingListItem> => {
  const { data, error } = await insforge.database
    .from('shopping_list_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as ShoppingListItem;
};

export const deleteShoppingListItem = async (itemId: string): Promise<void> => {
  const { error } = await insforge.database
    .from('shopping_list_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
};
