'use client'

import { useState, useEffect } from 'react'
import { Plus, X, AlertTriangle, Clock, ChevronDown, Trash2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useHousehold } from '@/context/HouseholdContext'
import { useAuth } from '@/context/AuthContext'
import {
  getAssets,
  addAsset,
  deleteAsset,
  addMaintenanceLog,
  AssetCategory,
} from '@/services/maintenanceService'
import { getHouseholdMembers, HouseholdMemberDetails } from '@/services/householdService'

export interface MaintenanceAssetItem {
  id: string
  name: string
  category: string
  brand?: string
  model?: string
  serial?: string
  purchaseDate?: string
  warrantyExp?: string
  location?: string
  lastService: string
  nextService: string
  status: 'ok' | 'upcoming' | 'overdue'
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  ok: { label: 'Al día', cls: 'text-olive dark:text-dark-olive bg-olive-soft dark:bg-dark-olive-soft' },
  upcoming: { label: 'Próximo', cls: 'text-sand dark:text-dark-sand bg-sand-bg dark:bg-dark-surface' },
  overdue: { label: 'Atrasado', cls: 'text-terracotta dark:text-dark-terracotta bg-terracotta-bg dark:bg-dark-surface' },
}

const categories = ['Electrodomésticos', 'Climatización', 'Plomería', 'Eléctrico', 'Vehículo', 'Estructura', 'Otros']

const categoryMapToDb: Record<string, AssetCategory> = {
  Electrodomésticos: 'APPLIANCE',
  Climatización: 'HVAC',
  Plomería: 'PLUMBING',
  Eléctrico: 'ELECTRICAL',
  Vehículo: 'VEHICLE',
  Estructura: 'STRUCTURE',
  Otros: 'OTHER',
}

const categoryMapFromDb: Record<string, string> = {
  APPLIANCE: 'Electrodomésticos',
  HVAC: 'Climatización',
  PLUMBING: 'Plomería',
  ELECTRICAL: 'Eléctrico',
  VEHICLE: 'Vehículo',
  STRUCTURE: 'Estructura',
  OTHER: 'Otros',
}

