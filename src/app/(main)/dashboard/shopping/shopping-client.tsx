'use client';

import { useState, useEffect } from 'react';
import { useHousehold } from '@/lib/household-context';
import { useAuth } from '@/lib/auth-context';
import { insforge } from '@/lib/insforge';
import { 
  ShoppingList, 
  ShoppingListItem, 
  getShoppingLists, 
  getAllItemsForHousehold, 
  createShoppingList,
  addShoppingListItem,
  updateShoppingListItem,
  updateShoppingList,
  deleteShoppingList,
  deleteShoppingListItem
} from '@/services/shoppingService';
import { getHouseholdMembers, HouseholdMemberDetails } from '@/services/householdService';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from '@/lib/toast-context';
import { getErrorMessage } from '@/lib/errors';

export default function ShoppingClient() {
  const { activeHousehold } = useHousehold();
  const { user } = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [members, setMembers] = useState<HouseholdMemberDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error: showError } = useToast();

  // Modals state
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [activeListId, setActiveListId] = useState<string | null>(null);

  // Form states
  const [newListName, setNewListName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemAssignedTo, setNewItemAssignedTo] = useState('unassigned');

  // Edit states
  const [isEditingListName, setIsEditingListName] = useState(false);
  const [editedListName, setEditedListName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemForm, setEditItemForm] = useState({
    item_name: '',
    quantity: '',
    category: '',
    assigned_to: 'unassigned'
  });

  useEffect(() => {
    if (!activeHousehold) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [fetchedLists, fetchedItems, fetchedMembers] = await Promise.all([
          getShoppingLists(activeHousehold.id),
          getAllItemsForHousehold(activeHousehold.id),
          getHouseholdMembers(activeHousehold.id)
        ]);
        setLists(fetchedLists);
        setItems(fetchedItems);
        setMembers(fetchedMembers);
      } catch (err: unknown) {
        console.error('Error loading shopping data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const setupRealtime = async () => {
      try {
        await insforge.realtime.connect();
        const channelName = `household:${activeHousehold.id}`;
        await insforge.realtime.subscribe(channelName);

        insforge.realtime.on('INSERT_shopping_lists', (payload: ShoppingList) => {
          setLists(prev => prev.find(l => l.id === payload.id) ? prev : [payload, ...prev]);
        });
        insforge.realtime.on('UPDATE_shopping_lists', (payload: ShoppingList) => {
          setLists(prev => prev.map(l => l.id === payload.id ? payload : l));
        });
        insforge.realtime.on('DELETE_shopping_lists', (payload: ShoppingList) => {
          setLists(prev => prev.filter(l => l.id !== payload.id));
          setItems(prev => prev.filter(i => i.list_id !== payload.id)); // local cleanup
        });
        
        insforge.realtime.on('INSERT_shopping_list_items', (payload: ShoppingListItem) => {
          setItems(prev => prev.find(i => i.id === payload.id) ? prev : [...prev, payload]);
        });
        insforge.realtime.on('UPDATE_shopping_list_items', (payload: ShoppingListItem) => {
          setItems(prev => prev.map(i => i.id === payload.id ? payload : i));
        });
        insforge.realtime.on('DELETE_shopping_list_items', (payload: ShoppingListItem) => {
          setItems(prev => prev.filter(i => i.id !== payload.id));
        });
      } catch (err) {
        console.error('Error setting up realtime:', err);
      }
    };

    setupRealtime();

    return () => {
      if (activeHousehold) {
        insforge.realtime.unsubscribe(`household:${activeHousehold.id}`);
      }
    };
  }, [activeHousehold]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold || !newListName.trim()) return;
    
    try {
      const newList = await createShoppingList(activeHousehold.id, newListName);
      setLists([newList, ...lists]);
      setIsCreateListModalOpen(false);
      setNewListName('');
    } catch (err: unknown) {
      showError('Error al crear la lista', getErrorMessage(err));
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!window.confirm('¿Seguro que querés eliminar esta lista?')) return;
    try {
      await deleteShoppingList(listId);
      setLists(lists.filter(l => l.id !== listId));
    } catch (err: unknown) {
      showError('Error al eliminar la lista', getErrorMessage(err));
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold || !activeListId || !newItemName.trim()) return;
    
    const currentUserId = user?.id || members[0]?.user_id;
    if (!currentUserId) {
      showError('No se pudo identificar el usuario', 'Iniciá sesión nuevamente.');
      return;
    }

    try {
      await addShoppingListItem(activeListId, currentUserId, {
        item_name: newItemName,
        quantity: newItemQuantity,
        category: newItemCategory || undefined,
        assigned_to: newItemAssignedTo === 'unassigned' ? undefined : newItemAssignedTo
      });
      // The realtime subscription will add the item to the list automatically, 
      // but if we do it here too, it might duplicate or be faster. Realtime handles it.
      // setItems([...items, newItem]); 
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemCategory('');
      setNewItemAssignedTo('unassigned');
    } catch (err: unknown) {
      showError('Error al agregar item', getErrorMessage(err));
    }
  };

  const handleToggleItem = async (item: ShoppingListItem) => {
    try {
      const updated = await updateShoppingListItem(item.id, { 
        is_purchased: !item.is_purchased,
        purchased_at: !item.is_purchased ? new Date().toISOString() : null,
      });
      setItems(items.map(i => i.id === item.id ? updated : i));
    } catch (err: unknown) {
      showError('Error actualizando item', getErrorMessage(err));
    }
  };

  // Edit list name
  const startEditListName = () => {
    if (activeList) {
      setEditedListName(activeList.name);
      setIsEditingListName(true);
    }
  };

  const handleSaveListName = async () => {
    if (!activeListId || !editedListName.trim()) return;
    try {
      const updated = await updateShoppingList(activeListId, { name: editedListName });
      setLists(lists.map(l => l.id === activeListId ? updated : l));
      setIsEditingListName(false);
    } catch (err: unknown) {
      showError('Error actualizando lista', getErrorMessage(err));
    }
  };

  // Start editing item
  const startEditItem = (item: ShoppingListItem) => {
    setEditingItemId(item.id);
    setEditItemForm({
      item_name: item.item_name,
      quantity: item.quantity || '',
      category: item.category || '',
      assigned_to: item.assigned_to || 'unassigned'
    });
  };

  // Save item edit
  const handleSaveItem = async () => {
    if (!editingItemId) return;
    try {
      const updated = await updateShoppingListItem(editingItemId, {
        item_name: editItemForm.item_name,
        quantity: editItemForm.quantity || undefined,
        category: editItemForm.category || undefined,
        assigned_to: editItemForm.assigned_to === 'unassigned' ? undefined : editItemForm.assigned_to
      });
      setItems(items.map(i => i.id === editingItemId ? updated : i));
      setEditingItemId(null);
    } catch (err: unknown) {
      showError('Error actualizando item', getErrorMessage(err));
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('¿Eliminar este item?')) return;
    try {
      await deleteShoppingListItem(itemId);
      setItems(items.filter(i => i.id !== itemId));
    } catch (err: unknown) {
      showError('Error eliminando item', getErrorMessage(err));
    }
  };

  if (!activeHousehold) {
    return <div className="p-8">Seleccioná un hogar primero.</div>;
  }

  if (isLoading) {
    return <div className="p-8 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const activeList = lists.find(l => l.id === activeListId);
  const activeListItems = activeListId ? items.filter(i => i.list_id === activeListId) : [];

  return (
    <div className="flex flex-col gap-xl w-full min-w-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md mb-lg">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface mb-xs">Shopping</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Gestioná tus listas de compras y suministros.</p>
        </div>
        <button 
          onClick={() => setIsCreateListModalOpen(true)}
          className="inline-flex items-center justify-center gap-sm bg-primary text-on-primary font-label-md text-label-md px-lg py-3 rounded-full hover:bg-primary/90 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nueva Lista
        </button>
      </div>

      {/* Bento Grid Layout for Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {lists.map(list => {
          const listItems = items.filter(i => i.list_id === list.id);
          const completedCount = listItems.filter(i => i.is_purchased).length;
          const totalCount = listItems.length;
          const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
          
          return (
            <div key={list.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-lg shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow flex flex-col h-full">
              <div className="flex justify-between items-start mb-md">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined material-symbols-filled">local_mall</span>
                  </div>
                  <div>
                    <h3 className="font-h3 text-h3 text-on-surface">{list.name}</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-unit">
                      {list.updated_at ? `Actualizado ${formatDistanceToNow(parseISO(list.updated_at), { addSuffix: true })}` : ''}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDeleteList(list.id)} className="text-on-surface-variant hover:text-error transition-colors">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>

              {/* Progress */}
              <div className="mb-md">
                <div className="flex justify-between items-center mb-unit">
                  <span className="font-label-md text-label-md text-on-surface-variant">{completedCount}/{totalCount} items</span>
                  <span className="font-label-md text-label-md text-primary font-bold">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              {/* Preview Items */}
              <ul className="flex-1 flex flex-col gap-unit">
                {listItems.slice(0, 3).map(item => (
                  <li key={item.id} className="flex items-center gap-sm py-xs border-b border-outline-variant/20 last:border-0" onClick={() => handleToggleItem(item)}>
                    <span className={`material-symbols-outlined text-[20px] cursor-pointer ${item.is_purchased ? 'text-primary' : 'text-outline-variant'}`}>
                      {item.is_purchased ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <div className="flex-1 overflow-hidden">
                      <span className={`font-body-md text-body-md truncate block ${item.is_purchased ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                        {item.item_name} {item.quantity && <span className="text-on-surface-variant text-sm">({item.quantity})</span>}
                      </span>
                      {(item.category || item.assigned_to) && (
                        <div className="flex gap-2 mt-1">
                          {item.category && <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full">{item.category}</span>}
                          {item.assigned_to && <span className="text-[10px] bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full">{members.find(m => m.user_id === item.assigned_to)?.name || 'Asignado'}</span>}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
                {totalCount > 3 && (
                  <li className="text-label-sm text-on-surface-variant italic mt-1">+ {totalCount - 3} más...</li>
                )}
                {totalCount === 0 && (
                  <li className="text-label-sm text-on-surface-variant italic">Lista vacía.</li>
                )}
              </ul>

              <div className="mt-md pt-md border-t border-outline-variant/20 flex justify-end items-center">
                <button 
                  onClick={() => setActiveListId(list.id)}
                  className="font-label-md text-label-md text-primary hover:underline"
                >
                  Ver Todo / Editar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create List Modal */}
      {isCreateListModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pb-20 md:pb-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-lg shadow-xl">
            <h2 className="font-h2 text-h2 mb-md">Nueva Lista de Compras</h2>
            <form onSubmit={handleCreateList}>
              <div className="mb-4">
                <label className="block font-label-md text-on-surface-variant mb-2">Nombre de la lista</label>
                <input 
                  type="text" 
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full bg-surface rounded-lg border border-outline-variant p-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Ej: Supermercado Semanal"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsCreateListModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md hover:bg-primary/90 transition-colors"
                >
                  Crear Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List Details Modal (View All) */}
      {activeListId && activeList && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pb-20 md:pb-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-2xl w-full p-3 sm:p-lg shadow-xl flex flex-col max-h-[85vh]">
            {/* Header with editable list name */}
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-md mb-md shrink-0">
              <div className="flex items-center gap-sm flex-1">
                <span className="material-symbols-outlined text-primary material-symbols-filled">local_mall</span>
                {isEditingListName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editedListName}
                      onChange={(e) => setEditedListName(e.target.value)}
                      className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface font-h3 text-h3 focus:border-primary outline-none"
                      autoFocus
                    />
                    <button 
                      onClick={handleSaveListName}
                      className="p-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90"
                    >
                      <span className="material-symbols-outlined text-[20px]">check</span>
                    </button>
                    <button 
                      onClick={() => setIsEditingListName(false)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                ) : (
                  <h2 className="font-h2 text-h2 text-on-surface flex-1">{activeList.name}</h2>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!isEditingListName && (
                  <button 
                    onClick={startEditListName}
                    className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container transition-colors"
                    title="Editar nombre"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                )}
                <button onClick={() => { setActiveListId(null); setIsEditingListName(false); }} className="text-on-surface-variant hover:text-on-surface rounded-full p-1 hover:bg-surface-container-high">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Section: Items List */}
            <div className="flex-1 overflow-hidden flex flex-col mb-md">
              <div className="flex items-center justify-between mb-sm px-1">
                <h3 className="font-label-lg text-label-lg text-on-surface-variant">Items de la lista</h3>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{activeListItems.length} items</span>
              </div>
              
              <div className="overflow-y-auto flex-1 pr-2 border border-outline-variant/30 rounded-lg bg-surface-container-low">
                <ul className="flex flex-col gap-1 p-2">
                  {activeListItems.map(item => (
                    <li key={item.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-container-lowest transition-colors group">
                      <button 
                        onClick={() => handleToggleItem(item)}
                        className={`material-symbols-outlined text-[22px] shrink-0 ${item.is_purchased ? 'text-primary' : 'text-outline-variant hover:text-primary'}`}
                      >
                        {item.is_purchased ? 'check_circle' : 'radio_button_unchecked'}
                      </button>
                      
                      {editingItemId === item.id ? (
                        // Editing mode
                        <div className="flex-1 flex flex-wrap gap-2 items-center bg-surface-container-lowest p-2 rounded border border-primary">
                          <input
                            type="text"
                            value={editItemForm.item_name}
                            onChange={(e) => setEditItemForm({...editItemForm, item_name: e.target.value})}
                            className="flex-1 min-w-[120px] bg-surface border border-outline-variant rounded px-2 py-1 text-on-surface text-sm"
                            placeholder="Nombre"
                          />
                          <input
                            type="text"
                            value={editItemForm.quantity}
                            onChange={(e) => setEditItemForm({...editItemForm, quantity: e.target.value})}
                            className="w-20 bg-surface border border-outline-variant rounded px-2 py-1 text-on-surface text-sm"
                            placeholder="Cant."
                          />
                          <select
                            value={editItemForm.category}
                            onChange={(e) => setEditItemForm({...editItemForm, category: e.target.value})}
                            className="bg-surface border border-outline-variant rounded px-2 py-1 text-on-surface text-sm"
                          >
                            <option value="">Sin cat.</option>
                            <option value="Supermercado">Supermercado</option>
                            <option value="Verdulería">Verdulería</option>
                            <option value="Carnicería">Carnicería</option>
                            <option value="Limpieza">Limpieza</option>
                            <option value="Farmacia">Farmacia</option>
                          </select>
                          <button 
                            onClick={handleSaveItem}
                            className="p-1 rounded bg-primary text-on-primary"
                          >
                            <span className="material-symbols-outlined text-[18px]">check</span>
                          </button>
                          <button 
                            onClick={() => setEditingItemId(null)}
                            className="p-1 rounded text-on-surface-variant hover:bg-surface"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      ) : (
                        // Normal display
                        <div className="flex-1 flex justify-between items-center flex-wrap gap-1 min-w-0">
                          <div className="flex flex-col min-w-0">
                            <span className={`font-body-md text-body-md truncate ${item.is_purchased ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                              {item.item_name}
                            </span>
                            {(item.category || item.assigned_to) && (
                              <div className="flex gap-1.5 mt-0.5">
                                {item.category && <span className="text-[10px] bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded-full">{item.category}</span>}
                                {item.assigned_to && <span className="text-[10px] bg-primary-container text-on-primary-container px-1.5 py-0.5 rounded-full">{members.find(m => m.user_id === item.assigned_to)?.name || 'Asignado'}</span>}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {item.quantity && (
                              <span className="font-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded whitespace-nowrap">
                                {item.quantity}
                              </span>
                            )}
                            <button 
                              onClick={() => startEditItem(item)}
                              className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container opacity-0 group-hover:opacity-100 transition-all"
                              title="Editar"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container opacity-0 group-hover:opacity-100 transition-all"
                              title="Eliminar"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                  {activeListItems.length === 0 && (
                    <div className="text-center py-8 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[40px] opacity-50 mb-2 block">shopping_cart</span>
                      <p className="font-body-md">No hay items en esta lista.</p>
                    </div>
                  )}
                </ul>
              </div>
            </div>

            {/* Section: Add Item Form - Separated visually */}
            <div className="shrink-0 bg-surface-container-low p-md rounded-xl border border-outline-variant/50">
              <div className="flex items-center gap-sm mb-sm">
                <span className="material-symbols-outlined text-primary text-[18px]">add_circle</span>
                <h3 className="font-label-lg text-label-lg text-on-surface">Agregar nuevo item</h3>
              </div>
              <form onSubmit={handleAddItem} className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="flex-1 bg-surface-container-lowest rounded-lg border border-outline-variant px-3 py-2.5 text-on-surface focus:border-primary outline-none text-sm"
                    placeholder="Nombre del item..."
                    required
                  />
                  <input 
                    type="text" 
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    className="w-full sm:w-24 bg-surface-container-lowest rounded-lg border border-outline-variant px-3 py-2.5 text-on-surface focus:border-primary outline-none text-sm"
                    placeholder="Cant."
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="col-span-2 sm:col-span-1 bg-surface-container-lowest rounded-lg border border-outline-variant px-2 py-2.5 text-on-surface focus:border-primary outline-none text-sm"
                  >
                    <option value="">Sin categoría</option>
                    <option value="Supermercado">Supermercado</option>
                    <option value="Verdulería">Verdulería</option>
                    <option value="Carnicería">Carnicería</option>
                    <option value="Limpieza">Limpieza</option>
                    <option value="Farmacia">Farmacia</option>
                    <option value="Ferretería">Ferretería</option>
                    <option value="Otros">Otros</option>
                  </select>
                  
                  <select
                    value={newItemAssignedTo}
                    onChange={(e) => setNewItemAssignedTo(e.target.value)}
                    className="col-span-2 sm:col-span-1 bg-surface-container-lowest rounded-lg border border-outline-variant px-2 py-2.5 text-on-surface focus:border-primary outline-none text-sm"
                  >
                    <option value="unassigned">Cualquiera</option>
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.name}</option>
                    ))}
                  </select>
                  
                  <button 
                    type="submit"
                    className="col-span-2 sm:col-span-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors shadow-sm font-label-md text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Agregar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
