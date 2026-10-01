'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  RotateCcw,
  X,
  Calendar,
  User,
  ChevronDown,
  Loader2,
  Pencil,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/lib/auth-context'
import { useHousehold } from '@/lib/household-context'
import {
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask as apiDeleteTask,
  updateTask,
  Task as ApiTask,
  TaskPriority,
} from '@/services/taskService'
import {
  getHouseholdMembers,
  HouseholdMemberDetails,
} from '@/services/householdService'
import { Switch } from '@/components/ui/Switch'

interface DisplayTask {
  id: string
  title: string
  description?: string
  done: boolean
  priority: string
  dueDate: string
  rawDueDate?: string // ISO YYYY-MM-DD
  assignedToId?: string | null
  assigneeName: string
  recurring: boolean
  freq?: string
  createdAt?: string
}

type View = 'todas' | 'hoy' | 'proximas' | 'completadas'

const priorityStyle: Record<string, string> = {
  Urgente: 'bg-terracotta-bg text-terracotta dark:bg-dark-surface dark:text-dark-terracotta',
  Alta: 'bg-sand-bg text-ink dark:bg-dark-surface dark:text-dark-ink',
  Media: 'bg-softblue-bg text-ink dark:bg-dark-surface dark:text-dark-ink',
  Baja: 'bg-sage-soft text-muted dark:bg-dark-surface dark:text-dark-muted',
}

const priorityMapToApi: Record<string, TaskPriority> = {
  Urgente: 'URGENT',
  Alta: 'HIGH',
  Media: 'MEDIUM',
  Baja: 'LOW',
}

const priorityMapFromApi: Record<string, string> = {
  URGENT: 'Urgente',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
}

const formatDateEC = (dateStr?: string | null): string => {
  if (!dateStr) return 'Sin fecha'
  const raw = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-')
    return `${d}/${m}/${y}`
  }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatDateTimeEC = (dateStr?: string | null): string => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTodayStr = (): string => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatDisplayTask = (
  t: ApiTask,
  membersList: HouseholdMemberDetails[]
): DisplayTask => {
  const assignedMember = t.assigned_to
    ? membersList.find((m) => m.user_id === t.assigned_to)
    : null
  let assigneeName = 'Sin asignar'
  if (assignedMember) {
    assigneeName = assignedMember.name || assignedMember.email
  } else if (t.assignee?.name) {
    assigneeName = t.assignee.name
  }

  const rawDueDate = t.due_date
    ? t.due_date.includes('T')
      ? t.due_date.split('T')[0]
      : t.due_date
    : ''
  const dueDate = rawDueDate ? formatDateEC(rawDueDate) : 'Sin fecha'

  return {
    id: t.id,
    title: t.title,
    description: t.description || undefined,
    done: t.status === 'COMPLETED',
    priority: priorityMapFromApi[t.priority] || 'Media',
    dueDate,
    rawDueDate: rawDueDate || undefined,
    assignedToId: t.assigned_to || null,
    assigneeName,
    recurring: t.is_recurring,
    freq: t.recurrence_rule || 'Semanal',
    createdAt: t.created_at ? formatDateTimeEC(t.created_at) : undefined,
  }
}

