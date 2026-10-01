'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus,
  X,
  AlertTriangle,
  Clock,
  ChevronDown,
  Trash2,
  History,
  Calendar,
  Edit3,
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useHousehold } from '@/context/HouseholdContext'
import { useAuth } from '@/context/AuthContext'
import {
  getAssets,
  addAsset,
  deleteAsset,
  addMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
  getAllMaintenanceLogs,
  Asset,
  AssetCategory,
  MaintenanceLog,
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

const getTodayStr = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getInDaysStr = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const addMonthsToDate = (baseDateStr: string, monthsToAdd: number): string => {
  if (!baseDateStr) return ''
  const clean = baseDateStr.split('T')[0]
  const [y, m, d] = clean.split('-').map(Number)
  if (isNaN(y) || isNaN(m) || isNaN(d)) return ''
  const targetYear = y + Math.floor((m - 1 + monthsToAdd) / 12)
  const targetMonth = ((m - 1 + monthsToAdd) % 12 + 12) % 12
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
  const targetDay = Math.min(d, daysInMonth)
  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
}

const formatDisplayDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—'
  const clean = dateStr.split('T')[0]
  const parts = clean.split('-')
  if (parts.length !== 3) return dateStr
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  const d = new Date(year, month, day)
  if (isNaN(d.getTime())) return dateStr
  const isCurrentYear = year === new Date().getFullYear()
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    ...(isCurrentYear ? {} : { year: 'numeric' }),
  })
}

