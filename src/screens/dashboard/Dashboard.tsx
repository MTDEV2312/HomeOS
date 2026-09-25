'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from '@/lib/navigation'
import { CheckSquare, AlertTriangle, ShoppingCart, DollarSign, Plus, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useHousehold } from '@/lib/household-context'
import { getTasks, updateTaskStatus, Task } from '@/services/taskService'
import { getExpenses, getBudgets, Expense } from '@/services/expenseService'

const priorities: Record<string, string> = {
  Urgente: 'bg-terracotta-bg dark:bg-dark-surface text-terracotta dark:text-dark-terracotta',
  URGENT: 'bg-terracotta-bg dark:bg-dark-surface text-terracotta dark:text-dark-terracotta',
  Alta: 'bg-sand-bg dark:bg-dark-surface text-ink dark:text-dark-ink',
  HIGH: 'bg-sand-bg dark:bg-dark-surface text-ink dark:text-dark-ink',
  Media: 'bg-softblue-bg dark:bg-dark-surface text-ink dark:text-dark-ink',
  MEDIUM: 'bg-softblue-bg dark:bg-dark-surface text-ink dark:text-dark-ink',
  Baja: 'bg-sage-soft dark:bg-dark-surface text-muted dark:text-dark-muted',
  LOW: 'bg-sage-soft dark:bg-dark-surface text-muted dark:text-dark-muted',
}