export default function Tasks() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { activeHousehold } = useHousehold()

  const [taskList, setTaskList] = useState<DisplayTask[]>([])
  const [members, setMembers] = useState<HouseholdMemberDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('todas')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<DisplayTask | null>(null)
  const [detailTask, setDetailTask] = useState<DisplayTask | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Media',
    assigneeId: '',
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
      const [tasksData, membersData] = await Promise.all([
        getTasks(householdId),
        getHouseholdMembers(householdId).catch((err) => {
          console.error('Error fetching household members', err)
          return [] as HouseholdMemberDetails[]
        }),
      ])
      const safeMembers = membersData || []
      setMembers(safeMembers)

      const mapped: DisplayTask[] = (tasksData || []).map((t: ApiTask) =>
        formatDisplayTask(t, safeMembers)
      )
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
    const task = taskList.find((t) => t.id === id)
    if (!task) return

    const newDone = !task.done
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: newDone } : t))
    )
    setDetailTask((prev) =>
      prev && prev.id === id ? { ...prev, done: newDone } : prev
    )

    if (newDone) {
      toast(`"${task.title}" completada.`, 'success')
    } else {
      toast(`"${task.title}" marcada como pendiente.`, 'info')
    }

    try {
      await updateTaskStatus(id, newDone ? 'COMPLETED' : 'PENDING')
    } catch {
      // Local state already updated
    }
  }

  const todayStr = getTodayStr()

  const filtered = taskList.filter((t) => {
    if (view === 'hoy') return !t.done && t.rawDueDate === todayStr
    if (view === 'proximas') return !t.done && (!t.rawDueDate || t.rawDueDate !== todayStr)
    if (view === 'completadas') return t.done
    return true
  })

  const openCreateDrawer = () => {
    setEditingTask(null)
    setForm({
      title: '',
      description: '',
      dueDate: '',
      priority: 'Media',
      assigneeId: '',
      recurring: false,
      freq: 'Semanal',
    })
    setDrawerOpen(true)
  }

  const openEditDrawer = (task: DisplayTask) => {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.rawDueDate || '',
      priority: task.priority,
      assigneeId: task.assignedToId || '',
      recurring: task.recurring,
      freq: task.freq || 'Semanal',
    })
    setDrawerOpen(true)
  }

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const assignedMember = members.find((m) => m.user_id === form.assigneeId)
    const assigneeName = assignedMember
      ? (assignedMember.name || assignedMember.email)
      : 'Sin asignar'
    const rawDueDate = form.dueDate || ''
    const formattedDueDate = rawDueDate ? formatDateEC(rawDueDate) : 'Sin fecha'

    if (editingTask) {
      const updatedDisplay: DisplayTask = {
        ...editingTask,
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        dueDate: formattedDueDate,
        rawDueDate: rawDueDate || undefined,
        assignedToId: form.assigneeId || null,
        assigneeName,
        recurring: form.recurring,
        freq: form.recurring ? form.freq : undefined,
      }

      setTaskList((prev) =>
        prev.map((t) => (t.id === editingTask.id ? updatedDisplay : t))
      )
      if (detailTask && detailTask.id === editingTask.id) {
        setDetailTask(updatedDisplay)
      }
      setDrawerOpen(false)
      const targetTaskId = editingTask.id
      setEditingTask(null)
      toast('Tarea actualizada.', 'success')

      try {
        await updateTask(targetTaskId, {
          title: form.title,
          description: form.description || undefined,
          priority: priorityMapToApi[form.priority] || 'MEDIUM',
          due_date: form.dueDate || undefined,
          assigned_to: form.assigneeId || null,
          is_recurring: form.recurring,
          recurrence_rule: form.recurring ? form.freq : undefined,
        })
      } catch (err) {
        console.error('Error updating task in DB', err)
      }
      return
    }

    // Creating task
    const tempId = Date.now().toString()
    const newTask: DisplayTask = {
      id: tempId,
      title: form.title,
      description: form.description || undefined,
      done: false,
      priority: form.priority,
      dueDate: formattedDueDate,
      rawDueDate: rawDueDate || undefined,
      assignedToId: form.assigneeId || null,
      assigneeName,
      recurring: form.recurring,
      freq: form.recurring ? form.freq : undefined,
      createdAt: formatDateTimeEC(new Date().toISOString()),
    }

    setTaskList((prev) => [newTask, ...prev])
    setDrawerOpen(false)
    toast('Tarea guardada.', 'success')

    if (activeHousehold?.id && user?.id) {
      try {
        const created = await createTask(activeHousehold.id, user.id, {
          title: form.title,
          description: form.description || undefined,
          priority: priorityMapToApi[form.priority] || 'MEDIUM',
          due_date: form.dueDate || undefined,
          assigned_to: form.assigneeId || null,
          is_recurring: form.recurring,
          recurrence_rule: form.recurring ? form.freq : undefined,
        })
        setTaskList((prev) =>
          prev.map((t) =>
            t.id === tempId
              ? {
                  ...t,
                  id: created.id,
                  createdAt: created.created_at
                    ? formatDateTimeEC(created.created_at)
                    : t.createdAt,
                }
              : t
          )
        )
      } catch (err) {
        console.error('Error creating task in DB', err)
      }
    }
  }

  const deleteTask = async (id: string) => {
    setTaskList((prev) => prev.filter((t) => t.id !== id))
    if (detailTask?.id === id) {
      setDetailTask(null)
    }
    toast('Tarea eliminada.', 'info')

    try {
      await apiDeleteTask(id)
    } catch {
      // Local state updated
    }
  }

  const handleDeleteFromDetail = (id: string) => {
    if (window.confirm('¿Deseas eliminar esta tarea?')) {
      deleteTask(id)
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
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">
          Hogar
        </p>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[42px] lg:text-[56px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">
              TAREAS
            </h1>
            <p className="text-[14px] text-muted dark:text-dark-muted mt-3 max-w-md">
              Organiza lo que mantiene en marcha tu hogar.
            </p>
          </div>
          <button
            onClick={openCreateDrawer}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Plus size={14} /> Nueva tarea
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-8 text-[13px]">
        <span className="font-mono text-[22px] font-light text-ink dark:text-dark-ink">
          {taskList.filter((t) => !t.done).length}
        </span>
        <span className="text-muted dark:text-dark-muted">pendientes</span>
        <span className="text-line dark:text-dark-line">·</span>
        <span className="font-mono text-[22px] font-light text-olive dark:text-dark-olive">
          {taskList.filter((t) => t.done).length}
        </span>
        <span className="text-muted dark:text-dark-muted">completadas</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-bg dark:bg-dark-bg rounded-[4px] p-1 w-fit border border-line dark:border-dark-line">
        {views.map((v) => (
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
            <p className="text-[15px] text-ink dark:text-dark-ink mb-1">
              Todo tranquilo por aquí.
            </p>
            <p className="text-[13px] text-muted dark:text-dark-muted">
              No hay tareas en esta vista.
            </p>
          </div>
        ) : (
          filtered.map((task, i) => (
            <div
              key={task.id}
              onClick={() => setDetailTask(task)}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-bg dark:hover:bg-dark-bg transition-colors group cursor-pointer ${
                i > 0 ? 'border-t border-line dark:border-dark-line' : ''
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggle(task.id)
                }}
                className={`w-4 h-4 rounded-[2px] border shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                  task.done
                    ? 'bg-olive dark:bg-dark-olive border-olive dark:border-dark-olive'
                    : 'border-line dark:border-dark-line hover:border-olive dark:hover:border-dark-olive'
                }`}
                aria-label={task.done ? 'Marcar como pendiente' : 'Marcar como completada'}
              >
                {task.done && <span className="text-white text-[9px] leading-none">✓</span>}
              </button>

              <div className="flex-1 min-w-0">
                <div
                  className={`text-[14px] font-medium text-ink dark:text-dark-ink truncate transition-all ${
                    task.done ? 'line-through opacity-40' : ''
                  }`}
                >
                  {task.title}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {task.dueDate && task.dueDate !== 'Sin fecha' && (
                    <span className="text-[11px] text-muted dark:text-dark-muted flex items-center gap-1">
                      <Calendar size={10} /> {task.dueDate}
                    </span>
                  )}
                  {task.assigneeName && task.assigneeName !== 'Sin asignar' && (
                    <span className="text-[11px] text-muted dark:text-dark-muted flex items-center gap-1">
                      <User size={10} /> {task.assigneeName}
                    </span>
                  )}
                  {task.recurring && (
                    <span className="text-[11px] text-muted dark:text-dark-muted flex items-center gap-1">
                      <RotateCcw size={10} /> {task.freq}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    priorityStyle[task.priority] || priorityStyle.Media
                  }`}
                >
                  {task.priority}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openEditDrawer(task)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-all p-1 cursor-pointer"
                  title="Editar tarea"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteTask(task.id)
                  }}
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

      {/* Task Detail Drawer */}
      {detailTask && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-ink/20 dark:bg-black/50 backdrop-blur-xs"
            onClick={() => setDetailTask(null)}
          />
          <div className="relative w-full max-w-md h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink">
                Detalle de tarea
              </h3>
              <button
                onClick={() => setDetailTask(null)}
                className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-6 space-y-6">
              {/* Title & Status */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                      priorityStyle[detailTask.priority] || priorityStyle.Media
                    }`}
                  >
                    Prioridad {detailTask.priority}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${
                      detailTask.done
                        ? 'bg-olive/10 text-olive dark:bg-dark-olive/20 dark:text-dark-olive'
                        : 'bg-sand-bg text-ink dark:bg-dark-surface dark:text-dark-ink'
                    }`}
                  >
                    {detailTask.done ? (
                      <>
                        <CheckCircle2 size={11} /> Completada
                      </>
                    ) : (
                      <>
                        <Clock size={11} /> Pendiente
                      </>
                    )}
                  </span>
                </div>
                <h2
                  className={`text-[20px] font-medium text-ink dark:text-dark-ink leading-snug break-words ${
                    detailTask.done ? 'line-through opacity-50' : ''
                  }`}
                >
                  {detailTask.title}
                </h2>
                <div className="mt-2.5">
                  <button
                    onClick={() => toggle(detailTask.id)}
                    className="text-[12px] font-medium text-olive dark:text-dark-olive hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    {detailTask.done ? (
                      <>
                        <RotateCcw size={12} /> Marcar como pendiente
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={12} /> Marcar como completada
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-[4px] bg-bg dark:bg-dark-bg border border-line dark:border-dark-line">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-2">
                  Descripción
                </p>
                {detailTask.description ? (
                  <p className="text-[13px] text-ink dark:text-dark-ink whitespace-pre-wrap leading-relaxed">
                    {detailTask.description}
                  </p>
                ) : (
                  <p className="text-[13px] text-muted/60 dark:text-dark-muted/60 italic">
                    Sin descripción
                  </p>
                )}
              </div>

              {/* Details List */}
              <div className="space-y-3.5 border-t border-line dark:border-dark-line pt-5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted dark:text-dark-muted flex items-center gap-2">
                    <User size={14} /> Asignada a
                  </span>
                  <span className="font-medium text-ink dark:text-dark-ink">
                    {detailTask.assigneeName}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted dark:text-dark-muted flex items-center gap-2">
                    <Calendar size={14} /> Fecha límite
                  </span>
                  <span className="font-medium text-ink dark:text-dark-ink">
                    {detailTask.dueDate}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted dark:text-dark-muted flex items-center gap-2">
                    <RotateCcw size={14} /> Recurrencia
                  </span>
                  <span className="font-medium text-ink dark:text-dark-ink">
                    {detailTask.recurring ? `Sí (${detailTask.freq || 'Semanal'})` : 'No recurrente'}
                  </span>
                </div>

                {detailTask.createdAt && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted dark:text-dark-muted flex items-center gap-2">
                      <Clock size={14} /> Creada el
                    </span>
                    <span className="font-mono text-[12px] text-muted dark:text-dark-muted">
                      {detailTask.createdAt}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-line dark:border-dark-line flex items-center justify-between gap-3 bg-surface dark:bg-dark-surface">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditDrawer(detailTask)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[12px] font-medium hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <Pencil size={12} /> Editar tarea
                </button>
                <button
                  onClick={() => handleDeleteFromDetail(detailTask.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-terracotta dark:text-dark-terracotta border border-terracotta/30 dark:border-dark-terracotta/30 hover:bg-terracotta/10 rounded-[4px] text-[12px] font-medium transition-colors cursor-pointer"
                >
                  <Trash2 size={12} /> Eliminar tarea
                </button>
              </div>
              <button
                onClick={() => setDetailTask(null)}
                className="px-3 py-2 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Drawer (Create / Edit) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-ink/20 dark:bg-black/50 backdrop-blur-xs"
            onClick={() => {
              setDrawerOpen(false)
              setEditingTask(null)
            }}
          />
          <div className="relative w-full max-w-md h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink">
                {editingTask ? 'Editar tarea' : 'Nueva tarea'}
              </h3>
              <button
                onClick={() => {
                  setDrawerOpen(false)
                  setEditingTask(null)
                }}
                className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveTask} className="flex-1 flex flex-col">
              <div className="flex-1 px-6 py-6 space-y-5">
                {/* Título */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Título
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Limpiar filtro de la campana…"
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Detalles adicionales…"
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive resize-none"
                  />
                </div>

                {/* Fecha límite */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Fecha límite
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                  />
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Prioridad
                  </label>
                  <div className="relative">
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive appearance-none"
                    >
                      {['Urgente', 'Alta', 'Media', 'Baja'].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                    />
                  </div>
                </div>

                {/* Asignar a (Member Dropdown) */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Asignar a
                  </label>
                  <div className="relative">
                    <select
                      value={form.assigneeId}
                      onChange={(e) => setForm((p) => ({ ...p, assigneeId: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive appearance-none"
                    >
                      <option value="">Sin asignar</option>
                      {members.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.name || m.email} {m.user_id === user?.id ? '(Tú)' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                    />
                  </div>
                </div>

                {/* Tarea recurrente */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-ink dark:text-dark-ink">
                      Tarea recurrente
                    </div>
                    <div className="text-[11px] text-muted dark:text-dark-muted">
                      Se repite automáticamente
                    </div>
                  </div>
                  <Switch
                    checked={form.recurring}
                    onChange={(checked) => setForm((p) => ({ ...p, recurring: checked }))}
                    aria-label="Tarea recurrente"
                  />
                </div>

                {form.recurring && (
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                      Frecuencia
                    </label>
                    <div className="relative">
                      <select
                        value={form.freq}
                        onChange={(e) => setForm((p) => ({ ...p, freq: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive appearance-none"
                      >
                        {['Diaria', 'Semanal', 'Mensual', 'Trimestral', 'Personalizada'].map(
                          (f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          )
                        )}
                      </select>
                      <ChevronDown
                        size={13}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-5 border-t border-line dark:border-dark-line flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false)
                    setEditingTask(null)
                  }}
                  className="flex-1 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity cursor-pointer"
                >
                  {editingTask ? 'Guardar cambios' : 'Guardar tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