export default function Maintenance() {
  const { toast } = useToast()
  const { currentHousehold } = useHousehold()
  const { user } = useAuth()

  const [rawAssets, setRawAssets] = useState<Asset[]>([])
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [members, setMembers] = useState<HouseholdMemberDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [logDrawer, setLogDrawer] = useState<string | null>(null)
  const [historyDrawer, setHistoryDrawer] = useState<string | null>(null)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)

  // Forms
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
    next_service_date: '',
    notes: '',
  })

  const [editLogForm, setEditLogForm] = useState({
    task_name: '',
    performed_by: '',
    cost: '',
    service_date: '',
    next_service_date: '',
    notes: '',
  })

  const loadData = useCallback(async () => {
    if (!currentHousehold) return
    try {
      const [assetsData, membersData, logsData] = await Promise.all([
        getAssets(currentHousehold.id).catch(() => []),
        getHouseholdMembers(currentHousehold.id).catch(() => []),
        getAllMaintenanceLogs(currentHousehold.id).catch(() => []),
      ])
      setRawAssets(assetsData || [])
      setMembers(membersData || [])
      setLogs(logsData || [])
    } catch (err) {
      console.error('Error fetching maintenance data:', err)
    }
  }, [currentHousehold])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    loadData().finally(() => {
      if (mounted) setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [loadData])

  // Computed assets with reactive lastService, nextService, and status
  const todayStr = useMemo(() => getTodayStr(), [])
  const in30DaysStr = useMemo(() => getInDaysStr(30), [])

  const assets = useMemo<MaintenanceAssetItem[]>(() => {
    return rawAssets.map(asset => {
      const assetLogs = logs.filter(l => l.asset_id === asset.id)

      // Sort logs descending by service_date (or created_at)
      const sortedLogs = [...assetLogs].sort((a, b) => {
        const dateA = a.service_date || a.created_at || ''
        const dateB = b.service_date || b.created_at || ''
        return dateB.localeCompare(dateA)
      })

      // Last service: formatted date of most recent service_date (or '—' if none)
      const lastLogWithDate = sortedLogs.find(l => Boolean(l.service_date))
      const lastService = lastLogWithDate?.service_date ? formatDisplayDate(lastLogWithDate.service_date) : '—'

      // Active next_service_date:
      // A next_service_date is active if no subsequent service was performed on or after that scheduled date
      const activeNextLogs = sortedLogs.filter(log => {
        if (!log.next_service_date) return false
        const targetNextDate = log.next_service_date.split('T')[0]
        const hasSubsequentService = sortedLogs.some(other => {
          if (!other.service_date) return false
          const otherDate = other.service_date.split('T')[0]
          return otherDate >= targetNextDate
        })
        return !hasSubsequentService
      })

      let status: 'ok' | 'upcoming' | 'overdue' = 'ok'
      let nextService = '—'

      if (activeNextLogs.length > 0) {
        // Sort active next logs by date ascending
        const sortedActive = [...activeNextLogs].sort((a, b) => {
          return (a.next_service_date || '').localeCompare(b.next_service_date || '')
        })

        // 1. If any active next_service_date < today: 'overdue' ("Atrasado")
        const overdueLog = sortedActive.find(l => (l.next_service_date || '').split('T')[0] < todayStr)
        if (overdueLog) {
          status = 'overdue'
          nextService = formatDisplayDate(overdueLog.next_service_date)
        } else {
          // 2. Else if next_service_date is within the next 30 days: 'upcoming' ("Próximo")
          const upcomingLog = sortedActive.find(l => (l.next_service_date || '').split('T')[0] <= in30DaysStr)
          if (upcomingLog) {
            status = 'upcoming'
            nextService = formatDisplayDate(upcomingLog.next_service_date)
          } else {
            // 3. Else: 'ok' ("Al día")
            status = 'ok'
            nextService = formatDisplayDate(sortedActive[0].next_service_date)
          }
        }
      }

      return {
        id: asset.id,
        name: asset.name,
        category: categoryMapFromDb[asset.category] || 'Electrodomésticos',
        brand: asset.model_number?.split(' ')[0] || '',
        model: asset.model_number || '',
        serial: asset.serial_number || '',
        purchaseDate: asset.purchase_date || '',
        warrantyExp: asset.warranty_expiry || '',
        location: asset.location || 'Hogar',
        lastService,
        nextService,
        status,
      }
    })
  }, [rawAssets, logs, todayStr, in30DaysStr])

  const overdueCount = useMemo(() => assets.filter(a => a.status === 'overdue').length, [assets])
  const upcomingCount = useMemo(() => assets.filter(a => a.status === 'upcoming').length, [assets])

  const selectedHistoryAsset = useMemo(() => {
    if (!historyDrawer) return null
    return rawAssets.find(a => a.id === historyDrawer) || null
  }, [historyDrawer, rawAssets])

  const selectedAssetLogs = useMemo(() => {
    if (!historyDrawer) return []
    return logs
      .filter(l => l.asset_id === historyDrawer)
      .sort((a, b) => {
        const dateA = a.service_date || a.created_at || ''
        const dateB = b.service_date || b.created_at || ''
        return dateB.localeCompare(dateA)
      })
  }, [historyDrawer, logs])

  const saveAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHousehold || !user) return

    try {
      setSubmitting(true)
      const dbCategory = categoryMapToDb[form.category] || 'APPLIANCE'
      await addAsset({
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

      await loadData()
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
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este activo y todo su historial?')) return
    try {
      await deleteAsset(id)
      await loadData()
      if (historyDrawer === id) setHistoryDrawer(null)
      if (logDrawer === id) setLogDrawer(null)
      toast('Activo eliminado.')
    } catch (err) {
      console.error('Failed to delete asset:', err)
      toast('Error al eliminar activo.')
    }
  }

  const openLogDrawer = (assetId: string) => {
    setLogForm({
      task: '',
      by: user?.profile?.name || user?.email || '',
      cost: '',
      date: getTodayStr(),
      next_service_date: '',
      notes: '',
    })
    setLogDrawer(assetId)
  }

  const saveLog = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetAssetId = logDrawer
    if (!targetAssetId || !user) return

    try {
      setSubmitting(true)
      const numericCost = Number(logForm.cost.replace(/[^\d]/g, '')) || 0
      const performedBy = logForm.by || user.profile?.name || user.email || 'Miembro'
      const serviceDate = logForm.date || getTodayStr()

      await addMaintenanceLog({
        asset_id: targetAssetId,
        task_name: logForm.task,
        performed_by: performedBy,
        cost: numericCost,
        notes: logForm.notes?.trim() || null,
        service_date: serviceDate,
        next_service_date: logForm.next_service_date ? logForm.next_service_date : null,
        created_by: user.id,
      })

      await loadData()
      setLogDrawer(null)
      toast('Mantenimiento registrado.')
      setLogForm({ task: '', by: '', cost: '', date: '', next_service_date: '', notes: '' })
    } catch (err) {
      console.error('Failed to sync log to backend:', err)
      toast('Error al registrar mantenimiento.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditingLog = (log: MaintenanceLog) => {
    setEditingLogId(log.id)
    setEditLogForm({
      task_name: log.task_name,
      performed_by: log.performed_by || '',
      cost: log.cost !== null && log.cost !== undefined ? String(log.cost) : '',
      service_date: log.service_date ? log.service_date.split('T')[0] : '',
      next_service_date: log.next_service_date ? log.next_service_date.split('T')[0] : '',
      notes: log.notes || '',
    })
  }

  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLogId) return
    try {
      setSubmitting(true)
      const numericCost = Number(editLogForm.cost.replace(/[^\d]/g, '')) || 0
      await updateMaintenanceLog(editingLogId, {
        task_name: editLogForm.task_name,
        performed_by: editLogForm.performed_by || null,
        cost: numericCost,
        service_date: editLogForm.service_date || null,
        next_service_date: editLogForm.next_service_date ? editLogForm.next_service_date : null,
        notes: editLogForm.notes?.trim() || null,
      })
      await loadData()
      setEditingLogId(null)
      toast('Mantenimiento actualizado.')
    } catch (err) {
      console.error('Failed to update maintenance log:', err)
      toast('Error al actualizar el registro.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('¿Eliminar este registro de mantenimiento?')) return
    try {
      await deleteMaintenanceLog(logId)
      await loadData()
      toast('Registro eliminado.')
    } catch (err) {
      console.error('Failed to delete log:', err)
      toast('Error al eliminar registro.')
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
          <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden bg-surface dark:bg-dark-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line dark:border-dark-line bg-bg dark:bg-dark-bg text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
                    <th className="py-3 px-5 font-semibold">Activo</th>
                    <th className="py-3 px-4 font-semibold">Categoría</th>
                    <th className="py-3 px-4 font-semibold">Último servicio</th>
                    <th className="py-3 px-4 font-semibold">Próximo</th>
                    <th className="py-3 px-4 font-semibold">Estado</th>
                    <th className="py-3 px-5 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line dark:divide-dark-line">
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <p className="text-[15px] text-ink dark:text-dark-ink mb-1">No hay activos registrados.</p>
                        <p className="text-[13px] text-muted dark:text-dark-muted">Agregá electrodomésticos, vehículos o sistemas de tu hogar para registrar su mantenimiento.</p>
                      </td>
                    </tr>
                  ) : (
                    assets.map(asset => {
                      const badge = statusBadge[asset.status] || statusBadge.ok
                      return (
                        <tr key={asset.id} className="hover:bg-bg/60 dark:hover:bg-dark-bg/60 transition-colors">
                          <td className="py-4 px-5">
                            <div className="text-[13px] font-medium text-ink dark:text-dark-ink">{asset.name}</div>
                            <div className="text-[11px] text-muted dark:text-dark-muted mt-0.5">
                              {asset.brand} {asset.model} {asset.location && `· ${asset.location}`}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-[12px] text-muted dark:text-dark-muted whitespace-nowrap">
                            {asset.category}
                          </td>
                          <td className="py-4 px-4 text-[12px] font-mono text-muted dark:text-dark-muted whitespace-nowrap">
                            {asset.lastService}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {asset.status === 'overdue' && (
                                <AlertTriangle size={12} className="text-terracotta dark:text-dark-terracotta shrink-0" />
                              )}
                              {asset.status === 'upcoming' && (
                                <Clock size={12} className="text-sand dark:text-dark-sand shrink-0" />
                              )}
                              <span className="text-[12px] font-mono text-muted dark:text-dark-muted">
                                {asset.nextService}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setHistoryDrawer(asset.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium border border-line dark:border-dark-line rounded text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink hover:bg-bg dark:hover:bg-dark-bg transition-colors"
                                title="Ver historial de mantenimiento"
                              >
                                <History size={12} />
                                <span>Historial</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openLogDrawer(asset.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded hover:opacity-85 transition-opacity"
                                title="Registrar mantenimiento"
                              >
                                <Plus size={11} />
                                <span>Registrar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="p-1.5 text-muted dark:text-dark-muted hover:text-terracotta dark:hover:text-dark-terracotta hover:bg-terracotta-bg/40 dark:hover:bg-dark-surface rounded transition-colors"
                                title="Eliminar activo"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
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
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity disabled:opacity-50">
                  {submitting ? 'Guardando...' : 'Guardar activo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Add Maintenance Log */}
      {logDrawer && (
        <div className="fixed inset-0 z-[60] flex justify-end">
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
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Fecha de próximo mantenimiento (opcional)
                  </label>
                  <input
                    type="date"
                    value={logForm.next_service_date}
                    onChange={e => setLogForm(p => ({ ...p, next_service_date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
                  />
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[11px] text-muted dark:text-dark-muted">Sugerir:</span>
                    <button
                      type="button"
                      onClick={() => setLogForm(p => ({ ...p, next_service_date: addMonthsToDate(p.date || getTodayStr(), 3) }))}
                      className="px-2 py-0.5 text-[11px] font-medium border border-line dark:border-dark-line rounded text-muted hover:text-ink hover:border-olive transition-colors"
                    >
                      +3 meses
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogForm(p => ({ ...p, next_service_date: addMonthsToDate(p.date || getTodayStr(), 6) }))}
                      className="px-2 py-0.5 text-[11px] font-medium border border-line dark:border-dark-line rounded text-muted hover:text-ink hover:border-olive transition-colors"
                    >
                      +6 meses
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogForm(p => ({ ...p, next_service_date: addMonthsToDate(p.date || getTodayStr(), 12) }))}
                      className="px-2 py-0.5 text-[11px] font-medium border border-line dark:border-dark-line rounded text-muted hover:text-ink hover:border-olive transition-colors"
                    >
                      +1 año
                    </button>
                    {logForm.next_service_date && (
                      <button
                        type="button"
                        onClick={() => setLogForm(p => ({ ...p, next_service_date: '' }))}
                        className="px-2 py-0.5 text-[11px] text-muted hover:text-terracotta transition-colors ml-auto"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
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
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity disabled:opacity-50">
                  {submitting ? 'Guardando...' : 'Guardar registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Asset History & Edit Logs */}
      {historyDrawer && selectedHistoryAsset && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-ink/20 dark:bg-black/40"
            onClick={() => {
              setHistoryDrawer(null)
              setEditingLogId(null)
            }}
          />
          <div className="relative w-full max-w-lg h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <div>
                <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink">Historial de mantenimiento</h3>
                <p className="text-[12px] text-muted dark:text-dark-muted mt-0.5">
                  {selectedHistoryAsset.name} {selectedHistoryAsset.model_number ? `· ${selectedHistoryAsset.model_number}` : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setHistoryDrawer(null)
                  setEditingLogId(null)
                }}
                className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Action / summary bar */}
            <div className="px-6 py-3 border-b border-line dark:border-dark-line bg-bg dark:bg-dark-bg flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted dark:text-dark-muted">
                {selectedAssetLogs.length} {selectedAssetLogs.length === 1 ? 'registro' : 'registros'}
              </span>
              <button
                type="button"
                onClick={() => openLogDrawer(selectedHistoryAsset.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[11px] font-medium hover:opacity-80 transition-opacity"
              >
                <Plus size={13} /> Registrar servicio
              </button>
            </div>

            {/* Log list */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {selectedAssetLogs.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-[14px] text-ink dark:text-dark-ink mb-1">Sin mantenimientos registrados</p>
                  <p className="text-[12px] text-muted dark:text-dark-muted max-w-xs mx-auto mb-4">
                    Aún no registraste servicios ni mantenimientos para este activo.
                  </p>
                  <button
                    type="button"
                    onClick={() => openLogDrawer(selectedHistoryAsset.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[12px] font-medium hover:opacity-80 transition-opacity"
                  >
                    <Plus size={13} /> Registrar el primero
                  </button>
                </div>
              ) : (
                selectedAssetLogs.map(log => {
                  const isEditing = editingLogId === log.id
                  const isOverdue = log.next_service_date && log.next_service_date.split('T')[0] < todayStr
                  const isUpcoming = log.next_service_date && !isOverdue && log.next_service_date.split('T')[0] <= in30DaysStr

                  return (
                    <div
                      key={log.id}
                      className="p-4 border border-line dark:border-dark-line rounded-[4px] bg-bg dark:bg-dark-bg transition-colors"
                    >
                      {isEditing ? (
                        <form onSubmit={handleUpdateLog} className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1">
                              Tarea realizada
                            </label>
                            <input
                              required
                              value={editLogForm.task_name}
                              onChange={e => setEditLogForm(p => ({ ...p, task_name: e.target.value }))}
                              className="w-full px-3 py-2 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface focus:outline-none focus:border-olive"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1">
                                Realizado por
                              </label>
                              <input
                                value={editLogForm.performed_by}
                                onChange={e => setEditLogForm(p => ({ ...p, performed_by: e.target.value }))}
                                className="w-full px-3 py-2 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface focus:outline-none focus:border-olive"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1">
                                Costo
                              </label>
                              <input
                                value={editLogForm.cost}
                                onChange={e => setEditLogForm(p => ({ ...p, cost: e.target.value }))}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-line dark:border-dark-line rounded-[4px] text-[12px] font-mono text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface focus:outline-none focus:border-olive"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1">
                              Fecha del servicio
                            </label>
                            <input
                              type="date"
                              value={editLogForm.service_date}
                              onChange={e => setEditLogForm(p => ({ ...p, service_date: e.target.value }))}
                              className="w-full px-3 py-2 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface focus:outline-none focus:border-olive"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1">
                              Fecha de próximo mantenimiento (opcional)
                            </label>
                            <input
                              type="date"
                              value={editLogForm.next_service_date}
                              onChange={e => setEditLogForm(p => ({ ...p, next_service_date: e.target.value }))}
                              className="w-full px-3 py-2 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface focus:outline-none focus:border-olive"
                            />
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className="text-[10px] text-muted dark:text-dark-muted">Sugerir:</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditLogForm(p => ({
                                    ...p,
                                    next_service_date: addMonthsToDate(p.service_date || getTodayStr(), 3),
                                  }))
                                }
                                className="px-1.5 py-0.5 text-[10px] font-medium border border-line dark:border-dark-line rounded text-muted hover:text-ink hover:border-olive transition-colors"
                              >
                                +3 meses
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditLogForm(p => ({
                                    ...p,
                                    next_service_date: addMonthsToDate(p.service_date || getTodayStr(), 6),
                                  }))
                                }
                                className="px-1.5 py-0.5 text-[10px] font-medium border border-line dark:border-dark-line rounded text-muted hover:text-ink hover:border-olive transition-colors"
                              >
                                +6 meses
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditLogForm(p => ({
                                    ...p,
                                    next_service_date: addMonthsToDate(p.service_date || getTodayStr(), 12),
                                  }))
                                }
                                className="px-1.5 py-0.5 text-[10px] font-medium border border-line dark:border-dark-line rounded text-muted hover:text-ink hover:border-olive transition-colors"
                              >
                                +1 año
                              </button>
                              {editLogForm.next_service_date && (
                                <button
                                  type="button"
                                  onClick={() => setEditLogForm(p => ({ ...p, next_service_date: '' }))}
                                  className="px-1.5 py-0.5 text-[10px] text-muted hover:text-terracotta transition-colors ml-auto"
                                >
                                  Limpiar
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1">
                              Notas adicionales
                            </label>
                            <textarea
                              value={editLogForm.notes}
                              onChange={e => setEditLogForm(p => ({ ...p, notes: e.target.value }))}
                              rows={2}
                              className="w-full px-3 py-2 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface focus:outline-none focus:border-olive resize-none"
                            />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingLogId(null)}
                              className="flex-1 py-1.5 border border-line dark:border-dark-line rounded-[4px] text-[11px] text-muted hover:text-ink transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={submitting}
                              className="flex-1 py-1.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[11px] font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                            >
                              {submitting ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-[13px] font-semibold text-ink dark:text-dark-ink leading-tight">
                                {log.task_name}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted dark:text-dark-muted flex-wrap">
                                <span className="font-mono text-ink dark:text-dark-ink font-medium">
                                  {formatDisplayDate(log.service_date)}
                                </span>
                                {log.performed_by && <span>· Por {log.performed_by}</span>}
                                {log.cost !== null && log.cost !== undefined && log.cost > 0 && (
                                  <span className="font-mono">· ${log.cost.toLocaleString('es-AR')}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEditingLog(log)}
                                className="p-1 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors rounded hover:bg-surface dark:hover:bg-dark-surface"
                                title="Editar registro"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-1 text-muted dark:text-dark-muted hover:text-terracotta dark:hover:text-dark-terracotta transition-colors rounded hover:bg-surface dark:hover:bg-dark-surface"
                                title="Eliminar registro"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Next service date row */}
                          <div className="pt-2 border-t border-line/60 dark:border-dark-line/60 flex items-center justify-between text-[11px]">
                            <span className="text-muted dark:text-dark-muted">Próximo servicio:</span>
                            {log.next_service_date ? (
                              <div className="flex items-center gap-1.5">
                                <Calendar size={11} className="text-muted" />
                                <span className="font-mono text-ink dark:text-dark-ink">
                                  {formatDisplayDate(log.next_service_date)}
                                </span>
                                {isOverdue && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded text-terracotta dark:text-dark-terracotta bg-terracotta-bg dark:bg-dark-surface">
                                    Atrasado
                                  </span>
                                )}
                                {isUpcoming && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded text-sand dark:text-dark-sand bg-sand-bg dark:bg-dark-surface">
                                    Próximo
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted/60 italic font-mono">—</span>
                            )}
                          </div>

                          {log.notes && (
                            <div className="p-2 bg-surface dark:bg-dark-surface rounded text-[11px] text-muted dark:text-dark-muted italic border border-line/40 dark:border-dark-line/40">
                              {log.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
