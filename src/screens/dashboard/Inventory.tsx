'use client'

import { useState, useEffect } from 'react'
import { Plus, X, AlertTriangle, ChevronDown, ShoppingCart } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useHousehold } from '@/context/HouseholdContext'
import { useAuth } from '@/context/AuthContext'
import {
  getInventoryItems,
  addInventoryItem,
  deleteInventoryItem,
} from '@/services/inventoryService'
import { getShoppingLists, createShoppingList, addShoppingListItem } from '@/services/shoppingService'

export interface InventoryDisplayItem {
  id: string
  name: string
  brand?: string
  qty: number
  unit: string
  category: string
  location?: string
  expiry?: string
  minStock?: number
  notes?: string
  status: 'ok' | 'low' | 'expiring'
}

const statusBadge: Record<string, string> = {
  ok: 'text-olive dark:text-dark-olive',
  low: 'text-terracotta dark:text-dark-terracotta',
  expiring: 'text-sand dark:text-dark-sand',
}

const categories = ['Despensa', 'Limpieza', 'Botiquín', 'Baño', 'Herramientas', 'Otros']
const units = ['unidades', 'kg', 'g', 'litros', 'ml', 'paquetes', 'cajas', 'rollos']

export default function Inventory() {
  const { toast } = useToast()
  const { currentHousehold } = useHousehold()
  const { user } = useAuth()
  const [items, setItems] = useState<InventoryDisplayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filterCat, setFilterCat] = useState('Todos')
  const [form, setForm] = useState({
    name: '',
    brand: '',
    qty: 1,
    unit: 'unidades',
    category: 'Despensa',
    location: 'Alacena',
    expiry: '',
    minStock: 1,
    notes: '',
  })

  useEffect(() => {
    if (!currentHousehold) return
    let mounted = true
    setLoading(true)

    getInventoryItems(currentHousehold.id)
      .then(data => {
        if (!mounted) return
        if (data) {
          setItems(
            data.map(d => {
              const qty = d.current_quantity || 0
              const min = d.minimum_threshold || 1
              let status: 'ok' | 'low' | 'expiring' = 'ok'
              if (qty <= min) {
                status = 'low'
              }
              return {
                id: d.id,
                name: d.name,
                brand: d.brand || '',
                qty,
                unit: d.unit || 'unidades',
                category: d.category?.name || 'Despensa',
                location: d.location || 'Alacena',
                expiry: d.expiration_date || '',
                minStock: min,
                status,
              }
            })
          )
        }
      })
      .catch(err => {
        console.error('Error fetching inventory items:', err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [currentHousehold])

  const filtered = filterCat === 'Todos' ? items : items.filter(i => i.category === filterCat)
  const lowCount = items.filter(i => i.status === 'low').length
  const expiringCount = items.filter(i => i.status === 'expiring').length

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHousehold) return

    try {
      const created = await addInventoryItem({
        household_id: currentHousehold.id,
        name: form.name,
        brand: form.brand,
        current_quantity: Number(form.qty),
        unit: form.unit,
        minimum_threshold: Number(form.minStock),
        expiration_date: form.expiry || undefined,
        location: form.location,
      })

      const newItem: InventoryDisplayItem = {
        id: created.id,
        ...form,
        qty: Number(form.qty),
        minStock: Number(form.minStock),
        status: Number(form.qty) <= Number(form.minStock) ? 'low' : 'ok',
      }
      setItems(prev => [...prev, newItem])
      setDrawerOpen(false)
      toast('Ítem agregado al inventario.')

      setForm({
        name: '',
        brand: '',
        qty: 1,
        unit: 'unidades',
        category: 'Despensa',
        location: 'Alacena',
        expiry: '',
        minStock: 1,
        notes: '',
      })
    } catch (err) {
      console.error('Failed to sync inventory item to backend:', err)
      toast('Error al guardar ítem en el inventario.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInventoryItem(id)
      setItems(p => p.filter(i => i.id !== id))
      toast('Ítem eliminado.')
    } catch (err) {
      console.error('Failed to delete item:', err)
      toast('Error al eliminar ítem.')
    }
  }

  const addToShopping = async (item: InventoryDisplayItem) => {
    if (!currentHousehold || !user) return
    try {
      let lists = await getShoppingLists(currentHousehold.id)
      let targetList = lists[0]
      if (!targetList) {
        targetList = await createShoppingList(currentHousehold.id, 'Lista General')
      }
      await addShoppingListItem(targetList.id, user.id, {
        item_name: item.name,
        quantity: `${item.qty} ${item.unit}`,
        category: item.category,
      })
      toast(`"${item.name}" agregado a "${targetList.name}".`)
    } catch (err) {
      console.error('Failed to add item to shopping:', err)
      toast(`"${item.name}" no se pudo agregar a compras.`)
    }
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="mb-10 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">Hogar</p>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[42px] lg:text-[56px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">INVENTARIO</h1>
            <p className="text-[14px] text-muted dark:text-dark-muted mt-3">Lo que tenés. Lo que falta. Lo que está por vencer.</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity"
          >
            <Plus size={14} /> Agregar ítem
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <div className="w-6 h-6 border-2 border-olive border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-px bg-line dark:bg-dark-line rounded-[4px] overflow-hidden mb-8">
            {[
              { label: 'Total de ítems', value: items.length, alert: false },
              { label: 'Stock bajo', value: lowCount, alert: lowCount > 0 },
              { label: 'Por vencer', value: expiringCount, alert: expiringCount > 0 },
            ].map(m => (
              <div key={m.label} className="bg-surface dark:bg-dark-surface px-5 py-4">
                <div className="text-[11px] text-muted dark:text-dark-muted mb-1">{m.label}</div>
                <div className={`font-mono text-[28px] font-light ${m.alert ? 'text-terracotta dark:text-dark-terracotta' : 'text-ink dark:text-dark-ink'}`}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 mb-6 flex-wrap">
            {['Todos', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 rounded-[3px] text-[12px] font-medium border transition-colors ${
                  filterCat === cat
                    ? 'border-ink dark:border-dark-ink bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg'
                    : 'border-line dark:border-dark-line text-muted dark:text-dark-muted hover:border-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden">
            <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-line dark:border-dark-line bg-bg dark:bg-dark-bg text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
              <span>Producto</span>
              <span>Categoría</span>
              <span>Ubicación</span>
              <span>Stock</span>
              <span>Vencimiento</span>
              <span></span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] text-ink dark:text-dark-ink mb-1">Tu inventario está vacío.</p>
                <p className="text-[13px] text-muted dark:text-dark-muted">Agregá ítems con el botón superior para llevar el control.</p>
              </div>
            ) : (
              filtered.map((item, i) => (
                <div
                  key={item.id}
                  className={`flex lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-line dark:border-dark-line' : ''} hover:bg-bg dark:hover:bg-dark-bg transition-colors group`}
                >
                  <div>
                    <div className="text-[13px] font-medium text-ink dark:text-dark-ink">{item.name}</div>
                    {item.brand && <div className="text-[11px] text-muted dark:text-dark-muted mt-0.5">{item.brand}</div>}
                  </div>
                  <span className="hidden lg:block text-[12px] text-muted dark:text-dark-muted">{item.category}</span>
                  <span className="hidden lg:block text-[12px] text-muted dark:text-dark-muted">{item.location}</span>
                  <div className="hidden lg:flex items-center gap-2">
                    <span className="font-mono text-[13px] text-ink dark:text-dark-ink">{item.qty} {item.unit}</span>
                    {item.status !== 'ok' && <AlertTriangle size={12} className={statusBadge[item.status]} />}
                  </div>
                  <div className="hidden lg:block">
                    <span className="text-[12px] text-muted dark:text-dark-muted">{item.expiry || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity ml-auto lg:ml-0">
                    <button onClick={() => addToShopping(item)} className="p-1.5 text-muted dark:text-dark-muted hover:text-olive dark:hover:text-dark-olive" title="Agregar a compras">
                      <ShoppingCart size={13} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted dark:text-dark-muted hover:text-terracotta dark:hover:text-dark-terracotta" title="Eliminar ítem">
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink/20 dark:bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink">Agregar ítem</h3>
              <button onClick={() => setDrawerOpen(false)} className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="flex-1 flex flex-col">
              <div className="flex-1 px-6 py-6 space-y-4">
                {[
                  { label: 'Nombre', key: 'name', req: true, ph: 'Arroz blanco' },
                  { label: 'Marca (opcional)', key: 'brand', req: false, ph: 'La Campagnola' },
                  { label: 'Ubicación', key: 'location', req: false, ph: 'Alacena' },
                  { label: 'Fecha de vencimiento (opcional)', key: 'expiry', req: false, ph: '15 dic. 2026' },
                  { label: 'Notas (opcional)', key: 'notes', req: false, ph: '' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">{f.label}</label>
                    <input
                      required={f.req}
                      value={form[f.key as keyof typeof form] as string}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.ph}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Cantidad</label>
                    <input
                      type="number"
                      min={0}
                      value={form.qty}
                      onChange={e => setForm(p => ({ ...p, qty: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] font-mono text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Unidad</label>
                    <div className="relative">
                      <select
                        value={form.unit}
                        onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive appearance-none"
                      >
                        {units.map(u => <option key={u}>{u}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Categoría</label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive appearance-none"
                    >
                      {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 border-t border-line dark:border-dark-line flex gap-3">
                <button type="button" onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted hover:text-ink transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity">Guardar ítem</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
