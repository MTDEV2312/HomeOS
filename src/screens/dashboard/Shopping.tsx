'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, X, ChevronDown, Loader2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/lib/auth-context'
import { useHousehold } from '@/lib/household-context'
import {
  getShoppingLists,
  createShoppingList,
  getShoppingListItems,
  addShoppingListItem,
  updateShoppingListItem,
  ShoppingList as ApiList,
  ShoppingListItem as ApiItem
} from '@/services/shoppingService'

type ListItem = { id: string; name: string; qty: number; unit: string; category: string; done: boolean }
type ShoppingList = { id: string; name: string; total: number; bought: number; items: ListItem[] }

const categories = ['Supermercado', 'Verdulería', 'Carnicería', 'Limpieza', 'Farmacia', 'Ferretería', 'Otros']

const catColor: Record<string, string> = {
  Supermercado: 'bg-sand-bg text-ink dark:bg-dark-surface dark:text-dark-ink',
  Verdulería: 'bg-sage-soft text-ink dark:bg-dark-surface dark:text-dark-ink',
  Limpieza: 'bg-softblue-bg text-ink dark:bg-dark-surface dark:text-dark-ink',
  Farmacia: 'bg-terracotta-bg text-terracotta dark:bg-dark-surface dark:text-dark-terracotta',
  Ferretería: 'bg-olive-soft text-olive dark:bg-dark-surface dark:text-dark-olive',
  Carnicería: 'bg-terracotta-bg text-ink dark:bg-dark-surface dark:text-dark-ink',
  Otros: 'bg-bg text-muted dark:bg-dark-surface dark:text-dark-muted',
}

