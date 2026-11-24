'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Trash2,
  Download,
  Edit3,
  Calendar,
  Check,
  RotateCcw,
  Pencil,
} from 'lucide-react'
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
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getBudgets,
  getMonthlyBudget,
  setMonthlyBudget,
  getExpenseCategories,
  Budget,
  ExpenseCategory,
} from '@/services/expenseService'
import {
  getUserTimeZone,
  toUTCISOString,
  getPeriodKey,
  getCurrentPeriodKey,
  formatLocalDate,
  getLastNMonths,
  formatPeriodLabel,
} from '@/lib/dateUtils'
import { generateMonthlyExpensePDF } from '@/lib/pdfReportGenerator'

interface ExpenseDisplayItem {
  id: string
  date: string
  rawDate: string
  description: string
  category: string
  categoryId?: string | null
  paidBy: string
  payerId?: string | null
  amount: number
}

const catColors = ['#9D9652', '#C7CDBE', '#BBD9DC', '#E5DCC8', '#C97963', '#A8B5A2', '#D4AF37', '#93A8AC']
const defaultCategories = ['Alimentación', 'Vivienda', 'Servicios', 'Salud', 'Mantenimiento', 'Transporte', 'Educación', 'Ocio', 'Otro']

export default function Expenses() {
  const { toast } = useToast()
  const { currentHousehold, members } = useHousehold()
  const { user } = useAuth()

  const userTimeZone = useMemo(() => getUserTimeZone(), [])
  const currentPeriodKey = useMemo(() => getCurrentPeriodKey(userTimeZone), [userTimeZone])

  // Selected period state ('YYYY-MM'), defaults to current month in user's timezone
  const [selectedPeriod, setSelectedPeriod] = useState<string>(currentPeriodKey)

  const [allExpenses, setAllExpenses] = useState<ExpenseDisplayItem[]>([])
  const [editingExpense, setEditingExpense] = useState<ExpenseDisplayItem | null>(null)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [allBudgets, setAllBudgets] = useState<Budget[]>([])
  const [budgetTotal, setBudgetTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [newBudgetAmount, setNewBudgetAmount] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: 'Alimentación',
    paidBy: '',
    note: '',
    date: '',
  })

  // Load all expenses, budgets, and categories
  const loadData = useCallback(async () => {
    if (!currentHousehold) return
    setLoading(true)

    try {
      const [expData, budgetData, categoryData] = await Promise.all([
        getExpenses(currentHousehold.id).catch(() => []),
        getBudgets(currentHousehold.id).catch(() => []),
        getExpenseCategories(currentHousehold.id).catch(() => []),
      ])

      if (budgetData) setAllBudgets(budgetData)
      if (categoryData) setCategories(categoryData)

      const memberMap = new Map(members.map(m => [m.user_id, m.name]))

      if (expData) {
        setAllExpenses(
          expData.map(d => ({
            id: d.id,
            date: formatLocalDate(d.date || d.created_at, userTimeZone),
            rawDate: d.date || d.created_at,
            description: d.description,
            category: d.category?.name || 'Varios',
            categoryId: d.category_id || null,
            paidBy: d.payer_id === user?.id ? 'Tú' : memberMap.get(d.payer_id) || 'Miembro',
            payerId: d.payer_id || null,
            amount: d.amount,
          }))
        )
      }
    } catch (err) {
      console.error('Error loading expenses data:', err)
      toast('Error al cargar datos de gastos.')
    } finally {
      setLoading(false)
    }
  }, [currentHousehold, members, user?.id, userTimeZone, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Update active budget when selectedPeriod or allBudgets change
  useEffect(() => {
    if (!allBudgets || allBudgets.length === 0) {
      setBudgetTotal(0)
      return
    }

    // Specific budget for selected month
    const specificBudget = allBudgets.find(
      b => b.period === 'MONTHLY' && b.start_date && b.start_date.startsWith(selectedPeriod)
    )

    if (specificBudget) {
      setBudgetTotal(specificBudget.amount)
    } else {
      // Fallback baseline monthly budget
      const baseline = allBudgets.find(b => b.period === 'MONTHLY')
      setBudgetTotal(baseline ? baseline.amount : 0)
    }
  }, [selectedPeriod, allBudgets])

  // Filter expenses strictly for the selected month in user's timezone
  const currentMonthExpenses = useMemo(() => {
    return allExpenses.filter(e => getPeriodKey(e.rawDate, userTimeZone) === selectedPeriod)
  }, [allExpenses, selectedPeriod, userTimeZone])

  // Trend data: monthly aggregate for all historical data
  const monthlyData = useMemo(() => {
    if (allExpenses.length === 0) return []
    const monthsMap: Record<string, number> = {}
    const sorted = [...allExpenses].sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())

    sorted.forEach(e => {
      const periodKey = getPeriodKey(e.rawDate, userTimeZone)
      const [y, m] = periodKey.split('-').map(Number)
      const d = new Date(Date.UTC(y, m - 1, 15))
      const mName = d.toLocaleDateString('es-419', { timeZone: 'UTC', month: 'short' })
      const capitalized = mName.charAt(0).toUpperCase() + mName.slice(1).replace('.', '')
      monthsMap[capitalized] = (monthsMap[capitalized] || 0) + e.amount
    })
    return Object.entries(monthsMap).map(([mes, total]) => ({ mes, total }))
  }, [allExpenses, userTimeZone])

  // Category breakdown computed strictly for the active selected month
  const categoryData = useMemo(() => {
    if (currentMonthExpenses.length === 0) return []
    const catMap: Record<string, number> = {}
    currentMonthExpenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount
    })
    return Object.entries(catMap).map(([name, value]) => ({ name, value }))
  }, [currentMonthExpenses])

  // Key monthly metrics
  const totalSpent = useMemo(() => {
    return currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0)
  }, [currentMonthExpenses])

  const available = budgetTotal > 0 ? Math.max(0, budgetTotal - totalSpent) : 0

  const daysInMonth = useMemo(() => {
    const [y, m] = selectedPeriod.split('-').map(Number)
    if (!y || !m) return 30
    return new Date(y, m, 0).getDate() || 30
  }, [selectedPeriod])

  const avgDaily = Math.round(totalSpent / daysInMonth)
  const pct = budgetTotal > 0 ? Math.round((totalSpent / budgetTotal) * 100) : 0

  // 6-Month history computation
  const historyMonths = useMemo(() => {
    const last6 = getLastNMonths(6, new Date(), userTimeZone)
    return last6.map(m => {
      const mExpenses = allExpenses.filter(e => getPeriodKey(e.rawDate, userTimeZone) === m.key)
      const mSpent = mExpenses.reduce((acc, curr) => acc + curr.amount, 0)

      const specificBudget = allBudgets.find(
        b => b.period === 'MONTHLY' && b.start_date && b.start_date.startsWith(m.key)
      )
      const baseline = allBudgets.find(b => b.period === 'MONTHLY')
      const mBudget = specificBudget ? specificBudget.amount : (baseline ? baseline.amount : 0)
      const mRemaining = mBudget > 0 ? Math.max(0, mBudget - mSpent) : 0
      const mPct = mBudget > 0 ? Math.round((mSpent / mBudget) * 100) : 0

      return {
        ...m,
        spent: mSpent,
        budget: mBudget,
        remaining: mRemaining,
        pct: mPct,
        count: mExpenses.length,
      }
    })
  }, [allExpenses, allBudgets, userTimeZone])

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedPeriod.split('-').map(Number)
    let prevYear = y
    let prevMonth = m - 1
    if (prevMonth <= 0) {
      prevMonth = 12
      prevYear -= 1
    }
    setSelectedPeriod(`${prevYear}-${String(prevMonth).padStart(2, '0')}`)
  }

  const handleNextMonth = () => {
    const [y, m] = selectedPeriod.split('-').map(Number)
    let nextYear = y
    let nextMonth = m + 1
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }
    setSelectedPeriod(`${nextYear}-${String(nextMonth).padStart(2, '0')}`)
  }

  const handleOpenCreate = () => {
    setEditingExpense(null)
    setForm({
      amount: '',
      description: '',
      category: categories[0]?.id || 'Alimentación',
      paidBy: user?.id || '',
      note: '',
      date: new Date().toISOString().split('T')[0],
    })
    setDrawerOpen(true)
  }

  const handleEdit = (item: ExpenseDisplayItem) => {
    setEditingExpense(item)
    const matchedCat = categories.find(c => c.id === item.categoryId || c.name === item.category)
    const initialCat = matchedCat ? matchedCat.id : (item.categoryId || item.category || '')
    setForm({
      amount: item.amount.toString(),
      description: item.description,
      category: initialCat,
      paidBy: item.payerId || user?.id || '',
      note: '',
      date: item.rawDate ? item.rawDate.split('T')[0] : new Date().toISOString().split('T')[0],
    })
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setEditingExpense(null)
  }

  // Save expense (Create or Edit)
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHousehold || !user) return

    const numericAmount = Number(form.amount.replace(/\D/g, '')) || 0
    if (numericAmount <= 0) {
      toast('Ingresa un monto válido.')
      return
    }

    const payerId = form.paidBy || user.id
    const payerName = payerId === user.id ? 'Tú' : (members.find(m => m.user_id === payerId)?.name || 'Miembro')

    const selectedCat = categories.find(c => c.id === form.category || c.name === form.category)
    const resolvedCategoryId = selectedCat ? selectedCat.id : (form.category || null)
    const resolvedCategoryName = selectedCat ? selectedCat.name : (form.category || 'Varios')

    // Convert date input to full UTC ISO string to ensure accurate timezone projection
    const utcDate = toUTCISOString(form.date)

    if (editingExpense) {
      try {
        const updated = await updateExpense(editingExpense.id, {
          amount: numericAmount,
          description: form.description,
          category_id: resolvedCategoryId,
          payer_id: payerId,
          date: utcDate,
        })

        const updatedItem: ExpenseDisplayItem = {
          id: editingExpense.id,
          date: formatLocalDate(updated.date || utcDate, userTimeZone),
          rawDate: updated.date || utcDate,
          description: form.description,
          category: resolvedCategoryName,
          categoryId: resolvedCategoryId,
          paidBy: payerName,
          payerId: payerId,
          amount: numericAmount,
        }

        setAllExpenses(prev => prev.map(item => item.id === editingExpense.id ? updatedItem : item))
        handleCloseDrawer()
        toast('Gasto actualizado correctamente.')
        setForm({ amount: '', description: '', category: categories[0]?.id || 'Alimentación', paidBy: '', note: '', date: '' })
      } catch (err) {
        console.error('Failed to update expense:', err)
        toast('Error al actualizar gasto en la base de datos.')
      }
    } else {
      try {
        const created = await addExpense(currentHousehold.id, payerId, {
          amount: numericAmount,
          description: form.description,
          date: utcDate,
          category_id: resolvedCategoryId,
          receipt_url: null,
        })

        const newItem: ExpenseDisplayItem = {
          id: created.id,
          date: formatLocalDate(created.date || utcDate, userTimeZone),
          rawDate: created.date || utcDate,
          description: created.description,
          category: resolvedCategoryName,
          categoryId: resolvedCategoryId,
          paidBy: payerName,
          payerId: payerId,
          amount: created.amount,
        }

        setAllExpenses(prev => [newItem, ...prev])
        handleCloseDrawer()
        toast('Gasto registrado correctamente.')
        setForm({ amount: '', description: '', category: categories[0]?.id || 'Alimentación', paidBy: '', note: '', date: '' })
      } catch (err) {
        console.error('Failed to sync expense to backend:', err)
        toast('Error al registrar gasto en la base de datos.')
      }
    }
  }

  // Delete expense
  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id)
      setAllExpenses(prev => prev.filter(e => e.id !== id))
      toast('Gasto eliminado.')
    } catch (err) {
      console.error('Failed to delete expense:', err)
      toast('Error al eliminar gasto.')
    }
  }

  // Update monthly budget
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHousehold) return

    const amount = Number(newBudgetAmount.replace(/\D/g, ''))
    if (isNaN(amount) || amount <= 0) {
      toast('Ingresa un monto de presupuesto válido.')
      return
    }

    const [y, m] = selectedPeriod.split('-').map(Number)
    setSavingBudget(true)

    try {
      const updated = await setMonthlyBudget(currentHousehold.id, amount, y, m)
      setAllBudgets(prev => {
        const filtered = prev.filter(b => b.id !== updated.id)
        return [...filtered, updated]
      })
      setBudgetTotal(amount)
      setBudgetModalOpen(false)
      toast(`Presupuesto para ${formatPeriodLabel(selectedPeriod)} actualizado: $${amount.toLocaleString('es-EC')}`)
    } catch (err) {
      console.error('Error updating budget:', err)
      toast('Error al guardar presupuesto mensual.')
    } finally {
      setSavingBudget(false)
    }
  }

  // Download PDF Report
  const handleDownloadPDF = async () => {
    if (!currentHousehold) return
    setIsGeneratingPDF(true)

    try {
      const breakdown = categoryData.map(c => ({
        name: c.name,
        amount: c.value,
        percentage: totalSpent > 0 ? Math.round((c.value / totalSpent) * 100) : 0,
      }))

      await generateMonthlyExpensePDF({
        householdName: currentHousehold.name,
        periodLabel: formatPeriodLabel(selectedPeriod),
        periodKey: selectedPeriod,
        allocatedBudget: budgetTotal,
        totalSpent,
        remainingBudget: available,
        usedPercentage: pct,
        expenseCount: currentMonthExpenses.length,
        generatedAt: formatLocalDate(new Date(), userTimeZone, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        } as any),
        timeZone: userTimeZone,
        categoryBreakdown: breakdown,
        expenses: currentMonthExpenses.map(e => ({
          date: e.date,
          category: e.category,
          description: e.description,
          paidBy: e.paidBy,
          amount: e.amount,
        })),
      })

      toast(`Reporte PDF de ${formatPeriodLabel(selectedPeriod)} descargado.`)
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      toast('Error al generar el reporte en PDF.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const selectedPeriodLabel = formatPeriodLabel(selectedPeriod)
  const isCurrentMonth = selectedPeriod === currentPeriodKey

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="mb-8 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">
          Finanzas del Hogar
        </p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-[38px] lg:text-[52px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">
              GASTOS Y<br />PRESUPUESTOS
            </h1>
            <p className="text-[14px] text-muted dark:text-dark-muted mt-3">
              Períodos mensuales independientes en hora local ({userTimeZone}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] font-medium text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface hover:bg-bg dark:hover:bg-dark-bg transition-colors disabled:opacity-50"
              title="Descargar reporte en formato PDF"
            >
              <Download size={14} className={isGeneratingPDF ? 'animate-bounce text-olive' : 'text-muted'} />
              <span>{isGeneratingPDF ? 'Generando PDF...' : 'Reporte PDF'}</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity"
            >
              <Plus size={14} /> Nuevo gasto
            </button>
          </div>
        </div>
      </div>

      {/* Month Navigator Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-8 bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[6px]">
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-line dark:border-dark-line rounded-[4px] overflow-hidden bg-bg dark:bg-dark-bg">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-surface dark:hover:bg-dark-surface text-ink dark:text-dark-ink transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-4 py-1.5 flex items-center gap-2 text-[14px] font-semibold text-ink dark:text-dark-ink min-w-[170px] justify-center">
              <Calendar size={15} className="text-olive" />
              <span>{selectedPeriodLabel}</span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-surface dark:hover:bg-dark-surface text-ink dark:text-dark-ink transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              onClick={() => setSelectedPeriod(currentPeriodKey)}
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-olive dark:text-dark-olive bg-olive/10 rounded-[4px] hover:bg-olive/20 transition-colors"
            >
              <RotateCcw size={13} /> Volver a mes actual
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setNewBudgetAmount(budgetTotal > 0 ? String(budgetTotal) : '')
              setBudgetModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-ink dark:text-dark-ink border border-line dark:border-dark-line rounded-[4px] hover:bg-bg dark:hover:bg-dark-bg transition-colors"
          >
            <Edit3 size={13} className="text-muted" />
            <span>Editar presupuesto de este mes</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <div className="w-6 h-6 border-2 border-olive border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Key metrics for the selected month */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line dark:bg-dark-line rounded-[4px] overflow-hidden mb-8">
            {[
              {
                label: `Presupuesto (${selectedPeriodLabel})`,
                value: budgetTotal > 0 ? `$ ${budgetTotal.toLocaleString('es-EC')}` : 'Sin límite',
                sub: budgetTotal > 0 ? 'Asignado a este mes' : 'Configura un presupuesto',
              },
              {
                label: 'Gastado en el período',
                value: `$ ${totalSpent.toLocaleString('es-EC')}`,
                sub: `${currentMonthExpenses.length} transacciones`,
              },
              {
                label: 'Presupuesto disponible',
                value: budgetTotal > 0 ? `$ ${available.toLocaleString('es-EC')}` : '—',
                sub: budgetTotal > 0 ? (available === 0 ? 'Presupuesto agotado' : 'Restante') : 'Ilimitado',
              },
              {
                label: 'Promedio diario estimado',
                value: `$ ${avgDaily.toLocaleString('es-EC')}`,
                sub: `Calculado sobre ${daysInMonth} días`,
              },
            ].map(m => (
              <div key={m.label} className="bg-surface dark:bg-dark-surface px-6 py-5">
                <div className="text-[11px] text-muted dark:text-dark-muted mb-1.5">{m.label}</div>
                <div className="font-mono text-[24px] font-light text-ink dark:text-dark-ink">{m.value}</div>
                <div className="text-[11px] text-muted dark:text-dark-muted mt-1">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Budget progress bar */}
          {budgetTotal > 0 && (
            <div className="border border-line dark:border-dark-line rounded-[4px] p-6 mb-8 bg-surface dark:bg-dark-surface">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-semibold text-ink dark:text-dark-ink">
                  Consumo de {selectedPeriodLabel}
                </span>
                <span className={`font-mono text-[12px] font-semibold ${pct > 100 ? 'text-red-500' : 'text-muted dark:text-dark-muted'}`}>
                  {pct}% utilizado {pct > 100 && '(Excedido)'}
                </span>
              </div>
              <div className="h-2.5 bg-line dark:bg-dark-line rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct > 100
                      ? 'bg-red-500'
                      : pct > 80
                      ? 'bg-amber-500'
                      : 'bg-olive dark:bg-dark-olive'
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-muted dark:text-dark-muted">
                <span>$ 0</span>
                <span>Gastado: $ {totalSpent.toLocaleString('es-EC')}</span>
                <span>Límite: $ {budgetTotal.toLocaleString('es-EC')}</span>
              </div>
            </div>
          )}

          {/* Section: Historial de los últimos 6 meses */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-ink dark:text-dark-ink">
                  Historial de los últimos 6 meses
                </h3>
                <p className="text-[12px] text-muted dark:text-dark-muted mt-0.5">
                  Haz clic en cualquier mes para consultar su detalle y transacciones completas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {historyMonths.map(m => {
                const isSelected = m.key === selectedPeriod
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setSelectedPeriod(m.key)}
                    className={`text-left p-4 rounded-[6px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-ink dark:border-dark-ink bg-bg dark:bg-dark-bg ring-1 ring-ink dark:ring-dark-ink shadow-sm'
                        : 'border-line dark:border-dark-line bg-surface dark:bg-dark-surface hover:border-olive/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-bold text-ink dark:text-dark-ink">{m.shortLabel}</span>
                      {isSelected && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded">
                          Activo
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between text-muted dark:text-dark-muted">
                        <span>Gastado:</span>
                        <span className="font-mono font-medium text-ink dark:text-dark-ink">$ {m.spent.toLocaleString('es-EC')}</span>
                      </div>
                      <div className="flex justify-between text-muted dark:text-dark-muted">
                        <span>Presupuesto:</span>
                        <span className="font-mono">{m.budget > 0 ? `$ ${m.budget.toLocaleString('es-EC')}` : '—'}</span>
                      </div>
                      <div className="flex justify-between text-muted dark:text-dark-muted">
                        <span>Restante:</span>
                        <span className={`font-mono ${m.remaining <= 0 && m.budget > 0 ? 'text-red-500 font-medium' : ''}`}>
                          {m.budget > 0 ? `$ ${m.remaining.toLocaleString('es-EC')}` : '—'}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-line/60 dark:border-dark-line/60 flex justify-between items-center text-[10px] text-muted">
                        <span>{m.count} {m.count === 1 ? 'gasto' : 'gastos'}</span>
                        <span className={`font-mono font-semibold ${m.pct > 100 ? 'text-red-500' : 'text-olive'}`}>
                          {m.pct}%
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Charts section */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-8 mb-10">
            {/* Trend chart */}
            <div className="border border-line dark:border-dark-line rounded-[4px] p-5 bg-surface dark:bg-dark-surface">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[13px] font-semibold tracking-[0.05em] text-ink dark:text-dark-ink">
                    Tendencia histórica general
                  </h3>
                  <p className="text-[11px] text-muted dark:text-dark-muted mt-0.5">Evolución mensual consolidada</p>
                </div>
                <TrendingUp size={14} className="text-muted dark:text-dark-muted" />
              </div>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9D9652" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#9D9652" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#77766E' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-surface, #fff)', border: '1px solid #D9D8D0', borderRadius: '4px', fontSize: '12px' }}
                      formatter={(v: unknown) => { const n = Number(v ?? 0); return [`$ ${n.toLocaleString('es-EC')}`, 'Total'] as [string, string]}}
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

            {/* Category breakdown for the active month */}
            <div className="border border-line dark:border-dark-line rounded-[4px] p-5 bg-surface dark:bg-dark-surface">
              <h3 className="text-[13px] font-semibold tracking-[0.05em] text-ink dark:text-dark-ink mb-1">
                Por categoría
              </h3>
              <p className="text-[11px] text-muted dark:text-dark-muted mb-4">{selectedPeriodLabel}</p>
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={categoryData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#77766E' }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: 'var(--color-surface, #fff)', border: '1px solid #D9D8D0', borderRadius: '4px', fontSize: '11px' }}
                        formatter={(v: unknown) => { const n = Number(v ?? 0); return [`$ ${n.toLocaleString('es-EC')}`, ''] as [string, string]}}
                      />
                      <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                        {categoryData.map((_, i) => <Cell key={i} fill={catColors[i % catColors.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1 max-h-[140px] overflow-y-auto">
                    {categoryData.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: catColors[i % catColors.length] }} />
                          <span className="text-muted dark:text-dark-muted">{c.name}</span>
                        </div>
                        <span className="font-mono text-ink dark:text-dark-ink">$ {c.value.toLocaleString('es-EC')}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-center">
                  <p className="text-[13px] text-muted dark:text-dark-muted">Sin gastos en {selectedPeriodLabel}.</p>
                </div>
              )}
            </div>
          </div>

          {/* Itemized Expense Table for the selected month */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-ink dark:text-dark-ink">
                  Gastos de {selectedPeriodLabel}
                </h3>
                <p className="text-[12px] text-muted dark:text-dark-muted mt-0.5">
                  Listado exclusivo del período seleccionado ({currentMonthExpenses.length} registrados).
                </p>
              </div>
            </div>

            <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden bg-surface dark:bg-dark-surface">
              {currentMonthExpenses.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-[15px] font-medium text-ink dark:text-dark-ink mb-1">
                    No hay gastos en {selectedPeriodLabel}.
                  </p>
                  <p className="text-[13px] text-muted dark:text-dark-muted max-w-md mx-auto">
                    El total de este período inicia en <strong>$ 0</strong>. Puedes registrar nuevos gastos con el botón superior.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                      <tr className="border-b border-line dark:border-dark-line bg-bg dark:bg-dark-bg text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
                        <th className="py-3 px-5 w-32 font-mono text-[12px]">Fecha</th>
                        <th className="py-3 px-5 font-medium text-ink dark:text-dark-ink">Descripción</th>
                        <th className="py-3 px-5 w-36">Categoría</th>
                        <th className="py-3 px-5 w-36">Pagado por</th>
                        <th className="py-3 px-5 w-28 text-right font-mono font-medium">Monto</th>
                        <th className="py-3 px-5 w-20 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line dark:divide-dark-line">
                      {currentMonthExpenses.map(exp => (
                        <tr
                          key={exp.id}
                          className="hover:bg-bg dark:hover:bg-dark-bg transition-colors group"
                        >
                          <td className="py-3.5 px-5 w-32 font-mono text-[12px] text-muted dark:text-dark-muted whitespace-nowrap">
                            {exp.date}
                          </td>
                          <td className="py-3.5 px-5 font-medium text-[13px] text-ink dark:text-dark-ink">
                            {exp.description}
                          </td>
                          <td className="py-3.5 px-5 w-36 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-line/60 dark:bg-dark-line/60 text-ink dark:text-dark-ink">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 w-36 text-[12px] text-muted dark:text-dark-muted whitespace-nowrap">
                            {exp.paidBy}
                          </td>
                          <td className="py-3.5 px-5 w-28 text-right font-mono text-[14px] font-medium text-ink dark:text-dark-ink whitespace-nowrap">
                            $ {exp.amount.toLocaleString('es-EC')}
                          </td>
                          <td className="py-3.5 px-5 w-20 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(exp)}
                                className="p-1 text-muted hover:text-ink dark:hover:text-dark-ink transition-colors cursor-pointer"
                                title="Editar gasto"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(exp.id)}
                                className="p-1 text-muted hover:text-terracotta dark:hover:text-dark-terracotta transition-colors cursor-pointer"
                                title="Eliminar gasto"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Drawer: Add / Edit Expense */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink/20 dark:bg-black/40" onClick={handleCloseDrawer} />
          <div className="relative w-full max-w-md h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink">
                {editingExpense ? 'Editar gasto' : 'Registrar gasto'}
              </h3>
              <button onClick={handleCloseDrawer} className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink"><X size={18} /></button>
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
                      {categories.length > 0 ? (
                        <>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                          {form.category && !categories.some(c => c.id === form.category) && (
                            <option value={form.category}>{form.category}</option>
                          )}
                        </>
                      ) : (
                        defaultCategories.map(c => <option key={c} value={c}>{c}</option>)
                      )}
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
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Fecha del gasto (Hora local)
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
                  />
                  <p className="text-[11px] text-muted dark:text-dark-muted mt-1">
                    Se almacena con precisión UTC y se asigna al mes comercial correspondiente.
                  </p>
                </div>
              </div>
              <div className="px-6 py-5 border-t border-line dark:border-dark-line flex gap-3">
                <button type="button" onClick={handleCloseDrawer} className="flex-1 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted hover:text-ink transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity">
                  {editingExpense ? 'Guardar cambios' : 'Guardar gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Monthly Budget */}
      {budgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/30 dark:bg-black/50" onClick={() => setBudgetModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[6px] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-ink dark:text-dark-ink">
                Presupuesto de {selectedPeriodLabel}
              </h3>
              <button onClick={() => setBudgetModalOpen(false)} className="text-muted hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                  Monto mensual asignado
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-[14px] font-mono">$</span>
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={newBudgetAmount}
                    onChange={e => setNewBudgetAmount(e.target.value)}
                    placeholder="350000"
                    className="w-full pl-8 pr-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[18px] font-mono text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
                  />
                </div>
                <p className="text-[11px] text-muted dark:text-dark-muted mt-1.5">
                  Este límite aplicará exclusivamente al mes de {selectedPeriodLabel}.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBudgetModalOpen(false)}
                  className="flex-1 py-2 text-[13px] border border-line dark:border-dark-line rounded-[4px] text-muted hover:text-ink transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingBudget}
                  className="flex-1 py-2 text-[13px] bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {savingBudget ? 'Guardando...' : 'Asignar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
