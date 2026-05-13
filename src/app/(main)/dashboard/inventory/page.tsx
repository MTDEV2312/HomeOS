'use client';

import { useEffect, useState } from 'react';
import { useHousehold } from '@/lib/household-context';
import { useAuth } from '@/lib/auth-context';
import { insforge } from '@/lib/insforge';
import { 
  InventoryItem, 
  InventoryCategory, 
  getInventoryItems, 
  getInventoryCategories, 
  createInventoryCategory, 
  addInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem 
} from '@/services/inventoryService';
import { getShoppingLists, createShoppingList, addShoppingListItem, ShoppingList } from '@/services/shoppingService';
import { useToast } from '@/lib/toast-context';

export default function InventoryDashboard() {
  const { activeHousehold } = useHousehold();
  const { user } = useAuth();
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, success, error: showError } = useToast();
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Item Form State
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('unidades');
  const [minThreshold, setMinThreshold] = useState('');
  const [location, setLocation] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!activeHousehold) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [loadedItems, loadedCategories, loadedLists] = await Promise.all([
          getInventoryItems(activeHousehold.id),
          getInventoryCategories(activeHousehold.id),
          getShoppingLists(activeHousehold.id)
        ]);
        
        setItems(loadedItems);
        setShoppingLists(loadedLists);
        
        if (loadedCategories.length === 0) {
          const defaultCats = [
            { name: 'Despensa', icon: 'kitchen' },
            { name: 'Limpieza', icon: 'cleaning_services' },
            { name: 'Botiquín', icon: 'medical_services' },
            { name: 'Baño', icon: 'bathtub' },
            { name: 'Herramientas', icon: 'handyman' }
          ];
          
          for (const cat of defaultCats) {
            try {
              await createInventoryCategory(activeHousehold.id, cat);
            } catch (e: any) {
              if (e.code !== '23505') console.error(e);
            }
          }
          const finalCategories = await getInventoryCategories(activeHousehold.id);
          setCategories(finalCategories);
        } else {
          setCategories(loadedCategories);
        }
      } catch (err: any) {
        console.error("Error loading inventory:", JSON.stringify(err, null, 2));
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
        
        insforge.realtime.on('INSERT_inventory_items', (payload: any) => {
          setCategories(cats => {
            const item = { ...payload, category: cats.find(c => c.id === payload.category_id) };
            setItems(prev => prev.find(i => i.id === payload.id) ? prev : [item, ...prev]);
            return cats;
          });
        });
        
        insforge.realtime.on('UPDATE_inventory_items', (payload: any) => {
          setCategories(cats => {
            const item = { ...payload, category: cats.find(c => c.id === payload.category_id) };
            setItems(prev => prev.map(i => i.id === payload.id ? item : i));
            return cats;
          });
        });
        
        insforge.realtime.on('DELETE_inventory_items', (payload: any) => {
          setItems(prev => prev.filter(i => i.id !== payload.id));
        });
        
        insforge.realtime.on('INSERT_inventory_categories', () => loadData());
        insforge.realtime.on('UPDATE_inventory_categories', () => loadData());
        insforge.realtime.on('DELETE_inventory_categories', () => loadData());
        
      } catch (err) {
        console.error('Error setting up realtime:', err);
      }
    };
    
    setupRealtime();
    
    return () => {
      insforge.realtime.unsubscribe(`household:${activeHousehold.id}`);
    };
  }, [activeHousehold]);

  const openItemModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setBrand(item.brand || '');
      setQuantity(item.current_quantity.toString());
      setUnit(item.unit);
      setMinThreshold(item.minimum_threshold.toString());
      setLocation(item.location || '');
      setExpirationDate(item.expiration_date || '');
      setCategoryId(item.category_id || '');
    } else {
      setEditingItem(null);
      setName('');
      setBrand('');
      setQuantity('');
      setUnit('unidades');
      setMinThreshold('');
      setLocation('');
      setExpirationDate('');
      setCategoryId(categories[0]?.id || '');
    }
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => setIsItemModalOpen(false);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold) return;
    
    try {
      const payload: Partial<InventoryItem> = {
        household_id: activeHousehold.id,
        category_id: categoryId || undefined,
        name,
        brand,
        current_quantity: parseFloat(quantity),
        unit,
        minimum_threshold: parseFloat(minThreshold),
        location,
        expiration_date: expirationDate || undefined,
        last_restocked_at: new Date().toISOString()
      };
      
      if (editingItem) {
        await updateInventoryItem(editingItem.id, payload);
      } else {
        await addInventoryItem(payload);
      }
      closeItemModal();
      success('Ítem guardado', 'El ítem se ha guardado correctamente en el inventario.');
    } catch (err: any) {
      console.error("Error saving item:", err);
      showError('Error al guardar el ítem', err.message || 'Error desconocido');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este ítem?')) {
      try {
        await deleteInventoryItem(id);
        success('Ítem eliminado', 'El ítem se ha eliminado del inventario.');
      } catch (err: any) {
        console.error('Error deleting item:', err);
        showError('Error al eliminar el ítem', err.message || 'Error desconocido');
      }
    }
  };

  const handleAdjustQuantity = async (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, Number(item.current_quantity) + delta);
    try {
      await updateInventoryItem(item.id, { current_quantity: newQty });
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const handleAddToShoppingList = async (item: InventoryItem) => {
    if (!activeHousehold || !user) return;
    
    try {
      let targetListId = shoppingLists[0]?.id;
      
      if (!targetListId) {
        const newList = await createShoppingList(activeHousehold.id, 'Lista General', 'Creada automáticamente desde inventario');
        setShoppingLists([newList]);
        targetListId = newList.id;
      }
      
      const qtyNeeded = Math.max(1, Number(item.minimum_threshold) - Number(item.current_quantity));
      
      await addShoppingListItem(targetListId, user.id, {
        item_name: item.name,
        quantity: `${qtyNeeded} ${item.unit}`,
        category: item.category?.name || 'Despensa'
      });
      
      success('Añadido a la lista', `"${item.name}" añadido a la lista de compras.`);
    } catch (err: any) {
      console.error('Error adding to shopping list:', err);
      showError('Error al añadir a la lista', err.message || 'Hubo un error al añadir a la lista de compras.');
    }
  };

  if (!activeHousehold) {
    return <div className="p-margin">Cargando contexto del hogar...</div>;
  }

  const filteredItems = items.filter(item => {
    if (filterCategory !== 'all' && item.category_id !== filterCategory) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(item.brand?.toLowerCase() || '').includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const lowStockItems = items.filter(i => Number(i.current_quantity) <= Number(i.minimum_threshold));
  const expiringSoonItems = items.filter(i => {
    if (!i.expiration_date) return false;
    const diffTime = Math.abs(new Date(i.expiration_date).getTime() - new Date().getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 30 && new Date(i.expiration_date) >= new Date();
  });

  return (
    <div className="flex flex-col gap-xl w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Inventario</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Control de alacena, insumos y herramientas
          </p>
        </div>
        <button 
          onClick={() => openItemModal()}
          className="w-full sm:w-auto px-lg py-sm rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm"
        >
          <span className="material-symbols-outlined">add</span>
          Agregar Ítem
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm">
          <div className="flex items-center gap-sm mb-2 text-on-surface-variant">
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="font-label-md text-label-md">Total de Ítems</span>
          </div>
          <div className="font-h2 text-h2 text-on-surface">{items.length}</div>
        </div>
        
        <div className="bg-error-container rounded-xl p-lg border border-error shadow-sm">
          <div className="flex items-center gap-sm mb-2 text-on-error-container">
            <span className="material-symbols-outlined">warning</span>
            <span className="font-label-md text-label-md">Stock Bajo</span>
          </div>
          <div className="font-h2 text-h2 text-error">{lowStockItems.length}</div>
        </div>

        <div className="bg-tertiary-container rounded-xl p-lg border border-tertiary shadow-sm">
          <div className="flex items-center gap-sm mb-2 text-on-tertiary-container">
            <span className="material-symbols-outlined">event_busy</span>
            <span className="font-label-md text-label-md">Por Vencer (30 días)</span>
          </div>
          <div className="font-h2 text-h2 text-tertiary">{expiringSoonItems.length}</div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        <div className="p-lg border-b border-outline-variant flex flex-col sm:flex-row gap-md justify-between items-center">
          <div className="flex gap-sm overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
            <button 
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-colors ${filterCategory === 'all' ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap flex items-center gap-1 transition-colors ${filterCategory === cat.id ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              type="text" 
              placeholder="Buscar ítem..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low rounded-lg pl-10 pr-4 py-2 font-body-md text-on-surface placeholder:text-on-surface-variant border-none focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && items.length === 0 ? (
            <div className="flex justify-center p-xl">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-xl text-center text-on-surface-variant font-body-md">
              No hay ítems para mostrar.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-label-md text-label-md text-on-surface-variant">
                  <th className="p-md font-medium">Producto</th>
                  <th className="p-md font-medium">Categoría</th>
                  <th className="p-md font-medium">Ubicación</th>
                  <th className="p-md font-medium text-center">Stock</th>
                  <th className="p-md font-medium">Vencimiento</th>
                  <th className="p-md font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant">
                {filteredItems.map(item => {
                  const isLowStock = Number(item.current_quantity) <= Number(item.minimum_threshold);
                  
                  return (
                    <tr key={item.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="p-md">
                        <div className="font-medium text-on-surface flex items-center gap-2">
                          {isLowStock && <span className="material-symbols-outlined text-error text-[18px]" title="Stock Bajo">warning</span>}
                          {item.name}
                        </div>
                        {item.brand && <div className="text-sm text-on-surface-variant">{item.brand}</div>}
                      </td>
                      <td className="p-md">
                        {item.category ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs">
                            <span className="material-symbols-outlined text-[14px]">{item.category.icon}</span>
                            {item.category.name}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-md text-on-surface-variant">{item.location || '-'}</td>
                      <td className="p-md">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleAdjustQuantity(item, -1)}
                            className="w-6 h-6 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-[16px]">remove</span>
                          </button>
                          <div className={`font-medium min-w-[3ch] text-center ${isLowStock ? 'text-error' : ''}`}>
                            {item.current_quantity}
                          </div>
                          <button 
                            onClick={() => handleAdjustQuantity(item, 1)}
                            className="w-6 h-6 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                          </button>
                          <span className="text-on-surface-variant text-sm ml-1">{item.unit}</span>
                        </div>
                      </td>
                      <td className="p-md" suppressHydrationWarning>
                        {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-md text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleAddToShoppingList(item)} 
                            className="text-on-surface-variant hover:text-primary transition-colors"
                            title="Añadir a lista de compras"
                          >
                            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                          </button>
                          <button onClick={() => openItemModal(item)} className="text-on-surface-variant hover:text-primary transition-colors" title="Editar">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button onClick={() => handleDeleteItem(item.id)} className="text-on-surface-variant hover:text-error transition-colors" title="Eliminar">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isItemModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pb-20 md:pb-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low shrink-0">
              <h2 className="font-h3 text-h3 text-on-surface font-semibold flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">{editingItem ? 'edit' : 'inventory_2'}</span>
                {editingItem ? 'Editar Ítem' : 'Agregar Ítem'}
              </h2>
              <button 
                onClick={closeItemModal}
                className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="overflow-y-auto">
              <form id="itemForm" onSubmit={handleSaveItem} className="p-lg flex flex-col gap-md">
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-on-surface font-medium">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Ej. Arroz, Lavandina..."
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-on-surface font-medium">Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Opcional"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-md">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="font-label-md text-on-surface font-medium">Categoría</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="font-label-md text-on-surface font-medium">Ubicación</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      placeholder="Ej. Alacena 2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-on-surface font-medium">Stock</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-on-surface font-medium">Unidad</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="unidades">unidades</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="litros">litros</option>
                      <option value="ml">ml</option>
                      <option value="paquetes">paquetes</option>
                      <option value="cajas">cajas</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-on-surface font-medium">Mínimo</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={minThreshold}
                      onChange={(e) => setMinThreshold(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      title="Umbral de stock bajo"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-on-surface font-medium">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-lg border-t border-outline-variant flex justify-end gap-md shrink-0 bg-surface-container-lowest">
              <button 
                type="button" 
                onClick={closeItemModal}
                className="px-lg py-sm rounded-lg font-label-md text-label-md text-primary hover:bg-primary-container transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="itemForm"
                className="px-lg py-sm rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
              >
                Guardar Ítem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