export default function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { activeHousehold } = useHousehold()

  const [tasksList, setTasksList] = useState<Task[]>([])
  const [expensesList, setExpensesList] = useState<Expense[]>([])
  const [budgetSpent, setBudgetSpent] = useState<number>(0)
  const [budgetTotal, setBudgetTotal] = useState<number>(0)
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const householdId = activeHousehold?.id

  const loadData = useCallback(async () => {
    if (!householdId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [fetchedTasks, fetchedExpenses, fetchedBudgets] = await Promise.all([
        getTasks(householdId).catch(() => []),
        getExpenses(householdId).catch(() => []),
        getBudgets(householdId).catch(() => []),
      ])

      setTasksList(fetchedTasks || [])
      setExpensesList(fetchedExpenses || [])

      if (fetchedBudgets && fetchedBudgets.length > 0) {
        const total = fetchedBudgets.reduce((acc, b) => acc + (b.amount || 0), 0)
        setBudgetTotal(total)
      } else {
        setBudgetTotal(0)
      }

      if (fetchedExpenses && fetchedExpenses.length > 0) {
        const spent = fetchedExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
        setBudgetSpent(spent)
      } else {
        setBudgetSpent(0)
      }
    } catch (err) {
      console.error('Error loading dashboard data', err)
    } finally {
      setLoading(false)
    }
  }, [householdId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const effectiveTasks = tasksList.map(t => ({
    id: t.id,
    title: t.title,
    done: t.status === 'COMPLETED' || checkedTasks.has(t.id),
    priority: t.priority === 'URGENT' ? 'Urgente' : t.priority === 'HIGH' ? 'Alta' : t.priority === 'LOW' ? 'Baja' : 'Media',
    dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : 'Sin fecha',
    assignee: t.assignee?.name || 'Miembro',
  }))

  const todayTasks = effectiveTasks.filter(t => !t.done).slice(0, 5)

  const effectiveExpenses = expensesList.map(e => ({
    id: e.id,
    date: new Date(e.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
    description: e.description,
    category: e.category?.name || 'General',
    paidBy: 'Hogar',
    amount: e.amount,
  }))

  const pct = budgetTotal > 0 ? Math.min(100, Math.round((budgetSpent / budgetTotal) * 100)) : 0
  const availableBudget = Math.max(0, budgetTotal - budgetSpent)

  const toggle = async (id: string) => {
    const isChecked = checkedTasks.has(id)
    setCheckedTasks(prev => {
      const next = new Set(prev)
      if (isChecked) next.delete(id)
      else next.add(id)
      return next
    })

    if (tasksList.some(t => t.id === id)) {
      try {
        await updateTaskStatus(id, isChecked ? 'PENDING' : 'COMPLETED')
      } catch (err) {
        console.error('Error toggling task', err)
      }
    }
  }

  // Derive dynamic activity from real expenses and tasks
  const activities = [
    ...expensesList.slice(0, 3).map(e => ({
      id: `exp-${e.id}`,
      text: `Gasto registrado: ${e.description} ($${e.amount.toLocaleString('es-AR')})`,
      time: new Date(e.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      icon: '💰',
    })),
    ...tasksList.slice(0, 3).map(t => ({
      id: `task-${t.id}`,
      text: `Tarea: ${t.title} (${t.status === 'COMPLETED' ? 'Completada' : 'Pendiente'})`,
      time: t.due_date ? new Date(t.due_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : 'Reciente',
      icon: '📋',
    })),
  ].slice(0, 4)

  const userName = (user?.profile?.name as string) || user?.email?.split('@')[0] || 'Usuario'
  const householdName = (activeHousehold?.name || 'MI HOGAR').toUpperCase()
  const todayFormatted = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1)

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto font-sans">
      {/* Hero header */}
      <div className="mb-12 grid lg:grid-cols-[1fr_auto] gap-8 items-end border-b border-line dark:border-dark-line pb-10">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted dark:text-dark-muted mb-3">
            {capitalizedDate}
          </p>
          <h1 className="text-[48px] lg:text-[64px] font-light leading-[0.95] tracking-[-0.03em] text-ink dark:text-dark-ink">
            BUENOS<br />
            <strong className="font-semibold">DÍAS.</strong>
          </h1>
          <p className="text-[15px] text-muted dark:text-dark-muted mt-4">
            Tu hogar está en orden, {userName}.
          </p>
        </div>
        <div className="text-right hidden lg:block">
          <div className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted dark:text-dark-muted mb-1">
            {householdName}
          </div>
          <div className="text-[13px] text-muted dark:text-dark-muted">Espacio familiar activo</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line dark:bg-dark-line rounded-[4px] overflow-hidden mb-12 border border-line dark:border-dark-line">
        {[
          { label: 'Tareas pendientes', value: tasksList.filter(t => t.status !== 'COMPLETED').length, icon: CheckSquare, color: 'text-softblue dark:text-dark-softblue', to: '/dashboard/tasks' },
          { label: 'Gastos registrados', value: expensesList.length, icon: AlertTriangle, color: 'text-terracotta dark:text-dark-terracotta', to: '/dashboard/expenses' },
          { label: 'Presupuesto total', value: budgetTotal > 0 ? `$ ${budgetTotal.toLocaleString('es-AR')}` : 'Sin definir', icon: ShoppingCart, color: 'text-sand dark:text-dark-sand', to: '/dashboard/expenses' },
          { label: 'Gastado este mes', value: `$ ${budgetSpent.toLocaleString('es-AR')}`, icon: DollarSign, color: 'text-olive dark:text-dark-olive', to: '/dashboard/expenses' },
        ].map(m => (
          <button
            key={m.label}
            onClick={() => router.push(m.to)}
            className="bg-surface dark:bg-dark-surface p-6 text-left hover:bg-olive-soft dark:hover:bg-dark-olive-soft transition-colors group cursor-pointer"
          >
            <m.icon size={16} className={`${m.color} mb-3`} />
            <div className="text-[32px] font-light tracking-[-0.02em] font-mono text-ink dark:text-dark-ink">{m.value}</div>
            <div className="text-[11px] text-muted dark:text-dark-muted mt-1">{m.label}</div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        {/* Left column */}
        <div className="space-y-8">
          {/* Tareas de hoy */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-ink dark:text-dark-ink">Tareas de hoy</h2>
              <button
                onClick={() => router.push('/dashboard/tasks')}
                className="text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink flex items-center gap-1 cursor-pointer"
              >
                Ver todas <ArrowRight size={11} />
              </button>
            </div>
            <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden bg-surface dark:bg-dark-surface">
              {loading ? (
                <div className="py-8 flex items-center justify-center text-muted dark:text-dark-muted gap-2 text-[13px]">
                  <Loader2 size={16} className="animate-spin text-olive" /> Cargando tareas...
                </div>
              ) : todayTasks.length > 0 ? (
                todayTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-4 px-4 py-3.5 hover:bg-bg dark:hover:bg-dark-bg transition-colors ${i > 0 ? 'border-t border-line dark:border-dark-line' : ''}`}
                  >
                    <button
                      onClick={() => toggle(task.id)}
                      className={`w-4 h-4 rounded-[2px] border shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                        checkedTasks.has(task.id)
                          ? 'bg-olive dark:bg-dark-olive border-olive dark:border-dark-olive'
                          : 'border-line dark:border-dark-line hover:border-olive dark:hover:border-dark-olive'
                      }`}
                    >
                      {checkedTasks.has(task.id) && <span className="text-white text-[10px] leading-none">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] font-medium text-ink dark:text-dark-ink truncate ${checkedTasks.has(task.id) ? 'line-through opacity-40' : ''}`}>
                        {task.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-muted dark:text-dark-muted">{task.assignee}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priorities[task.priority] || priorities.Media}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-[13px] text-muted dark:text-dark-muted">
                  Todo tranquilo por aquí. No hay tareas pendientes. 🌿
                </div>
              )}
            </div>
          </div>

          {/* Gastos recientes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-ink dark:text-dark-ink">Gastos recientes</h2>
              <button
                onClick={() => router.push('/dashboard/expenses')}
                className="text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink flex items-center gap-1 cursor-pointer"
              >
                Ver todos <ArrowRight size={11} />
              </button>
            </div>
            <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden bg-surface dark:bg-dark-surface">
              {loading ? (
                <div className="py-8 flex items-center justify-center text-muted dark:text-dark-muted gap-2 text-[13px]">
                  <Loader2 size={16} className="animate-spin text-olive" /> Cargando gastos...
                </div>
              ) : effectiveExpenses.length > 0 ? (
                effectiveExpenses.slice(0, 4).map((exp, i) => (
                  <div
                    key={exp.id}
                    className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-line dark:border-dark-line' : ''} hover:bg-bg dark:hover:bg-dark-bg transition-colors`}
                  >
                    <div>
                      <div className="text-[13px] font-medium text-ink dark:text-dark-ink">{exp.description}</div>
                      <div className="text-[11px] text-muted dark:text-dark-muted mt-0.5">{exp.date} · {exp.category}</div>
                    </div>
                    <span className="font-mono text-[13px] font-medium text-ink dark:text-dark-ink">
                      $ {exp.amount.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-[13px] text-muted dark:text-dark-muted">
                  No hay gastos registrados este mes.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Presupuesto */}
          <div className="border border-line dark:border-dark-line rounded-[4px] p-5 bg-surface dark:bg-dark-surface">
            <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted dark:text-dark-muted mb-4">
              Presupuesto mensual
            </h3>
            <div className="flex justify-between mb-2">
              <span className="text-[12px] text-muted dark:text-dark-muted">Gastado</span>
              <span className="font-mono text-[13px] text-ink dark:text-dark-ink">$ {budgetSpent.toLocaleString('es-AR')}</span>
            </div>
            <div className="h-1.5 bg-line dark:bg-dark-line rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-olive dark:bg-dark-olive rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted dark:text-dark-muted">{budgetTotal > 0 ? `${pct}% usado` : 'Sin presupuesto'}</span>
              <span className="font-mono text-muted dark:text-dark-muted">
                {budgetTotal > 0 ? `$ ${availableBudget.toLocaleString('es-AR')} disponible` : 'Definir en Gastos'}
              </span>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted dark:text-dark-muted mb-3">Acciones rápidas</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Nueva tarea', to: '/dashboard/tasks', icon: CheckSquare },
                { label: 'Nueva lista', to: '/dashboard/shopping', icon: ShoppingCart },
                { label: 'Registrar gasto', to: '/dashboard/expenses', icon: DollarSign },
                { label: 'Subir documento', to: '/dashboard/documents', icon: Plus },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={() => router.push(a.to)}
                  className="flex flex-col items-start gap-2 p-3.5 border border-line dark:border-dark-line rounded-[4px] hover:border-olive dark:hover:border-dark-olive hover:bg-olive-soft dark:hover:bg-dark-olive-soft transition-colors text-left bg-surface dark:bg-dark-surface cursor-pointer"
                >
                  <a.icon size={14} className="text-muted dark:text-dark-muted" />
                  <span className="text-[12px] font-medium text-ink dark:text-dark-ink">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actividad reciente */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted dark:text-dark-muted mb-3">Actividad reciente</h3>
            <div className="space-y-0 border border-line dark:border-dark-line rounded-[4px] overflow-hidden bg-surface dark:bg-dark-surface">
              {activities.length > 0 ? (
                activities.map((a, i) => (
                  <div key={a.id} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-line dark:border-dark-line' : ''}`}>
                    <div className="w-6 h-6 rounded-full bg-sage-soft dark:bg-dark-surface-2 text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-ink dark:text-dark-ink leading-snug">{a.text}</p>
                      <p className="text-[11px] text-muted dark:text-dark-muted mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-[12px] text-muted dark:text-dark-muted">
                  No hay actividad reciente registrada en este hogar.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