export default function Maintenance() {
  const { toast } = useToast()
  const { currentHousehold } = useHousehold()
  const { user } = useAuth()
  const [assets, setAssets] = useState<MaintenanceAssetItem[]>([])
  const [members, setMembers] = useState<HouseholdMemberDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [logDrawer, setLogDrawer] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    category: 'Electrodomésticos',
    brand: '',
    model: '',
    serial: '',
    purchaseDate: '',
    warrantyExp: '',
    location: '',
  })
  const [logForm, setLogForm] = useState({
    task: '',
    by: '',
    cost: '',
    date: '',
    notes: '',
    freq: 6,
  })

  useEffect(() => {
    if (!currentHousehold) return
    let mounted = true
    setLoading(true)

    Promise.all([
      getAssets(currentHousehold.id).catch(() => []),
      getHouseholdMembers(currentHousehold.id).catch(() => []),
    ])
      .then(([data, memberData]) => {
        if (!mounted) return
        if (memberData) setMembers(memberData)
        if (data) {
          setAssets(
            data.map(d => ({
              id: d.id,
              name: d.name,
              category: categoryMapFromDb[d.category] || 'Electrodomésticos',
              brand: d.model_number?.split(' ')[0] || '',
              model: d.model_number || '',
              serial: d.serial_number || '',
              purchaseDate: d.purchase_date || '',
              warrantyExp: d.warranty_expiry || '',
              location: d.location || 'Hogar',
              lastService: '—',
              nextService: '—',
              status: 'ok',
            }))
          )
        }
      })
      .catch(err => {
        console.error('Error fetching assets:', err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [currentHousehold])

  const overdueCount = assets.filter(a => a.status === 'overdue').length
  const upcomingCount = assets.filter(a => a.status === 'upcoming').length

  const saveAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHousehold || !user) return

    try {
      const dbCategory = categoryMapToDb[form.category] || 'APPLIANCE'
      const created = await addAsset({
        household_id: currentHousehold.id,
        name: form.name,
        category: dbCategory,
        model_number: `${form.brand} ${form.model}`.trim() || null,
        serial_number: form.serial || null,
        purchase_date: form.purchaseDate || null,
        warranty_expiry: form.warrantyExp || null,
        location: form.location || null,
        created_by: user.id,
      })

      const newAsset: MaintenanceAssetItem = {
        id: created.id,
        ...form,
        nextService: '—',
        status: 'ok',
        lastService: '—',
      }
      setAssets(prev => [...prev, newAsset])
      setDrawerOpen(false)
      toast('Activo agregado.')

      setForm({
        name: '',
        category: 'Electrodomésticos',
        brand: '',
        model: '',
        serial: '',
        purchaseDate: '',
        warrantyExp: '',
        location: '',
      })
    } catch (err) {
      console.error('Failed to sync asset to backend:', err)
      toast('Error al guardar activo.')
    }
  }

  const handleDeleteAsset = async (id: string) => {
    try {
      await deleteAsset(id)
      setAssets(p => p.filter(a => a.id !== id))
      toast('Activo eliminado.')
    } catch (err) {
      console.error('Failed to delete asset:', err)
      toast('Error al eliminar activo.')
    }
  }

  const saveLog = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetAssetId = logDrawer
    if (!targetAssetId || !user) return

    try {
      const numericCost = Number(logForm.cost.replace(/\D/g, '')) || 0
      const performedBy = logForm.by || user.profile?.name || user.email || 'Miembro'
      const serviceDate = logForm.date || new Date().toISOString().split('T')[0]

      await addMaintenanceLog({
        asset_id: targetAssetId,
        task_name: logForm.task,
        performed_by: performedBy,
        cost: numericCost,
        notes: logForm.notes,
        service_date: serviceDate,
        created_by: user.id,
      })

      setAssets(prev =>
        prev.map(a =>
          a.id === targetAssetId
            ? { ...a, lastService: new Date(serviceDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }), status: 'ok' }
            : a
        )
      )

      setLogDrawer(null)
      toast('Mantenimiento registrado.')
      setLogForm({ task: '', by: '', cost: '', date: '', notes: '', freq: 6 })
    } catch (err) {
      console.error('Failed to sync log to backend:', err)
      toast('Error al registrar mantenimiento.')
    }
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="mb-10 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">Hogar</p>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[42px] lg:text-[56px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">MANTENIMIENTO</h1>
            <p className="text-[14px] text-muted dark:text-dark-muted mt-3">Cuidá tu hogar antes de que algo falle.</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity"
          >
            <Plus size={14} /> Agregar activo
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
          <div className="grid grid-cols-3 gap-px bg-line dark:bg-dark-line rounded-[4px] overflow-hidden mb-10">
            {[
              { label: 'Total de activos', value: assets.length, alert: false },
              { label: 'Próximos a vencer', value: upcomingCount, alert: upcomingCount > 0 },
              { label: 'Atrasados', value: overdueCount, alert: overdueCount > 0 },
            ].map(m => (
              <div key={m.label} className="bg-surface dark:bg-dark-surface px-5 py-4">
                <div className="text-[11px] text-muted dark:text-dark-muted mb-1">{m.label}</div>
                <div className={`font-mono text-[28px] font-light ${m.alert ? 'text-terracotta dark:text-dark-terracotta' : 'text-ink dark:text-dark-ink'}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Asset table */}
          <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden">
            <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-line dark:border-dark-line bg-bg dark:bg-dark-bg text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
              <span>Activo</span>
              <span>Categoría</span>
              <span>Último servicio</span>
              <span>Próximo</span>
              <span>Estado</span>
              <span></span>
            </div>

            {assets.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] text-ink dark:text-dark-ink mb-1">No hay activos registrados.</p>
                <p className="text-[13px] text-muted dark:text-dark-muted">Agregá electrodomésticos, vehículos o sistemas de tu hogar para registrar su mantenimiento.</p>
              </div>
            ) : (
              assets.map((asset, i) => {
                const badge = statusBadge[asset.status] || statusBadge.ok
                return (
                  <div key={asset.id} className={`flex lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_auto_auto] items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-line dark:border-dark-line' : ''} hover:bg-bg dark:hover:bg-dark-bg transition-colors group`}>
                    <div>
                      <div className="text-[13px] font-medium text-ink dark:text-dark-ink">{asset.name}</div>
                      <div className="text-[11px] text-muted dark:text-dark-muted mt-0.5">{asset.brand} {asset.model} · {asset.location}</div>
                    </div>
                    <span className="hidden lg:block text-[12px] text-muted dark:text-dark-muted">{asset.category}</span>
                    <span className="hidden lg:block text-[12px] font-mono text-muted dark:text-dark-muted">{asset.lastService}</span>
                    <div className="hidden lg:flex items-center gap-1.5">
                      {asset.status === 'overdue' && <AlertTriangle size={12} className="text-terracotta dark:text-dark-terracotta" />}
                      {asset.status === 'upcoming' && <Clock size={12} className="text-sand dark:text-dark-sand" />}
                      <span className="text-[12px] font-mono text-muted dark:text-dark-muted">{asset.nextService}</span>
                    </div>
                    <span className={`hidden lg:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                    <div className="flex items-center gap-1.5 ml-auto lg:ml-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setLogForm(p => ({ ...p, by: user?.profile?.name || user?.email || '' }))
                          setLogDrawer(asset.id)
                        }}
                        className="px-2.5 py-1 text-[11px] border border-line dark:border-dark-line rounded text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
                      >
                        Registrar
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="p-1.5 text-muted dark:text-dark-muted hover:text-terracotta dark:hover:text-dark-terracotta transition-colors"
                        title="Eliminar activo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {/* Drawer: Add Asset */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink/20 dark:bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink">Agregar activo</h3>
              <button onClick={() => setDrawerOpen(false)} className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink"><X size={18} /></button>
            </div>
            <form onSubmit={saveAsset} className="flex-1 flex flex-col">
              <div className="flex-1 px-6 py-6 space-y-4">
                {[
                  { label: 'Nombre del activo', key: 'name', req: true, ph: 'Heladera Samsung' },
                  { label: 'Marca', key: 'brand', req: false, ph: 'Samsung' },
                  { label: 'Modelo', key: 'model', req: false, ph: 'RT38K5932SL' },
                  { label: 'Número de serie (opcional)', key: 'serial', req: false, ph: 'SN-98234-A' },
                  { label: 'Ubicación en el hogar', key: 'location', req: false, ph: 'Cocina' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">{f.label}</label>
                    <input
                      required={f.req}
                      value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.ph}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                    />
                  </div>
                ))}
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
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Fecha de compra</label>
                    <input
                      type="date"
                      value={form.purchaseDate}
                      onChange={e => setForm(p => ({ ...p, purchaseDate: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Vto. garantía</label>
                    <input
                      type="date"
                      value={form.warrantyExp}
                      onChange={e => setForm(p => ({ ...p, warrantyExp: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 border-t border-line dark:border-dark-line flex gap-3">
                <button type="button" onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted hover:text-ink transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity">Guardar activo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Add Maintenance Log */}
      {logDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink/20 dark:bg-black/40" onClick={() => setLogDrawer(null)} />
          <div className="relative w-full max-w-md h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink">Registrar mantenimiento</h3>
              <button onClick={() => setLogDrawer(null)} className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink"><X size={18} /></button>
            </div>
            <form onSubmit={saveLog} className="flex-1 flex flex-col">
              <div className="flex-1 px-6 py-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Tarea realizada</label>
                  <input
                    required
                    value={logForm.task}
                    onChange={e => setLogForm(p => ({ ...p, task: e.target.value }))}
                    placeholder="Cambio de filtro / Service oficial"
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Realizado por</label>
                    <input
                      value={logForm.by}
                      onChange={e => setLogForm(p => ({ ...p, by: e.target.value }))}
                      placeholder={user?.profile?.name || 'Yo'}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Costo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[13px] font-mono">$</span>
                      <input
                        value={logForm.cost}
                        onChange={e => setLogForm(p => ({ ...p, cost: e.target.value }))}
                        placeholder="25000"
                        className="w-full pl-7 pr-3 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] font-mono text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Fecha del servicio</label>
                  <input
                    type="date"
                    value={logForm.date}
                    onChange={e => setLogForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Notas adicionales</label>
                  <textarea
                    value={logForm.notes}
                    onChange={e => setLogForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Incluye garantía de 6 meses..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-5 border-t border-line dark:border-dark-line flex gap-3">
                <button type="button" onClick={() => setLogDrawer(null)} className="flex-1 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted hover:text-ink transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity">Guardar registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
