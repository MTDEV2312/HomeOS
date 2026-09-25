'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, X, ChevronDown, TrendingUp, Trash2 } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from '@/components/ui/ChartWrapper'
import { useToast } from '@/context/ToastContext'
import { useHousehold } from '@/context/HouseholdContext'
import { useAuth } from '@/context/AuthContext'
import { getExpenses, addExpense, deleteExpense, getBudgets } from '@/services/expenseService'
import { getHouseholdMembers, HouseholdMemberDetails } from '@/services/householdService'

interface ExpenseDisplayItem {
  id: string
  date: string
  rawDate: string
  description: string
  category: string
  paidBy: string
  amount: number
}

const catColors = ['#9D9652', '#C7CDBE', '#BBD9DC', '#E5DCC8', '#C97963', '#A8B5A2', '#D4AF37', '#93A8AC']
const defaultCategories = ['Alimentación', 'Vivienda', 'Servicios', 'Salud', 'Mantenimiento', 'Transporte', 'Educación', 'Ocio', 'Otro']

export default function Expenses() {
  const { toast } = useToast()
  const { currentHousehold } = useHousehold()
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<ExpenseDisplayItem[]>([])
  const [budgetTotal, setBudgetTotal] = useState(0)
  const [members, setMembers] = useState<HouseholdMemberDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: 'Alimentación',
    paidBy: '',
    note: '',
    date: '',
  })

  useEffect(() => {
    if (!currentHousehold) return
    let mounted = true
    setLoading(true)

    Promise.all([
      getExpenses(currentHousehold.id).catch(() => []),
      getBudgets(currentHousehold.id).catch(() => []),
      getHouseholdMembers(currentHousehold.id).catch(() => []),
    ])
      .then(([expData, budgetData, memberData]) => {
        if (!mounted) return
        if (memberData) setMembers(memberData)
        if (budgetData && budgetData.length > 0) {
          setBudgetTotal(budgetData[0].amount)
        } else {
          setBudgetTotal(0)
        }

        const memberMap = new Map(memberData?.map(m => [m.user_id, m.name]) || [])

        if (expData) {
          setExpenses(
            expData.map(d => ({
              id: d.id,
              date: new Date(d.date || d.created_at).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              rawDate: d.date || d.created_at,
              description: d.description,
              category: d.category?.name || 'Varios',
              paidBy: d.payer_id === user?.id ? 'Tú' : memberMap.get(d.payer_id) || 'Miembro',
              amount: d.amount,
            }))
          )
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [currentHousehold, user?.id])

  const monthlyData = useMemo(() => {
    if (expenses.length === 0) return []
    const monthsMap: Record<string, number> = {}
    const sorted = [...expenses].sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
    sorted.forEach(e => {
      const d = new Date(e.rawDate)
      const mName = isNaN(d.getTime()) ? 'Mes' : d.toLocaleDateString('es-AR', { month: 'short' })
      const capitalized = mName.charAt(0).toUpperCase() + mName.slice(1).replace('.', '')
      monthsMap[capitalized] = (monthsMap[capitalized] || 0) + e.amount
    })
    return Object.entries(monthsMap).map(([mes, total]) => ({ mes, total }))
  }, [expenses])

  const categoryData = useMemo(() => {
    if (expenses.length === 0) return []
    const catMap: Record<string, number> = {}
    expenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount
    })
    return Object.entries(catMap).map(([name, value]) => ({ name, value }))
  }, [expenses])

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0)
  const available = budgetTotal > 0 ? Math.max(0, budgetTotal - totalSpent) : 0
  const daysInMonth = new Date().getDate() || 1
  const avgDaily = Math.round(totalSpent / daysInMonth)
  const pct = budgetTotal > 0 ? Math.round((totalSpent / budgetTotal) * 100) : 0

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHousehold || !user) return

    const numericAmount = Number(form.amount.replace(/\D/g, '')) || 0
    if (numericAmount <= 0) {
      toast('Ingresá un monto válido.')
      return
    }

    const payerId = form.paidBy || user.id
    const payerName = payerId === user.id ? 'Tú' : (members.find(m => m.user_id === payerId)?.name || 'Miembro')
    const expenseDate = form.date || new Date().toISOString().split('T')[0]

    try {
      const created = await addExpense(currentHousehold.id, payerId, {
        amount: numericAmount,
        description: form.description,
        date: expenseDate,
        category_id: null,
        receipt_url: null,
      })

      const newItem: ExpenseDisplayItem = {
        id: created.id,
        date: new Date(created.date || expenseDate).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        rawDate: created.date || expenseDate,
        description: created.description,
        category: form.category,
        paidBy: payerName,
        amount: created.amount,
      }

      setExpenses(prev => [newItem, ...prev])
      setDrawerOpen(false)
      toast('Gasto registrado con éxito.')
      setForm({ amount: '', description: '', category: 'Alimentación', paidBy: '', note: '', date: '' })
    } catch (err) {
      console.error('Failed to sync expense to backend:', err)
      toast('Error al registrar gasto en la base de datos.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id)
      setExpenses(prev => prev.filter(e => e.id !== id))
      toast('Gasto eliminado.')
    } catch (err) {
      console.error('Failed to delete expense:', err)
      toast('Error al eliminar gasto.')
    }
  }

  const currentMonthName = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="mb-10 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">Finanzas</p>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[42px] lg:text-[56px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">
              GASTOS Y<br />PRESUPUESTOS
            </h1>
            <p className="text-[14px] text-muted dark:text-dark-muted mt-3">Entendé cómo se mueve el dinero en tu hogar.</p>
          </div>
          <button
            onClick={() => {
              setForm(p => ({ ...p, paidBy: user?.id || '' }))
              setDrawerOpen(true)
            }}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity"
          >
            <Plus size={14} /> Registrar gasto
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <div className="w-6 h-6 border-2 border-olive border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line dark:bg-dark-line rounded-[4px] overflow-hidden mb-10">
            {[
              {
                label: 'Presupuesto mensual',
                value: budgetTotal > 0 ? `$ ${budgetTotal.toLocaleString('es-AR')}` : 'Sin límite',
              },
              { label: 'Gastado', value: `$ ${totalSpent.toLocaleString('es-AR')}` },
              {
                label: 'Disponible',
                value: budgetTotal > 0 ? `$ ${available.toLocaleString('es-AR')}` : '—',
              },
              { label: 'Promedio diario', value: `$ ${avgDaily.toLocaleString('es-AR')}` },
            ].map(m => (
              <div key={m.label} className="bg-surface dark:bg-dark-surface px-6 py-5">
                <div className="text-[11px] text-muted dark:text-dark-muted mb-2">{m.label}</div>
                <div className="font-mono text-[24px] font-light text-ink dark:text-dark-ink">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Budget progress */}
          {budgetTotal > 0 && (
            <div className="border border-line dark:border-dark-line rounded-[4px] p-6 mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-semibold text-ink dark:text-dark-ink">{capitalizedMonth}</span>
                <span className="font-mono text-[12px] text-muted dark:text-dark-muted">{pct}% utilizado</span>
              </div>
              <div className="h-2 bg-line dark:bg-dark-line rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${pct > 85 ? 'bg-terracotta dark:bg-dark-terracotta' : 'bg-olive dark:bg-dark-olive'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-muted dark:text-dark-muted">
                <span>$ 0</span>
                <span>$ {budgetTotal.toLocaleString('es-AR')}</span>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-[1fr_320px] gap-8 mb-10">
            {/* Trend chart */}
            <div className="border border-line dark:border-dark-line rounded-[4px] p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[13px] font-semibold tracking-[0.05em] text-ink dark:text-dark-ink">Tendencia de gastos</h3>
                <TrendingUp size={14} className="text-muted dark:text-dark-muted" />
              </div>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9D9652" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#9D9652" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#77766E' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-surface, #fff)', border: '1px solid #D9D8D0', borderRadius: '4px', fontSize: '12px' }}
                      formatter={(v: unknown) => { const n = Number(v ?? 0); return [`$ ${n.toLocaleString('es-AR')}`, 'Total'] as [string, string]}}
                    />
                    <Area type="monotone" dataKey="total" stroke="#9D9652" strokeWidth={1.5} fill="url(#grad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-center">
                  <p className="text-[13px] text-muted dark:text-dark-muted">No hay suficientes datos de gastos para graficar tendencias.</p>
                </div>
              )}
            </div>

            {/* Category breakdown */}
            <div className="border border-line dark:border-dark-line rounded-[4px] p-5">
              <h3 className="text-[13px] font-semibold tracking-[0.05em] text-ink dark:text-dark-ink mb-5">Por categoría</h3>
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={categoryData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#77766E' }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: 'var(--color-surface, #fff)', border: '1px solid #D9D8D0', borderRadius: '4px', fontSize: '11px' }}
                        formatter={(v: unknown) => { const n = Number(v ?? 0); return [`$ ${n.toLocaleString('es-AR')}`, ''] as [string, string]}}
                      />
                      <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                        {categoryData.map((_, i) => <Cell key={i} fill={catColors[i % catColors.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1">
                    {categoryData.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: catColors[i % catColors.length] }} />
                          <span className="text-muted dark:text-dark-muted">{c.name}</span>
                        </div>
                        <span className="font-mono text-ink dark:text-dark-ink">$ {c.value.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-center">
                  <p className="text-[13px] text-muted dark:text-dark-muted">Sin categorías registradas.</p>
                </div>
              )}
            </div>
          </div>

          {/* Expense table */}
          <div>
            <h3 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-ink dark:text-dark-ink mb-4">Gastos recientes</h3>
            <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden">
              <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-line dark:border-dark-line bg-bg dark:bg-dark-bg text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
                <span>Fecha</span>
                <span>Descripción</span>
                <span>Categoría</span>
                <span>Pagado por</span>
                <span className="text-right">Monto</span>
                <span></span>
              </div>
              {expenses.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-[15px] text-ink dark:text-dark-ink mb-1">No hay gastos registrados.</p>
                  <p className="text-[13px] text-muted dark:text-dark-muted">Registrá el primer gasto del hogar para empezar a llevar las cuentas.</p>
                </div>
              ) : (
                expenses.map((exp, i) => (
                  <div
                    key={exp.id}
                    className={`flex sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 ${
                      i > 0 ? 'border-t border-line dark:border-dark-line' : ''
                    } hover:bg-bg dark:hover:bg-dark-bg transition-colors group`}
                  >
                    <span className="font-mono text-[11px] text-muted dark:text-dark-muted flex-shrink-0">{exp.date}</span>
                    <span className="text-[13px] font-medium text-ink dark:text-dark-ink flex-1 min-w-0 truncate">{exp.description}</span>
                    <span className="text-[11px] text-muted dark:text-dark-muted hidden sm:block">{exp.category}</span>
                    <span className="text-[11px] text-muted dark:text-dark-muted hidden sm:block">{exp.paidBy}</span>
                    <span className="font-mono text-[14px] font-medium text-ink dark:text-dark-ink text-right flex-shrink-0">
                      $ {exp.amount.toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-terracotta dark:hover:text-dark-terracotta transition-opacity"
                      title="Eliminar gasto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink/20 dark:bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink">Registrar gasto</h3>
              <button onClick={() => setDrawerOpen(false)} className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="flex-1 flex flex-col">
              <div className="flex-1 px-6 py-6 space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Monto</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted dark:text-dark-muted text-[14px] font-mono">$</span>
                    <input
                      required
                      type="text"
                      value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      placeholder="18400"
                      className="w-full pl-8 pr-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[20px] font-mono text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Descripción</label>
                  <input
                    required
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Supermercado Disco"
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Categoría</label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive appearance-none"
                    >
                      {defaultCategories.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Pagado por</label>
                  <div className="relative">
                    <select
                      value={form.paidBy}
                      onChange={e => setForm(p => ({ ...p, paidBy: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive appearance-none"
                    >
                      <option value={user?.id || ''}>Tú ({user?.profile?.name || user?.email || 'Actual'})</option>
                      {members.filter(m => m.user_id !== user?.id).map(m => (
                        <option key={m.user_id} value={m.user_id}>{m.name || m.email}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
                  />
                </div>
              </div>
              <div className="px-6 py-5 border-t border-line dark:border-dark-line flex gap-3">
                <button type="button" onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted hover:text-ink transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity">Guardar gasto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