export default function Shopping() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { activeHousehold } = useHousehold()

  const [lists, setLists] = useState<ShoppingList[]>([])
  const [activeListId, setActiveListId] = useState('')
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [newListModal, setNewListModal] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newItem, setNewItem] = useState({ name: '', qty: 1, unit: 'unidades', category: 'Supermercado' })

  const householdId = activeHousehold?.id

  const loadLists = useCallback(async () => {
    if (!householdId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const dbLists: ApiList[] = await getShoppingLists(householdId)
      const enriched: ShoppingList[] = await Promise.all(
        (dbLists || []).map(async (l) => {
          const items: ApiItem[] = await getShoppingListItems(l.id).catch(() => [])
          const mappedItems: ListItem[] = items.map(i => ({
            id: i.id,
            name: i.item_name,
            qty: parseFloat(i.quantity || '1') || 1,
            unit: i.quantity?.includes(' ') ? i.quantity.split(' ')[1] : 'unidades',
            category: i.category || 'Otros',
            done: i.is_purchased,
          }))
          return {
            id: l.id,
            name: l.name,
            total: mappedItems.length,
            bought: mappedItems.filter(i => i.done).length,
            items: mappedItems,
          }
        })
      )
      setLists(enriched)
      if (enriched.length > 0) {
        setActiveListId(curr => (enriched.some(l => l.id === curr) ? curr : enriched[0].id))
      } else {
        setActiveListId('')
      }
    } catch (err) {
      console.error('Error fetching shopping lists', err)
    } finally {
      setLoading(false)
    }
  }, [householdId])

  useEffect(() => {
    loadLists()
  }, [loadLists])

  const activeList = lists.find(l => l.id === activeListId) || lists[0] || {
    id: 'empty',
    name: 'Lista de compras',
    total: 0,
    bought: 0,
    items: [],
  }

  const boughtCount = activeList.items.filter(i => i.done).length

  const toggleItem = async (itemId: string) => {
    const item = activeList.items.find(i => i.id === itemId)
    const newDone = !item?.done

    setLists(prev => prev.map(l =>
      l.id === activeList.id
        ? {
            ...l,
            items: l.items.map(i => i.id === itemId ? { ...i, done: newDone } : i),
            bought: l.items.filter(i => (i.id === itemId ? newDone : i.done)).length,
          }
        : l
    ))

    try {
      await updateShoppingListItem(itemId, { is_purchased: newDone })
    } catch {
      // Local state updated
    }
  }

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name.trim()) return

    const tempId = Date.now().toString()
    const item: ListItem = {
      id: tempId,
      ...newItem,
      qty: Number(newItem.qty),
      done: false,
    }

    setLists(prev => prev.map(l =>
      l.id === activeList.id
        ? { ...l, items: [...l.items, item], total: l.total + 1 }
        : l
    ))
    setNewItem({ name: '', qty: 1, unit: 'unidades', category: 'Supermercado' })
    setDrawerOpen(false)
    toast('Ítem agregado a la lista.', 'success')

    if (activeList.id && user?.id) {
      try {
        const created = await addShoppingListItem(activeList.id, user.id, {
          item_name: item.name,
          quantity: `${item.qty} ${item.unit}`,
          category: item.category,
        })
        setLists(prev => prev.map(l =>
          l.id === activeList.id
            ? { ...l, items: l.items.map(i => i.id === tempId ? { ...i, id: created.id } : i) }
            : l
        ))
      } catch (err) {
        console.error('Error adding item to DB', err)
      }
    }
  }

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return

    const tempId = Date.now().toString()
    const newList: ShoppingList = {
      id: tempId,
      name: newListName.trim(),
      total: 0,
      bought: 0,
      items: [],
    }

    setLists(prev => [newList, ...prev])
    setActiveListId(tempId)
    setNewListName('')
    setNewListModal(false)
    toast('Lista creada.', 'success')

    if (activeHousehold?.id) {
      try {
        const created = await createShoppingList(activeHousehold.id, newList.name)
        setLists(prev => prev.map(l => l.id === tempId ? { ...l, id: created.id } : l))
        setActiveListId(created.id)
      } catch (err) {
        console.error('Error creating list in DB', err)
      }
    }
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto font-sans">
      {/* Header */}
      <div className="mb-10 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">Hogar</p>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[42px] lg:text-[56px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">
              COMPRAS
            </h1>
            <p className="text-[14px] text-muted dark:text-dark-muted mt-3">Lo que necesitamos para la semana.</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Plus size={14} /> Agregar ítem
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted dark:text-dark-muted text-[13px]">
          <Loader2 size={24} className="animate-spin text-olive" />
          <span>Cargando listas de compras...</span>
        </div>
      ) : lists.length === 0 ? (
        <div className="border border-line dark:border-dark-line rounded-[4px] p-12 text-center bg-surface dark:bg-dark-surface">
          <p className="text-[15px] font-medium text-ink dark:text-dark-ink mb-1">No hay listas de compras</p>
          <p className="text-[13px] text-muted dark:text-dark-muted max-w-sm mx-auto mb-5">
            Crea tu primera lista para organizar las compras del supermercado, verdulería y el hogar.
          </p>
          <button
            onClick={() => setNewListModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Plus size={14} /> Crear primera lista
          </button>
        </div>
      ) : (
        <>
          {/* Lists selector */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
            {lists.map(l => {
              const bought = l.items.filter(i => i.done).length
              const isActive = l.id === activeList.id
              return (
                <button
                  key={l.id}
                  onClick={() => setActiveListId(l.id)}
                  className={`shrink-0 px-4 py-2 rounded-[4px] border text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'border-ink dark:border-dark-ink bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg'
                      : 'border-line dark:border-dark-line text-muted dark:text-dark-muted hover:border-ink dark:hover:border-dark-ink hover:text-ink dark:hover:text-dark-ink bg-surface dark:bg-dark-surface'
                  }`}
                >
                  <div className="text-[13px] font-medium">{l.name}</div>
                  <div className="text-[11px] opacity-60 font-mono mt-0.5">{bought}/{l.items.length}</div>
                </button>
              )
            })}
            <button
              onClick={() => setNewListModal(true)}
              className="shrink-0 px-4 py-2 rounded-[4px] border border-dashed border-line dark:border-dark-line text-[13px] text-muted dark:text-dark-muted hover:border-olive dark:hover:border-dark-olive transition-colors cursor-pointer bg-surface dark:bg-dark-surface"
            >
              <Plus size={13} className="inline mr-1" /> Nueva lista
            </button>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-ink dark:text-dark-ink">{activeList.name}</span>
              <span className="font-mono text-[12px] text-muted dark:text-dark-muted">
                {boughtCount} / {activeList.items.length} comprados
              </span>
            </div>
            <div className="h-1 bg-line dark:bg-dark-line rounded-full overflow-hidden">
              <div
                className="h-full bg-olive dark:bg-dark-olive rounded-full transition-all duration-500"
                style={{ width: `${activeList.items.length ? (boughtCount / activeList.items.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Items */}
          <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden bg-surface dark:bg-dark-surface">
            {activeList.items.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] text-ink dark:text-dark-ink mb-1">La lista está vacía.</p>
                <p className="text-[13px] text-muted dark:text-dark-muted">Agregá ítems para empezar.</p>
              </div>
            ) : (
              activeList.items.map((item, i) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-bg dark:hover:bg-dark-bg transition-colors ${
                    i > 0 ? 'border-t border-line dark:border-dark-line' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                      item.done
                        ? 'bg-olive dark:bg-dark-olive border-olive dark:border-dark-olive'
                        : 'border-line dark:border-dark-line hover:border-olive'
                    }`}
                  >
                    {item.done && <span className="text-white text-[10px] leading-none">✓</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <span className={`text-[14px] font-medium text-ink dark:text-dark-ink transition-all ${item.done ? 'line-through opacity-40' : ''}`}>
                      {item.name}
                    </span>
                    <span className={`text-[12px] text-muted dark:text-dark-muted ml-2 font-mono ${item.done ? 'opacity-40' : ''}`}>
                      {item.qty} {item.unit}
                    </span>
                  </div>

                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${catColor[item.category] || catColor.Otros}`}>
                    {item.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* New List Modal */}
      {newListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/20 dark:bg-black/50 backdrop-blur-xs" onClick={() => setNewListModal(false)} />
          <div className="relative w-full max-w-sm bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[6px] shadow-2xl p-6">
            <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink mb-4">Nueva lista de compras</h3>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Nombre</label>
                <input
                  required
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  placeholder="Supermercado, Verdulería…"
                  className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setNewListModal(false)}
                  className="px-4 py-2 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[12px] font-medium hover:opacity-80"
                >
                  Crear lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink/20 dark:bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink">Agregar ítem</h3>
              <button onClick={() => setDrawerOpen(false)} className="text-muted dark:text-dark-muted hover:text-ink p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={addItem} className="flex-1 flex flex-col">
              <div className="flex-1 px-6 py-6 space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Producto</label>
                  <input
                    required
                    value={newItem.name}
                    onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                    placeholder="Yerba, leche, detergente…"
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Cantidad</label>
                    <input
                      type="number"
                      min={1}
                      value={newItem.qty}
                      onChange={e => setNewItem(p => ({ ...p, qty: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Unidad</label>
                    <div className="relative">
                      <select
                        value={newItem.unit}
                        onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive appearance-none"
                      >
                        {['unidades', 'kg', 'g', 'litros', 'ml', 'paquetes', 'cajas', 'rollos', 'bolsas'].map(u => <option key={u}>{u}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Categoría</label>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewItem(p => ({ ...p, category: cat }))}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                          newItem.category === cat
                            ? 'border-olive bg-olive-soft text-olive dark:border-dark-olive dark:bg-dark-olive-soft dark:text-dark-olive'
                            : 'border-line dark:border-dark-line text-muted dark:text-dark-muted hover:border-muted'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 border-t border-line dark:border-dark-line flex gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted hover:text-ink transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 cursor-pointer"
                >
                  Agregar ítem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
