'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  X,
  AlertTriangle,
  ChevronDown,
  ShoppingCart,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useHousehold } from '@/context/HouseholdContext'
import { useAuth } from '@/context/AuthContext'
import {
  getInventoryItems,
  getInventoryCategories,
  createInventoryCategory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  InventoryCategory,
  InventoryItem,
} from '@/services/inventoryService'
import { getShoppingLists, createShoppingList, addShoppingListItem } from '@/services/shoppingService'

export type InventoryStatus = 'ok' | 'low' | 'expiring' | 'out'

export interface InventoryDisplayItem {
  id: string
  household_id?: string
  category_id?: string | null
  name: string
  brand?: string | null
  current_quantity: number
  unit: string
  minimum_threshold: number
  expiration_date?: string | null
  location?: string | null
  last_restocked_at?: string | null
  created_at?: string
  category?: InventoryCategory | null
  // Convenience properties for UI rendering
  qty: number
  minStock: number
  expiry?: string | null
  categoryName: string
  lastRestockedAt?: string | null
  createdAt?: string
  status: InventoryStatus
}

export const statusBadgeConfig: Record<
  InventoryStatus,
  { label: string; textCls: string; bgCls: string; dotCls: string }
> = {
  ok: {
    label: 'Normal',
    textCls: 'text-olive dark:text-dark-olive',
    bgCls: 'bg-olive-soft dark:bg-dark-olive-soft',
    dotCls: 'bg-olive dark:bg-dark-olive',
  },
  low: {
    label: 'Stock bajo',
    textCls: 'text-terracotta dark:text-dark-terracotta',
    bgCls: 'bg-terracotta-bg dark:bg-dark-surface',
    dotCls: 'bg-terracotta dark:bg-dark-terracotta',
  },
  expiring: {
    label: 'Por vencer',
    textCls: 'text-[#B58B2A] dark:text-dark-sand',
    bgCls: 'bg-sand-bg dark:bg-dark-surface',
    dotCls: 'bg-[#B58B2A] dark:bg-dark-sand',
  },
  out: {
    label: 'Agotado',
    textCls: 'text-terracotta dark:text-dark-terracotta font-medium',
    bgCls: 'bg-terracotta-bg dark:bg-dark-surface',
    dotCls: 'bg-terracotta dark:bg-dark-terracotta',
  },
}

export const defaultCategories = ['Despensa', 'Limpieza', 'Botiquín', 'Baño', 'Herramientas', 'Otros']
export const units = ['unidades', 'kg', 'g', 'litros', 'ml', 'paquetes', 'cajas', 'rollos']

/**
 * Checks if an item's expiration date is today, past, or within the next 7 days.
 * Safe from UTC shifts by parsing components directly.
 */
export function isExpiringSoon(expirationDate?: string | null): boolean {
  if (!expirationDate || !expirationDate.trim()) return false
  const clean = expirationDate.trim().split('T')[0]
  const parts = clean.split('-')
  if (parts.length !== 3) return false
  const [y, m, d] = parts.map(Number)
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false

  // End of the expiration day in local time
  const expDate = new Date(y, m - 1, d, 23, 59, 59, 999)
  if (isNaN(expDate.getTime())) return false

  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  sevenDaysFromNow.setHours(23, 59, 59, 999)

  return expDate <= sevenDaysFromNow
}

/**
 * Computes inventory item status following project specifications:
 * - 'out': quantity === 0 ("Agotado")
 * - 'expiring': expiration_date is today, past, or within next 7 days ("Por vencer")
 * - 'low': quantity <= minimum_threshold ("Stock bajo")
 * - 'ok': ("Normal")
 */
export function computeItemStatus(
  qty: number,
  minStock: number,
  expiry?: string | null
): InventoryStatus {
  if (qty === 0) return 'out'
  if (isExpiringSoon(expiry)) return 'expiring'
  if (qty <= minStock) return 'low'
  return 'ok'
}

