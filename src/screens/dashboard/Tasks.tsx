'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, RotateCcw, X, Calendar, User, ChevronDown, Loader2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/lib/auth-context'
import { useHousehold } from '@/lib/household-context'
import { getTasks, createTask, updateTaskStatus, deleteTask as apiDeleteTask, Task as ApiTask, TaskPriority } from '@/services/taskService'
import { Switch } from '@/components/ui/Switch'

interface DisplayTask {
  id: string
  title: string
  done: boolean
  priority: string
  dueDate: string
  assignee: string
  recurring: boolean
  freq?: string
  description?: string
}

type View = 'todas' | 'hoy' | 'proximas' | 'completadas'

const priorityStyle: Record<string, string> = {
  Urgente: 'bg-terracotta-bg text-terracotta dark:bg-dark-surface dark:text-dark-terracotta',
  Alta: 'bg-sand-bg text-ink dark:bg-dark-surface dark:text-dark-ink',
  Media: 'bg-softblue-bg text-ink dark:bg-dark-surface dark:text-dark-ink',
  Baja: 'bg-sage-soft text-muted dark:bg-dark-surface dark:text-dark-muted',
}

export default function Tasks() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { activeHousehold } = useHousehold()

  const [taskList, setTaskList] = useState<DisplayTask[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('todas')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Media',
    assignee: '',
    recurring: false,
    freq: 'Semanal',
  })

  const householdId = activeHousehold?.id

  const loadTasks = useCallback(async () => {
    if (!householdId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getTasks(householdId)
      const mapped: DisplayTask[] = (data || []).map((t: ApiTask) => ({
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        done: t.status === 'COMPLETED',
        priority: t.priority === 'URGENT' ? 'Urgente' : t.priority === 'HIGH' ? 'Alta' : t.priority === 'LOW' ? 'Baja' : 'Media',
        dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : 'Sin fecha',
        assignee: t.assignee?.name || 'Miembro',
        recurring: t.is_recurring,
        freq: t.recurrence_rule || 'Semanal',
      }))
      setTaskList(mapped)
    } catch (err) {
      console.error('Error fetching tasks', err)
    } finally {
      setLoading(false)
    }
  }, [householdId])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const toggle = async (id: string) => {
    const task = taskList.find(t => t.id === id)
    if (!task) return

    const newDone = !task.done
    setTaskList(prev => prev.map(t =>
      t.id === id ? { ...t, done: newDone } : t
    ))

    if (newDone) toast(`"${task.title}" completada.`, 'success')

    try {
      await updateTaskStatus(id, newDone ? 'COMPLETED' : 'PENDING')
    } catch {
      // Local state already updated
    }
  }

  const filtered = taskList.filter(t => {
    if (view === 'hoy') return t.dueDate === 'Hoy' && !t.done
    if (view === 'proximas') return t.dueDate !== 'Hoy' && !t.done
    if (view === 'completadas') return t.done
    return true
  })

  const openDrawer = () => {
    setForm({ title: '', description: '', dueDate: '', priority: 'Media', assignee: user?.profile?.name || '', recurring: false, freq: 'Semanal' })
    setDrawerOpen(true)
  }

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const priorityMap: Record<string, TaskPriority> = {
      Urgente: 'URGENT',
      Alta: 'HIGH',
      Media: 'MEDIUM',
      Baja: 'LOW',
    }

    const tempId = Date.now().toString()
    const newTask: DisplayTask = {
      id: tempId,
      title: form.title,
      description: form.description || undefined,
      done: false,
      priority: form.priority,
      dueDate: form.dueDate || 'Hoy',
      assignee: form.assignee || (user?.profile?.name as string) || user?.email?.split('@')[0] || 'Miembro',
      recurring: form.recurring,
      freq: form.freq,
    }

    setTaskList(prev => [newTask, ...prev])
    setDrawerOpen(false)
    toast('Tarea guardada.', 'success')

    if (activeHousehold?.id && user?.id) {
      try {
        const created = await createTask(activeHousehold.id, user.id, {
          title: form.title,
          description: form.description || undefined,
          priority: priorityMap[form.priority] || 'MEDIUM',
          due_date: form.dueDate || undefined,
          is_recurring: form.recurring,
          recurrence_rule: form.recurring ? form.freq : undefined,
        })
        setTaskList(prev => prev.map(t => t.id === tempId ? { ...t, id: created.id } : t))
      } catch (err) {
        console.error('Error creating task in DB', err)
      }
    }
  }

  const deleteTask = async (id: string) => {
    setTaskList(prev => prev.filter(t => t.id !== id))
    toast('Tarea eliminada.', 'info')

    try {
      await apiDeleteTask(id)
    } catch {
      // Local state updated
    }
  }

  const views: { key: View; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'hoy', label: 'Hoy' },
    { key: 'proximas', label: 'Próximas' },
    { key: 'completadas', label: 'Completadas' },
  ]

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto font-sans">
      {/* Header */}
      <div className="mb-10 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">Hogar</p>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[42px] lg:text-[56px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">
              TAREAS
            </h1>
            <p className="text-[14px] text-muted dark:text-dark-muted mt-3 max-w-md">
              Organizá lo que mantiene en marcha tu hogar.
            </p>
          </div>
          <button
            onClick={openDrawer}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Plus size={14} /> Nueva tarea
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-8 text-[13px]">
        <span className="font-mono text-[22px] font-light text-ink dark:text-dark-ink">{taskList.filter(t => !t.done).length}</span>
        <span className="text-muted dark:text-dark-muted">pendientes</span>
        <span className="text-line dark:text-dark-line">·</span>
        <span className="font-mono text-[22px] font-light text-olive dark:text-dark-olive">{taskList.filter(t => t.done).length}</span>
        <span className="text-muted dark:text-dark-muted">completadas</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-bg dark:bg-dark-bg rounded-[4px] p-1 w-fit border border-line dark:border-dark-line">
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-[3px] transition-colors cursor-pointer ${
              view === v.key
                ? 'bg-surface dark:bg-dark-surface text-ink dark:text-dark-ink shadow-xs'
                : 'text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden bg-surface dark:bg-dark-surface">
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-muted dark:text-dark-muted text-[13px]">
            <Loader2 size={18} className="animate-spin text-olive" /> Cargando tareas...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[15px] text-ink dark:text-dark-ink mb-1">Todo tranquilo por aquí.</p>
            <p className="text-[13px] text-muted dark:text-dark-muted">No hay tareas en esta vista.</p>
          </div>
        ) : (
          filtered.map((task, i) => (
            <div
              key={task.id}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-bg dark:hover:bg-dark-bg transition-colors group ${
                i > 0 ? 'border-t border-line dark:border-dark-line' : ''
              }`}
            >
              <button
                onClick={() => toggle(task.id)}
                className={`w-4 h-4 rounded-[2px] border shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                  task.done
                    ? 'bg-olive dark:bg-dark-olive border-olive dark:border-dark-olive'
                    : 'border-line dark:border-dark-line hover:border-olive dark:hover:border-dark-olive'
                }`}
              >
                {task.done && <span className="text-white text-[9px] leading-none">✓</span>}
              </button>

              <div className="flex-1 min-w-0">
                <div className={`text-[14px] font-medium text-ink dark:text-dark-ink truncate transition-all ${task.done ? 'line-through opacity-40' : ''}`}>
                  {task.title}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {task.dueDate && (
                    <span className="text-[11px] text-muted dark:text-dark-muted flex items-center gap-1">
                      <Calendar size={10} /> {task.dueDate}
                    </span>
                  )}
                  {task.assignee && (
                    <span className="text-[11px] text-muted dark:text-dark-muted flex items-center gap-1">
                      <User size={10} /> {task.assignee}
                    </span>
                  )}
                  {task.recurring && (
                    <span className="text-[11px] text-muted dark:text-dark-muted flex items-center gap-1">
                      <RotateCcw size={10} /> {task.freq}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priorityStyle[task.priority] || priorityStyle.Media}`}>
                  {task.priority}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted dark:text-dark-muted hover:text-terracotta dark:hover:text-dark-terracotta transition-all p-1 cursor-pointer"
                  title="Eliminar tarea"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink/20 dark:bg-black/50 backdrop-blur-xs" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink">Nueva tarea</h3>
              <button onClick={() => setDrawerOpen(false)} className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveTask} className="flex-1 flex flex-col">
              <div className="flex-1 px-6 py-6 space-y-5">
                {[
                  { label: 'Título', key: 'title', type: 'text', required: true, placeholder: 'Limpiar filtro de la campana…' },
                  { label: 'Descripción', key: 'description', type: 'textarea', placeholder: 'Detalles adicionales…' },
                  { label: 'Fecha límite', key: 'dueDate', type: 'date' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea
                        value={form[f.key as keyof typeof form] as string}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        rows={3}
                        className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive resize-none"
                      />
                    ) : (
                      <input
                        type={f.type}
                        required={f.required}
                        value={form[f.key as keyof typeof form] as string}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                      />
                    )}
                  </div>
                ))}

                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Prioridad</label>
                  <div className="relative">
                    <select
                      value={form.priority}
                      onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive appearance-none"
                    >
                      {['Urgente', 'Alta', 'Media', 'Baja'].map(p => <option key={p}>{p}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Asignar a</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.assignee}
                      onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}
                      placeholder="Nombre del familiar…"
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-ink dark:text-dark-ink">Tarea recurrente</div>
                    <div className="text-[11px] text-muted dark:text-dark-muted">Se repite automáticamente</div>
                  </div>
                  <Switch
                    checked={form.recurring}
                    onChange={checked => setForm(p => ({ ...p, recurring: checked }))}
                    aria-label="Tarea recurrente"
                  />
                </div>

                {form.recurring && (
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Frecuencia</label>
                    <div className="relative">
                      <select
                        value={form.freq}
                        onChange={e => setForm(p => ({ ...p, freq: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive appearance-none"
                      >
                        {['Diaria', 'Semanal', 'Mensual', 'Trimestral', 'Personalizada'].map(f => <option key={f}>{f}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-5 border-t border-line dark:border-dark-line flex gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity cursor-pointer"
                >
                  Guardar tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
