'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
} from '@/components/ui/ChartWrapper'
import { Download } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useHousehold } from '@/context/HouseholdContext'
import { getExpenses, getBudgets, Expense } from '@/services/expenseService'
import { getTasks, Task } from '@/services/taskService'
import { getAllItemsForHousehold, ShoppingListItem } from '@/services/shoppingService'
import { getAssets, Asset } from '@/services/maintenanceService'

const tooltipStyle = {
  contentStyle: { background: 'var(--color-surface, #fff)', border: '1px solid #D9D8D0', borderRadius: '4px', fontSize: '12px', fontFamily: 'DM Mono, monospace' },
}

export default function Reports() {
  const { toast } = useToast()
  const { currentHousehold } = useHousehold()
  const [period, setPeriod] = useState('6m')
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgetTotal, setBudgetTotal] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [shoppingItems, setShoppingItems] = useState<ShoppingListItem[]>([])
  const [assets, setAssets] = useState<Asset[]>([])

  useEffect(() => {
    if (!currentHousehold) return
    let mounted = true
    setLoading(true)

    Promise.all([
      getExpenses(currentHousehold.id).catch(() => []),
      getBudgets(currentHousehold.id).catch(() => []),
      getTasks(currentHousehold.id).catch(() => []),
      getAllItemsForHousehold(currentHousehold.id).catch(() => []),
      getAssets(currentHousehold.id).catch(() => []),
    ])
      .then(([expData, budgetData, taskData, shopData, assetData]) => {
        if (!mounted) return
        setExpenses(expData || [])
        if (budgetData && budgetData.length > 0) {
          setBudgetTotal(budgetData[0].amount)
        } else {
          setBudgetTotal(0)
        }
        setTasks(taskData || [])
        setShoppingItems(shopData || [])
        setAssets(assetData || [])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [currentHousehold])

  // Aggregate monthly spend
  const monthlySpend = useMemo(() => {
    if (expenses.length === 0) return []
    const monthsMap: Record<string, number> = {}
    expenses.forEach(e => {
      const d = new Date(e.date || e.created_at)
      const mName = isNaN(d.getTime()) ? 'Mes' : d.toLocaleDateString('es-AR', { month: 'short' })
      const capitalized = mName.charAt(0).toUpperCase() + mName.slice(1).replace('.', '')
      monthsMap[capitalized] = (monthsMap[capitalized] || 0) + e.amount
    })
    return Object.entries(monthsMap).map(([mes, total]) => ({
      mes,
      total,
      budget: budgetTotal,
    }))
  }, [expenses, budgetTotal])

  // Aggregate task completion
  const taskCompletionData = useMemo(() => {
    if (tasks.length === 0) return []
    const monthsMap: Record<string, { total: number; completadas: number }> = {}
    tasks.forEach(t => {
      const d = new Date(t.due_date || t.created_at)
      const mName = isNaN(d.getTime()) ? 'Mes' : d.toLocaleDateString('es-AR', { month: 'short' })
      const capitalized = mName.charAt(0).toUpperCase() + mName.slice(1).replace('.', '')
      if (!monthsMap[capitalized]) {
        monthsMap[capitalized] = { total: 0, completadas: 0 }
      }
      monthsMap[capitalized].total += 1
      if (t.status === 'COMPLETED') {
        monthsMap[capitalized].completadas += 1
      }
    })
    return Object.entries(monthsMap).map(([mes, stat]) => ({
      mes,
      total: stat.total,
      completadas: stat.completadas,
    }))
  }, [tasks])

  // Top consumed / purchased items
  const topItems = useMemo(() => {
    if (shoppingItems.length === 0) return []
    const countMap: Record<string, number> = {}
    shoppingItems.forEach(item => {
      const name = item.item_name.trim()
      countMap[name] = (countMap[name] || 0) + 1
    })
    return Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [shoppingItems])

  // Metrics
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0)
  const completedTasksCount = tasks.filter(t => t.status === 'COMPLETED').length
  const totalTasksCount = tasks.length
  const taskPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0
  const avgMonthlySpend = monthlySpend.length > 0 ? Math.round(totalSpent / monthlySpend.length) : totalSpent

  const exportReport = () => {
    if (expenses.length === 0 && tasks.length === 0) {
      toast('No hay datos para exportar.')
      return
    }
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Tipo,Descripcion,Monto/Estado,Fecha\n' +
      expenses.map(e => `Gasto,"${e.description}",${e.amount},${e.date || e.created_at}`).join('\n') +
      '\n' +
      tasks.map(t => `Tarea,"${t.title}",${t.status},${t.due_date || t.created_at}`).join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `reporte_hogar_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast('Reporte exportado exitosamente.')
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="mb-10 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">Analítica</p>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[42px] lg:text-[56px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">REPORTES</h1>
            <p className="text-[14px] text-muted dark:text-dark-muted mt-3">Un resumen de cómo funciona tu hogar.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-bg dark:bg-dark-bg rounded-[4px] p-1 border border-line dark:border-dark-line">
              {['3m', '6m', '1a'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-[3px] transition-colors ${period === p ? 'bg-surface dark:bg-dark-surface text-ink dark:text-dark-ink' : 'text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={exportReport}
              className="flex items-center gap-1.5 px-3 py-2 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
            >
              <Download size={13} /> Exportar
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <div className="w-6 h-6 border-2 border-olive border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line dark:bg-dark-line rounded-[4px] overflow-hidden mb-10">
            {[
              {
                label: 'Gasto promedio',
                value: `$ ${avgMonthlySpend.toLocaleString('es-AR')}`,
                delta: `${expenses.length} gastos totales`,
              },
              {
                label: 'Tareas completadas',
                value: `${completedTasksCount} / ${totalTasksCount}`,
                delta: `${taskPct}% tasa de éxito`,
              },
              {
                label: 'Activos en seguimiento',
                value: `${assets.length}`,
                delta: 'Mantenimiento preventivo',
              },
              {
                label: 'Ítems en compras',
                value: `${shoppingItems.length}`,
                delta: 'Consumo registrado',
              },
            ].map(m => (
              <div key={m.label} className="bg-surface dark:bg-dark-surface px-5 py-5">
                <div className="text-[11px] text-muted dark:text-dark-muted mb-2">{m.label}</div>
                <div className="font-mono text-[22px] font-light text-ink dark:text-dark-ink">{m.value}</div>
                <div className="text-[11px] text-muted dark:text-dark-muted mt-1">{m.delta}</div>
              </div>
            ))}
          </div>

          {/* Charts grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Spend vs budget */}
            <div className="border border-line dark:border-dark-line rounded-[4px] p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[13px] font-semibold text-ink dark:text-dark-ink">Gasto vs. Presupuesto</h3>
                  <p className="text-[11px] text-muted dark:text-dark-muted mt-0.5">Historial acumulado</p>
                </div>
                <div className="flex gap-3 text-[10px] text-muted dark:text-dark-muted">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-olive inline-block" /> Gasto</span>
                  {budgetTotal > 0 && <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-line dark:bg-dark-line inline-block border-dashed border-t" /> Presupuesto</span>}
                </div>
              </div>
              {monthlySpend.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={monthlySpend}>
                    <defs>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9D9652" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#9D9652" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#77766E' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip {...tooltipStyle} formatter={(v: unknown) => { const n = Number(v ?? 0); return [`$ ${n.toLocaleString('es-AR')}`, ''] as [string, string]}} />
                    {budgetTotal > 0 && (
                      <Area type="monotone" dataKey="budget" stroke="#D9D8D0" strokeWidth={1} strokeDasharray="4 2" fill="none" dot={false} />
                    )}
                    <Area type="monotone" dataKey="total" stroke="#9D9652" strokeWidth={1.5} fill="url(#grad2)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-center">
                  <p className="text-[13px] text-muted dark:text-dark-muted">No hay gastos registrados para graficar.</p>
                </div>
              )}
            </div>

            {/* Task completion */}
            <div className="border border-line dark:border-dark-line rounded-[4px] p-5">
              <div className="mb-5">
                <h3 className="text-[13px] font-semibold text-ink dark:text-dark-ink">Tareas del hogar</h3>
                <p className="text-[11px] text-muted dark:text-dark-muted mt-0.5">Completadas vs. total</p>
              </div>
              {taskCompletionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={taskCompletionData} barGap={2}>
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#77766E' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="total" fill="#D9D8D0" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="completadas" fill="#9D9652" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-center">
                  <p className="text-[13px] text-muted dark:text-dark-muted">No hay tareas registradas para analizar.</p>
                </div>
              )}
            </div>

            {/* Top consumed items */}
            <div className="border border-line dark:border-dark-line rounded-[4px] p-5 lg:col-span-2">
              <div className="mb-5">
                <h3 className="text-[13px] font-semibold text-ink dark:text-dark-ink">Ítems más frecuentes en compras</h3>
                <p className="text-[11px] text-muted dark:text-dark-muted mt-0.5">Los productos más añadidos a las listas del hogar</p>
              </div>
              {topItems.length > 0 ? (
                <div className="space-y-3 max-w-xl">
                  {topItems.map((item, i) => {
                    const maxCount = topItems[0].count || 1
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-muted dark:text-dark-muted w-4">{String(i + 1).padStart(2, '0')}</span>
                        <span className="flex-1 text-[13px] text-ink dark:text-dark-ink">{item.name}</span>
                        <div className="w-24 h-1.5 bg-line dark:bg-dark-line rounded-full overflow-hidden">
                          <div className="h-full bg-sand dark:bg-dark-sand rounded-full" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                        </div>
                        <span className="font-mono text-[12px] text-muted dark:text-dark-muted w-4 text-right">{item.count}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-muted dark:text-dark-muted">Aún no hay compras registradas en tus listas.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