/**
 * Formats a date string into 'DD/MM/YYYY' for 'es-EC' locale.
 * Returns '—' if empty or invalid. Avoids timezone shifts by parsing 'YYYY-MM-DD'.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr || !dateStr.trim()) return '—'
  const cleanStr = dateStr.trim().split('T')[0]
  const parts = cleanStr.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    if (year.length === 4 && month.length === 2 && day.length === 2) {
      return `${day}/${month}/${year}`
    }
  }
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(d)
  } catch {
    return '—'
  }
}

interface ItemFormState {
  name: string
  brand: string
  qty: number | string
  unit: string
  category: string
  location: string
  expiry: string
  minStock: number | string
}

const initialForm: ItemFormState = {
  name: '',
  brand: '',
  qty: 1,
  unit: 'unidades',
  category: 'Despensa',
  location: 'Alacena',
  expiry: '',
  minStock: 1,
}

export default function Inventory() {
  const { toast } = useToast()
  const { currentHousehold } = useHousehold()
  const { user } = useAuth()

  const [items, setItems] = useState<InventoryDisplayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryDisplayItem | null>(null)
  const [selectedDetailItem, setSelectedDetailItem] = useState<InventoryDisplayItem | null>(null)

  // Filter & categories
  const [filterCat, setFilterCat] = useState('Todos')
  const [availableCategories, setAvailableCategories] = useState<string[]>(defaultCategories)
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({})

  // Form state (dual-mode: create & edit)
  const [form, setForm] = useState<ItemFormState>(initialForm)

  useEffect(() => {
    if (!currentHousehold) return
    let mounted = true
    setLoading(true)

    Promise.all([
      getInventoryCategories(currentHousehold.id).catch(() => []),
      getInventoryItems(currentHousehold.id),
    ])
      .then(([cats, data]) => {
        if (!mounted) return

        // Build category mappings
        const catIdMap: Record<string, string> = {}
        cats.forEach(c => {
          catIdMap[c.name] = c.id
        })
        setCategoryMap(catIdMap)

        const allCatNames = Array.from(
          new Set([
            ...defaultCategories,
            ...cats.map(c => c.name),
            ...data.map(d => d.category?.name).filter(Boolean) as string[],
          ])
        )
        setAvailableCategories(allCatNames)

        if (data) {
          setItems(
            data.map(d => {
              const qty = d.current_quantity ?? 0
              const minStock = d.minimum_threshold ?? 1
              const catName = d.category?.name || 'Despensa'
              return {
                id: d.id,
                household_id: d.household_id,
                category_id: d.category_id,
                name: d.name,
                brand: d.brand || null,
                current_quantity: qty,
                unit: d.unit || 'unidades',
                minimum_threshold: minStock,
                expiration_date: d.expiration_date || null,
                location: d.location || null,
                last_restocked_at: d.last_restocked_at || null,
                created_at: d.created_at,
                category: d.category || null,
                qty,
                minStock,
                expiry: d.expiration_date || null,
                categoryName: catName,
                lastRestockedAt: d.last_restocked_at || null,
                createdAt: d.created_at,
                status: computeItemStatus(qty, minStock, d.expiration_date),
              }
            })
          )
        }
      })
      .catch(err => {
        console.error('Error fetching inventory items:', err)
        toast('Error al cargar el inventario.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [currentHousehold, toast])

  const filtered = useMemo(() => {
    return filterCat === 'Todos' ? items : items.filter(i => (i.category?.name || i.categoryName) === filterCat)
  }, [items, filterCat])

  const lowCount = useMemo(() => items.filter(i => i.qty <= (i.minStock ?? 1)).length, [items])
  const expiringCount = useMemo(() => items.filter(i => isExpiringSoon(i.expiry)).length, [items])

  const openCreateDrawer = () => {
    setEditingItem(null)
    setForm({
      name: '',
      brand: '',
      qty: 1,
      unit: 'unidades',
      category: availableCategories[0] || 'Despensa',
      location: 'Alacena',
      expiry: '',
      minStock: 1,
    })
    setDrawerOpen(true)
  }

  const openEditDrawer = (item: InventoryDisplayItem) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      brand: item.brand || '',
      qty: item.qty,
      unit: item.unit || 'unidades',
      category: item.category?.name || item.categoryName || 'Despensa',
      location: item.location || '',
      expiry: item.expiry ? item.expiry.split('T')[0] : '',
      minStock: item.minStock ?? 1,
    })
    setDrawerOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHousehold) return

    // Validations
    const trimmedName = form.name.trim()
    if (!trimmedName) {
      toast('El nombre del producto es obligatorio.')
      return
    }

    const parsedQty = Number(form.qty)
    if (isNaN(parsedQty) || parsedQty < 0) {
      toast('La cantidad debe ser un número mayor o igual a 0.')
      return
    }

    const parsedMinStock = Number(form.minStock)
    if (isNaN(parsedMinStock) || parsedMinStock < 0) {
      toast('El stock mínimo debe ser un número mayor o igual a 0.')
      return
    }

    let normalizedExpiry: string | null = null
    if (form.expiry && form.expiry.trim()) {
      const cleanExpiry = form.expiry.trim().split('T')[0]
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanExpiry)) {
        toast('La fecha de vencimiento no es válida.')
        return
      }
      const [y, m, d] = cleanExpiry.split('-').map(Number)
      const testDate = new Date(y, m - 1, d)
      if (
        isNaN(testDate.getTime()) ||
        testDate.getFullYear() !== y ||
        testDate.getMonth() !== m - 1 ||
        testDate.getDate() !== d
      ) {
        toast('La fecha de vencimiento no es válida.')
        return
      }
      normalizedExpiry = cleanExpiry
    }

    setSaving(true)
    try {
      let catId = categoryMap[form.category] || null
      if (!catId && form.category) {
        try {
          const newCat = await createInventoryCategory(currentHousehold.id, {
            name: form.category,
            icon: 'Package',
          })
          catId = newCat.id
          setCategoryMap(prev => ({ ...prev, [form.category]: newCat.id }))
        } catch {
          catId = null
        }
      }

      if (editingItem) {
        // Edit mode
        const isRestocked = parsedQty > editingItem.qty
        const lastRestockedAt = isRestocked ? new Date().toISOString() : editingItem.lastRestockedAt

        const payload: Partial<InventoryItem> = {
          name: trimmedName,
          brand: form.brand.trim() || null,
          current_quantity: parsedQty,
          unit: form.unit,
          minimum_threshold: parsedMinStock,
          expiration_date: normalizedExpiry,
          location: form.location.trim() || null,
          category_id: catId,
          ...(isRestocked ? { last_restocked_at: lastRestockedAt } : {}),
        }

        const updated = await updateInventoryItem(editingItem.id, payload)

        const updatedDisplayItem: InventoryDisplayItem = {
          ...editingItem,
          name: trimmedName,
          brand: form.brand.trim() || null,
          current_quantity: parsedQty,
          qty: parsedQty,
          unit: form.unit,
          minimum_threshold: parsedMinStock,
          minStock: parsedMinStock,
          expiration_date: normalizedExpiry,
          expiry: normalizedExpiry,
          location: form.location.trim() || null,
          category_id: catId,
          category: updated.category || (catId ? { id: catId, household_id: currentHousehold.id, name: form.category, icon: 'Package' } : null),
          categoryName: form.category,
          last_restocked_at: lastRestockedAt,
          lastRestockedAt: lastRestockedAt,
          status: computeItemStatus(parsedQty, parsedMinStock, normalizedExpiry),
        }

        setItems(prev => prev.map(i => (i.id === editingItem.id ? updatedDisplayItem : i)))
        if (selectedDetailItem && selectedDetailItem.id === editingItem.id) {
          setSelectedDetailItem(updatedDisplayItem)
        }

        setDrawerOpen(false)
        setEditingItem(null)
        toast('Producto actualizado correctamente.')
      } else {
        // Create mode
        const nowIso = new Date().toISOString()
        const payload: Partial<InventoryItem> = {
          household_id: currentHousehold.id,
          name: trimmedName,
          brand: form.brand.trim() || null,
          current_quantity: parsedQty,
          unit: form.unit,
          minimum_threshold: parsedMinStock,
          expiration_date: normalizedExpiry,
          location: form.location.trim() || null,
          category_id: catId,
          last_restocked_at: nowIso,
        }

        const created = await addInventoryItem(payload)

        const newItem: InventoryDisplayItem = {
          id: created.id,
          household_id: currentHousehold.id,
          category_id: created.category_id || catId,
          name: created.name,
          brand: created.brand || null,
          current_quantity: created.current_quantity,
          qty: created.current_quantity,
          unit: created.unit,
          minimum_threshold: created.minimum_threshold,
          minStock: created.minimum_threshold,
          expiration_date: created.expiration_date || null,
          expiry: created.expiration_date || null,
          location: created.location || null,
          category: created.category || (catId ? { id: catId, household_id: currentHousehold.id, name: form.category, icon: 'Package' } : null),
          categoryName: form.category,
          last_restocked_at: created.last_restocked_at || nowIso,
          lastRestockedAt: created.last_restocked_at || nowIso,
          created_at: created.created_at || nowIso,
          createdAt: created.created_at || nowIso,
          status: computeItemStatus(created.current_quantity, created.minimum_threshold, created.expiration_date),
        }

        setItems(prev => [...prev, newItem])
        setDrawerOpen(false)
        toast('Producto agregado correctamente.')

        setForm(initialForm)
      }
    } catch (err) {
      console.error('Failed to sync inventory item to backend:', err)
      toast(editingItem ? 'Error al actualizar el producto.' : 'Error al guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInventoryItem(id)
      setItems(p => p.filter(i => i.id !== id))
      if (selectedDetailItem && selectedDetailItem.id === id) {
        setSelectedDetailItem(null)
      }
      toast('Producto eliminado correctamente.')
    } catch (err) {
      console.error('Failed to delete item:', err)
      toast('Error al eliminar el producto.')
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
        category: item.category?.name || item.categoryName,
      })
      toast(`"${item.name}" agregado a "${targetList.name}".`)
    } catch (err) {
      console.error('Failed to add item to shopping:', err)
      toast(`No se pudo agregar "${item.name}" a compras.`)
    }
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="mb-10 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">
          Hogar
        </p>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[42px] lg:text-[56px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">
              INVENTARIO
            </h1>
            <p className="text-[14px] text-muted dark:text-dark-muted mt-3">
              Controla lo que tienes, lo que falta y lo que está por vencer.
            </p>
          </div>
          <button
            onClick={openCreateDrawer}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity"
          >
            <Plus size={14} /> Nuevo producto
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
              { label: 'Total de productos', value: items.length, alert: false },
              { label: 'Stock bajo', value: lowCount, alert: lowCount > 0 },
              { label: 'Por vencer', value: expiringCount, alert: expiringCount > 0 },
            ].map(m => (
              <div key={m.label} className="bg-surface dark:bg-dark-surface px-5 py-4">
                <div className="text-[11px] text-muted dark:text-dark-muted mb-1">{m.label}</div>
                <div
                  className={`font-mono text-[28px] font-light ${
                    m.alert ? 'text-terracotta dark:text-dark-terracotta' : 'text-ink dark:text-dark-ink'
                  }`}
                >
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 mb-6 flex-wrap">
            {['Todos', ...availableCategories].map(cat => (
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
              <span className="w-28 text-right">Acciones</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] text-ink dark:text-dark-ink mb-1">
                  No tienes productos registrados.
                </p>
                <p className="text-[13px] text-muted dark:text-dark-muted">
                  Agrega productos con el botón superior para llevar el control.
                </p>
              </div>
            ) : (
              filtered.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedDetailItem(item)}
                  className={`flex lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-4 ${
                    i > 0 ? 'border-t border-line dark:border-dark-line' : ''
                  } hover:bg-bg dark:hover:bg-dark-bg transition-colors group cursor-pointer`}
                >
                  {/* Name & Brand */}
                  <div>
                    <div className="text-[13px] font-medium text-ink dark:text-dark-ink">{item.name}</div>
                    {item.brand && (
                      <div className="text-[11px] text-muted dark:text-dark-muted mt-0.5">{item.brand}</div>
                    )}
                  </div>

                  {/* Category */}
                  <span className="hidden lg:block text-[12px] text-muted dark:text-dark-muted">
                    {item.category?.name || item.categoryName}
                  </span>

                  {/* Location */}
                  <span className="hidden lg:block text-[12px] text-muted dark:text-dark-muted">
                    {item.location || '—'}
                  </span>

                  {/* Stock & Status Badge */}
                  <div className="hidden lg:flex items-center gap-2">
                    <span className="font-mono text-[13px] text-ink dark:text-dark-ink">
                      {item.qty} {item.unit}
                    </span>
                    {item.status !== 'ok' && (
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium ${
                          statusBadgeConfig[item.status].bgCls
                        } ${statusBadgeConfig[item.status].textCls}`}
                        title={statusBadgeConfig[item.status].label}
                      >
                        {statusBadgeConfig[item.status].label}
                      </span>
                    )}
                  </div>

                  {/* Expiration Date */}
                  <div className="hidden lg:block">
                    <span className="font-mono text-[12px] text-muted dark:text-dark-muted">
                      {formatDate(item.expiry)}
                    </span>
                  </div>

                  {/* Mobile Stock Indicator */}
                  <div className="lg:hidden text-right ml-auto flex flex-col items-end">
                    <span className="font-mono text-[13px] text-ink dark:text-dark-ink">
                      {item.qty} {item.unit}
                    </span>
                    {item.status !== 'ok' && (
                      <span className={`text-[10px] font-medium mt-0.5 ${statusBadgeConfig[item.status].textCls}`}>
                        {statusBadgeConfig[item.status].label}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity ml-2 lg:ml-0 flex-shrink-0">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedDetailItem(item)
                      }}
                      className="p-1.5 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink rounded transition-colors"
                      title="Ver detalles"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        openEditDrawer(item)
                      }}
                      className="p-1.5 text-muted dark:text-dark-muted hover:text-olive dark:hover:text-dark-olive rounded transition-colors"
                      title="Editar producto"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        addToShopping(item)
                      }}
                      className="p-1.5 text-muted dark:text-dark-muted hover:text-olive dark:hover:text-dark-olive rounded transition-colors"
                      title="Agregar a compras"
                    >
                      <ShoppingCart size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                          handleDelete(item.id)
                        }
                      }}
                      className="p-1.5 text-muted dark:text-dark-muted hover:text-terracotta dark:hover:text-dark-terracotta rounded transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Item Detail Slide-Over Drawer */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-ink/20 dark:bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedDetailItem(null)}
          />
          <div className="relative w-full max-w-md h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col overflow-y-auto z-10">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <div>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
                  Detalle del producto
                </span>
                <h3 className="text-[16px] font-medium text-ink dark:text-dark-ink mt-0.5">
                  Información general
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailItem(null)}
                className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink p-1 rounded transition-colors"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 px-6 py-6 space-y-6">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[22px] font-light tracking-tight text-ink dark:text-dark-ink break-words">
                      {selectedDetailItem.name}
                    </h2>
                    {selectedDetailItem.brand && (
                      <p className="text-[13px] text-muted dark:text-dark-muted mt-1">
                        Marca: <span className="text-ink dark:text-dark-ink font-medium">{selectedDetailItem.brand}</span>
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-medium flex-shrink-0 ${
                      statusBadgeConfig[selectedDetailItem.status].bgCls
                    } ${statusBadgeConfig[selectedDetailItem.status].textCls}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusBadgeConfig[selectedDetailItem.status].dotCls}`} />
                    {statusBadgeConfig[selectedDetailItem.status].label}
                  </span>
                </div>
              </div>

              {/* Details List */}
              <div className="border border-line dark:border-dark-line rounded-[4px] divide-y divide-line dark:divide-dark-line bg-bg/40 dark:bg-dark-bg/40 text-[13px]">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-muted dark:text-dark-muted text-[12px]">Categoría</span>
                  <span className="font-medium text-ink dark:text-dark-ink">
                    {selectedDetailItem.category?.name || selectedDetailItem.categoryName || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-muted dark:text-dark-muted text-[12px]">Ubicación</span>
                  <span className="font-medium text-ink dark:text-dark-ink">
                    {selectedDetailItem.location || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-muted dark:text-dark-muted text-[12px]">Cantidad actual</span>
                  <span className="font-mono font-medium text-ink dark:text-dark-ink">
                    {selectedDetailItem.qty} {selectedDetailItem.unit}
                  </span>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-muted dark:text-dark-muted text-[12px]">Stock mínimo</span>
                  <span className="font-mono text-ink dark:text-dark-ink">
                    {selectedDetailItem.minStock ?? 1} {selectedDetailItem.unit}
                  </span>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-muted dark:text-dark-muted text-[12px]">Fecha de vencimiento</span>
                  <span className="font-mono text-ink dark:text-dark-ink">
                    {formatDate(selectedDetailItem.expiry)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-muted dark:text-dark-muted text-[12px]">Última reposición</span>
                  <span className="font-mono text-ink dark:text-dark-ink">
                    {formatDate(selectedDetailItem.lastRestockedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-muted dark:text-dark-muted text-[12px]">Fecha de registro</span>
                  <span className="font-mono text-ink dark:text-dark-ink">
                    {formatDate(selectedDetailItem.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="px-6 py-5 border-t border-line dark:border-dark-line flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const itemToEdit = selectedDetailItem
                  openEditDrawer(itemToEdit)
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity"
              >
                <Pencil size={14} /> Editar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                    handleDelete(selectedDetailItem.id)
                  }
                }}
                className="px-4 py-2.5 border border-terracotta/40 dark:border-dark-terracotta/40 text-terracotta dark:text-dark-terracotta hover:bg-terracotta-bg dark:hover:bg-dark-surface rounded-[4px] text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5"
                title="Eliminar producto"
              >
                <Trash2 size={14} /> Eliminar
              </button>

              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="px-4 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-ink/20 dark:bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => {
              setDrawerOpen(false)
              setEditingItem(null)
            }}
          />
          <div className="relative w-full max-w-md h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <div>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
                  {editingItem ? 'Modificación' : 'Registro'}
                </span>
                <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink mt-0.5">
                  {editingItem ? 'Editar producto' : 'Nuevo producto'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setDrawerOpen(false)
                  setEditingItem(null)
                }}
                className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink p-1 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={save} className="flex-1 flex flex-col">
              <div className="flex-1 px-6 py-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Nombre <span className="text-terracotta">*</span>
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ej. Arroz blanco"
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Marca (opcional)
                  </label>
                  <input
                    value={form.brand}
                    onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                    placeholder="Ej. La Campagnola"
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Categoría
                  </label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive appearance-none cursor-pointer"
                    >
                      {availableCategories.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Ubicación
                  </label>
                  <input
                    value={form.location}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="Ej. Alacena, Refrigerador"
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                      Cantidad <span className="text-terracotta">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      required
                      value={form.qty}
                      onChange={e =>
                        setForm(p => ({
                          ...p,
                          qty: e.target.value === '' ? '' : Number(e.target.value),
                        }))
                      }
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] font-mono text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                      Unidad
                    </label>
                    <div className="relative">
                      <select
                        value={form.unit}
                        onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive appearance-none cursor-pointer"
                      >
                        {units.map(u => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Stock mínimo <span className="text-terracotta">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={form.minStock}
                    onChange={e =>
                      setForm(p => ({
                        ...p,
                        minStock: e.target.value === '' ? '' : Number(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] font-mono text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
                      Fecha de vencimiento (opcional)
                    </label>
                    {form.expiry && (
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, expiry: '' }))}
                        className="text-[11px] text-muted hover:text-terracotta dark:hover:text-dark-terracotta transition-colors"
                      >
                        Limpiar fecha
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={form.expiry}
                    onChange={e => setForm(p => ({ ...p, expiry: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive cursor-pointer"
                  />
                </div>
              </div>

              <div className="px-6 py-5 border-t border-line dark:border-dark-line flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false)
                    setEditingItem(null)
                  }}
                  className="flex-1 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-surface dark:border-dark-bg border-t-transparent rounded-full animate-spin" />
                  ) : editingItem ? (
                    'Guardar cambios'
                  ) : (
                    'Guardar producto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
