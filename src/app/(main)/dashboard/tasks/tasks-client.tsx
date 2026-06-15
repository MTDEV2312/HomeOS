"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useHousehold } from '@/lib/household-context';
import { getTasks, createTask, updateTaskStatus, deleteTask, updateTask, Task, TaskPriority, TaskStatus } from '@/services/taskService';
import { useToast } from '@/lib/toast-context';
import { getHouseholdMembers, HouseholdMemberDetails } from '@/services/householdService';
import { insforge } from '@/lib/insforge';
import { 
  CheckCircle, PlusCircle, Calendar, User, 
  Filter, Repeat, X, AlertCircle, Loader2, Edit2, Trash2,
  Clock, CheckSquare
} from 'lucide-react';
import { format, isToday, isPast, parseISO, isFuture } from 'date-fns';
import { getErrorMessage } from '@/lib/errors';

type Tab = 'TODAY' | 'UPCOMING' | 'COMPLETED';

export default function TasksPage() {
  const { user } = useAuth();
  const { activeHousehold, activeRole, isLoadingHousehold } = useHousehold();
  const { error: showError } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<HouseholdMemberDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<Tab>('TODAY');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail & Edit Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<{ 
    title: string; 
    description: string; 
    due_date: string; 
    priority: TaskPriority; 
    assigned_to: string; 
    is_recurring: boolean; 
    recurrence_rule: string;
  }>({
    title: '',
    description: '',
    due_date: '',
    priority: 'MEDIUM',
    assigned_to: 'unassigned',
    is_recurring: false,
    recurrence_rule: 'WEEKLY'
  });

  // Form State
  const [formData, setFormData] = useState<{ 
    title: string; 
    description: string; 
    due_date: string; 
    priority: TaskPriority; 
    assigned_to: string; 
    is_recurring: boolean; 
    recurrence_rule: string;
  }>({
    title: '',
    description: '',
    due_date: '',
    priority: 'MEDIUM',
    assigned_to: 'unassigned',
    is_recurring: false,
    recurrence_rule: 'WEEKLY'
  });

  useEffect(() => {
    let active = true;

    const onInsertTask = (payload: Task) => {
      if (!active) return;
      setTasks(prev => prev.find(t => t.id === payload.id) ? prev : [...prev, payload]);
    };

    const onUpdateTask = (payload: Task) => {
      if (!active) return;
      setTasks(prev => prev.map(t => t.id === payload.id ? payload : t));
    };

    const onDeleteTask = (payload: Task) => {
      if (!active) return;
      setTasks(prev => prev.filter(t => t.id !== payload.id));
    };

    async function loadData() {
      if (!activeHousehold || !user) {
        if (!isLoadingHousehold) setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [tasksData, membersData] = await Promise.all([
          getTasks(activeHousehold.id),
          getHouseholdMembers(activeHousehold.id)
        ]);
        if (!active) return;
        setTasks(tasksData);
        setMembers(membersData);

        // Realtime Subscription
        await insforge.realtime.connect();
        const channelName = `household:${activeHousehold.id}`;
        await insforge.realtime.subscribe(channelName);

        insforge.realtime.on('INSERT_tasks', onInsertTask);
        insforge.realtime.on('UPDATE_tasks', onUpdateTask);
        insforge.realtime.on('DELETE_tasks', onDeleteTask);

      } catch (err: unknown) {
        if (active) setError(getErrorMessage(err, 'Error al cargar las tareas'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();

    return () => {
      active = false;
      if (activeHousehold) {
        insforge.realtime.unsubscribe(`household:${activeHousehold.id}`);
        insforge.realtime.off('INSERT_tasks', onInsertTask);
        insforge.realtime.off('UPDATE_tasks', onUpdateTask);
        insforge.realtime.off('DELETE_tasks', onDeleteTask);
      }
    };
  }, [activeHousehold, user, isLoadingHousehold]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold || !user) return;
    
    try {
      setIsSubmitting(true);
      const newTask = await createTask(activeHousehold.id, user.id, {
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        priority: formData.priority,
        assigned_to: formData.assigned_to === 'unassigned' ? undefined : formData.assigned_to,
        is_recurring: formData.is_recurring,
        recurrence_rule: formData.is_recurring ? formData.recurrence_rule : undefined,
        status: 'PENDING'
      });
      
      setTasks([...tasks, newTask]);
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        due_date: '',
        priority: 'MEDIUM',
        assigned_to: 'unassigned',
        is_recurring: false,
        recurrence_rule: 'WEEKLY'
      });
    } catch (err: unknown) {
      showError('Error al crear tarea', getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const updated = await updateTaskStatus(task.id, newStatus);
      let updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: updated.status } : t);

      // Si se completó una tarea recurrente, calcular y programar la siguiente instancia
      if (newStatus === 'COMPLETED' && task.is_recurring && activeHousehold && user) {
        const baseDate = task.due_date ? new Date(task.due_date) : new Date();
        const nextDate = new Date(baseDate);
        const freq = task.recurrence_rule || 'WEEKLY';
        
        if (freq === 'DAILY') {
          nextDate.setDate(baseDate.getDate() + 1);
        } else if (freq === 'MONTHLY') {
          nextDate.setMonth(baseDate.getMonth() + 1);
        } else { // default WEEKLY
          nextDate.setDate(baseDate.getDate() + 7);
        }

        const nextTask = await createTask(activeHousehold.id, user.id, {
          title: task.title,
          description: task.description || undefined,
          due_date: nextDate.toISOString(),
          priority: task.priority,
          assigned_to: task.assigned_to || undefined,
          is_recurring: true,
          recurrence_rule: freq,
          status: 'PENDING'
        });

        updatedTasks = [...updatedTasks, nextTask];
      }

      setTasks(updatedTasks);

      // Si la tarea seleccionada en detalle es esta, actualizar su estado en la UI
      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask({ ...selectedTask, status: updated.status });
      }
    } catch (err: unknown) {
      showError('Error actualizando tarea', getErrorMessage(err));
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err: unknown) {
      showError('Error eliminando la tarea', getErrorMessage(err));
    }
  };

  // Permission check: creator OR ADMIN/OWNER
  const canEditOrDelete = (task: Task) => {
    if (!user || !activeRole) return false;
    return task.creator_id === user.id || activeRole === 'OWNER' || activeRole === 'ADMIN';
  };

  // Open detail modal
  const openDetailModal = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  // Open edit modal with task data
  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setEditFormData({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      priority: task.priority,
      assigned_to: task.assigned_to || 'unassigned',
      is_recurring: task.is_recurring,
      recurrence_rule: task.recurrence_rule || 'WEEKLY'
    });
    setIsEditModalOpen(true);
  };

  // Handle edit submit
  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      setIsSubmitting(true);
      const updated = await updateTask(selectedTask.id, {
        title: editFormData.title,
        description: editFormData.description || undefined,
        due_date: editFormData.due_date ? new Date(editFormData.due_date).toISOString() : undefined,
        priority: editFormData.priority,
        assigned_to: editFormData.assigned_to === 'unassigned' ? undefined : editFormData.assigned_to,
        is_recurring: editFormData.is_recurring,
        recurrence_rule: editFormData.is_recurring ? editFormData.recurrence_rule : undefined
      });

      setTasks(tasks.map(t => t.id === selectedTask.id ? updated : t));
      setIsEditModalOpen(false);
      setIsDetailModalOpen(false);
      setSelectedTask(null);
    } catch (err: unknown) {
      showError('Error actualizando tarea', getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering Logic
  const filteredTasks = tasks.filter(task => {
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;

    if (activeTab === 'COMPLETED') return task.status === 'COMPLETED';
    
    // For pending/in-progress tasks
    if (task.status === 'COMPLETED') return false;

    if (activeTab === 'TODAY') {
      if (!task.due_date) return true; // Unscheduled tasks show in today? or upcoming? Let's say Today.
      const d = parseISO(task.due_date);
      return isToday(d) || isPast(d); // Overdue tasks show in today
    }
    if (activeTab === 'UPCOMING') {
      if (!task.due_date) return false;
      const d = parseISO(task.due_date);
      return isFuture(d) && !isToday(d);
    }

    return true;
  });

  if (isLoadingHousehold || loading) {
    return <div className="flex justify-center p-xl"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  if (!activeHousehold) {
    return (
      <div className="p-xl bg-surface-container-lowest rounded-xl border border-outline-variant text-center">
        <AlertCircle className="w-12 h-12 text-outline mx-auto mb-md" />
        <h2 className="font-h3 text-h3 text-on-surface">No tienes un hogar activo</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-sm">Ve a Configuración de Hogar para crear o unirte a uno.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-lg w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-lg gap-md">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface">Gestión de Tareas</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Organiza, asigna y realiza seguimiento de las labores del hogar.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary font-label-md text-label-md rounded-lg py-sm px-lg flex items-center justify-center gap-sm hover:bg-surface-tint transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-5 h-5" />
          Nueva Tarea
        </button>
      </div>

      {error && <div className="bg-error-container text-on-error-container p-sm rounded">{error}</div>}

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-md gap-md bg-surface-container-lowest p-sm rounded-xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-xs overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {(['TODAY', 'UPCOMING', 'COMPLETED'] as Tab[]).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-label-md text-label-md px-md py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab 
                ? 'bg-primary-container text-on-primary-container' 
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              {tab === 'TODAY' ? 'Hoy' : tab === 'UPCOMING' ? 'Próximas' : 'Completadas'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-sm w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Filter className="absolute left-sm top-1/2 -translate-y-1/2 text-outline w-[18px] h-[18px]" />
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-surface border border-outline-variant rounded-lg py-2 pl-xl pr-lg font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">Todas las prioridades</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-md">
        {filteredTasks.length === 0 && (
          <div className="col-span-full py-xl text-center text-on-surface-variant font-body-md">
            No hay tareas en esta vista.
          </div>
        )}
        {filteredTasks.map(task => {
          const isCompleted = task.status === 'COMPLETED';
          
          let priorityColor = 'bg-surface-variant text-on-surface-variant';
          let borderColor = 'bg-outline';
          if (task.priority === 'URGENT') {
            priorityColor = 'bg-error-container text-on-error-container';
            borderColor = 'bg-error';
          } else if (task.priority === 'HIGH') {
            priorityColor = 'bg-primary-container text-primary';
            borderColor = 'bg-surface-tint';
          } else if (task.priority === 'LOW') {
            priorityColor = 'bg-surface-container-high text-on-surface';
            borderColor = 'bg-outline-variant';
          }

          const assigneeName = members.find(m => m.user_id === task.assigned_to)?.name || 'Cualquiera';

          return (
            <div 
              key={task.id} 
              onClick={() => openDetailModal(task)}
              className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer hover:border-primary/50"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderColor}`}></div>
              <div className="flex justify-between items-start mb-sm pl-sm">
                <div className="flex items-center gap-sm">
                  <div 
                    onClick={() => handleToggleStatus(task)}
                    className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                      isCompleted ? 'bg-primary border-primary text-white' : 'border-outline hover:border-primary bg-surface'
                    }`}
                  >
                    {isCompleted && <CheckCircle className="w-3 h-3" />}
                  </div>
                  <h3 className={`font-h3 text-h3 line-clamp-1 ${isCompleted ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                    {task.title}
                  </h3>
                </div>
                <span className={`${priorityColor} font-label-sm text-label-sm px-2 py-1 rounded-full whitespace-nowrap text-xs`}>
                  {task.priority}
                </span>
              </div>
              
              {task.description && (
                <div className="pl-xl mb-md">
                  <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">{task.description}</p>
                </div>
              )}
              
              <div className="pl-xl flex items-center justify-between border-t border-outline-variant/30 pt-sm mt-auto">
                <div className="flex items-center gap-sm">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full border-2 border-surface-container-lowest bg-secondary-container flex items-center justify-center text-on-secondary-container font-label-sm text-[10px] uppercase overflow-hidden" title={assigneeName}>
                      {assigneeName.charAt(0)}
                    </div>
                  </div>
                  {task.due_date && (
                    <span className={`font-label-sm text-label-sm ${isPast(parseISO(task.due_date)) && !isCompleted ? 'text-error' : 'text-on-surface-variant'}`}>
                      {format(parseISO(task.due_date), 'dd MMM yyyy')}
                    </span>
                  )}
                </div>
                
                {canEditOrDelete(task) && (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => openEditModal(task)}
                      className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-primary-container transition-colors opacity-0 group-hover:opacity-100"
                      title="Editar tarea"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(task.id)} 
                      className="text-on-surface-variant hover:text-error p-1 rounded-full hover:bg-error-container transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar tarea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pb-20 md:pb-4">
          <div className="relative bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant w-full max-w-2xl flex flex-col overflow-hidden max-h-[85vh]">
            <header className="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-lowest">
              <div>
                <h2 className="font-h3 text-h3 text-on-surface">Nueva Tarea</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Añade detalles para la coordinación del hogar.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-sm text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-lg space-y-lg">
              <form id="taskForm" onSubmit={handleCreateTask} className="space-y-lg">
                <div className="space-y-sm">
                  <label className="block font-label-md text-label-md text-on-surface">Título de la Tarea</label>
                  <input 
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" 
                    placeholder="ej. Limpiar la cocina a fondo" 
                  />
                </div>

                <div className="space-y-sm">
                  <label className="block font-label-md text-label-md text-on-surface">Descripción</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-y" 
                    placeholder="Añade notas o instrucciones específicas..." 
                    rows={3}
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="space-y-sm">
                    <label className="block font-label-md text-label-md text-on-surface">Fecha Límite</label>
                    <div className="relative">
                      <Calendar className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                      <input 
                        type="date"
                        value={formData.due_date}
                        onChange={e => setFormData({...formData, due_date: e.target.value})}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-xl pr-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" 
                      />
                    </div>
                  </div>

                  <div className="space-y-sm">
                    <label className="block font-label-md text-label-md text-on-surface">Prioridad</label>
                    <select 
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    >
                      <option value="LOW">Baja</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>

                  <div className="space-y-sm md:col-span-2">
                    <label className="block font-label-md text-label-md text-on-surface">Asignar a</label>
                    <div className="relative">
                      <User className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                      <select 
                        value={formData.assigned_to}
                        onChange={e => setFormData({...formData, assigned_to: e.target.value})}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-xl pr-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                      >
                        <option value="unassigned">Sin asignar (Cualquiera)</option>
                        {members.map(m => (
                          <option key={m.user_id} value={m.user_id}>{m.name} {m.user_id === user?.id ? '(Tú)' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Recurrence */}
                <div className="bg-surface-bright border border-outline-variant rounded-xl p-md mt-sm flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                      <Repeat className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block font-label-md text-label-md text-on-surface">Tarea Recurrente</span>
                      <span className="block font-label-sm text-label-sm text-on-surface-variant">Repetir esta labor regularmente</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.is_recurring}
                      onChange={e => setFormData({...formData, is_recurring: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {formData.is_recurring && (
                  <div className="flex flex-col gap-1 mt-sm animate-fade-in">
                    <label className="block font-label-md text-label-md text-on-surface">Frecuencia</label>
                    <select
                      value={formData.recurrence_rule}
                      onChange={e => setFormData({...formData, recurrence_rule: e.target.value})}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    >
                      <option value="DAILY">Diaria</option>
                      <option value="WEEKLY">Semanal</option>
                      <option value="MONTHLY">Mensual</option>
                    </select>
                  </div>
                )}
              </form>
            </div>

            <footer className="flex flex-col-reverse sm:flex-row items-center justify-between gap-sm px-lg py-md border-t border-outline-variant bg-surface-container-lowest shrink-0">
              <div className="flex items-center gap-xs text-on-surface-variant">
                <CheckCircle className="w-4 h-4" />
                <span className="font-label-sm text-label-sm">Powered by InsForge</span>
              </div>
              <div className="flex gap-md w-full sm:w-auto">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-none px-lg py-sm rounded-lg font-label-md text-label-md text-on-surface border border-outline-variant hover:bg-surface-container-low transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  form="taskForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-lg py-sm rounded-lg font-label-md text-label-md text-on-primary bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Tarea
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {isDetailModalOpen && selectedTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pb-20 md:pb-4">
          <div className="relative bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant w-full max-w-2xl flex flex-col overflow-hidden max-h-[85vh]">
            <header className="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-lowest">
              <div className="flex items-center gap-md">
                <div className={`w-3 h-3 rounded-full ${
                  selectedTask.priority === 'URGENT' ? 'bg-error' :
                  selectedTask.priority === 'HIGH' ? 'bg-primary' :
                  selectedTask.priority === 'LOW' ? 'bg-outline-variant' : 'bg-surface-tint'
                }`}></div>
                <div>
                  <h2 className="font-h3 text-h3 text-on-surface">{selectedTask.title}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                    {selectedTask.status === 'COMPLETED' ? 'Completada' : 
                     selectedTask.status === 'PENDING' ? 'Pendiente' : 'En progreso'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setIsDetailModalOpen(false); setSelectedTask(null); }}
                className="p-sm text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-lg space-y-lg">
              {/* Priority & Status */}
              <div className="flex flex-wrap gap-sm">
                <span className={`font-label-sm text-label-sm px-3 py-1 rounded-full ${
                  selectedTask.priority === 'URGENT' ? 'bg-error-container text-on-error-container' :
                  selectedTask.priority === 'HIGH' ? 'bg-primary-container text-primary' :
                  selectedTask.priority === 'LOW' ? 'bg-surface-container-high text-on-surface' :
                  'bg-surface-variant text-on-surface-variant'
                }`}>
                  {selectedTask.priority === 'URGENT' ? '🔴 Urgente' :
                   selectedTask.priority === 'HIGH' ? '🟠 Alta' :
                   selectedTask.priority === 'LOW' ? '⚪ Baja' : '🟡 Media'}
                </span>
                {selectedTask.is_recurring && (
                  <span className="font-label-sm text-label-sm px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container flex items-center gap-1">
                    <Repeat className="w-3 h-3" /> Recurrente
                  </span>
                )}
              </div>

              {/* Description */}
              {selectedTask.description && (
                <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/30">
                  <h4 className="font-label-md text-label-md text-on-surface-variant mb-sm">Descripción</h4>
                  <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                {selectedTask.due_date && (
                  <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/30">
                    <div className="flex items-center gap-sm text-on-surface-variant mb-xs">
                      <Calendar className="w-4 h-4" />
                      <span className="font-label-sm text-label-sm">Fecha límite</span>
                    </div>
                    <p className={`font-body-md text-body-md ${
                      isPast(parseISO(selectedTask.due_date)) && selectedTask.status !== 'COMPLETED' 
                        ? 'text-error' : 'text-on-surface'
                    }`}>
                      {format(parseISO(selectedTask.due_date), 'EEEE, d MMMM yyyy')}
                    </p>
                  </div>
                )}

                <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/30">
                  <div className="flex items-center gap-sm text-on-surface-variant mb-xs">
                    <User className="w-4 h-4" />
                    <span className="font-label-sm text-label-sm">Asignada a</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface">
                    {members.find(m => m.user_id === selectedTask.assigned_to)?.name || 'Sin asignar'}
                  </p>
                </div>

                <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/30">
                  <div className="flex items-center gap-sm text-on-surface-variant mb-xs">
                    <CheckSquare className="w-4 h-4" />
                    <span className="font-label-sm text-label-sm">Creador</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface">
                    {user?.id === selectedTask.creator_id ? 'Tú' : 
                     members.find(m => m.user_id === selectedTask.creator_id)?.name || 'Miembro'}
                  </p>
                </div>

                <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/30">
                  <div className="flex items-center gap-sm text-on-surface-variant mb-xs">
                    <Clock className="w-4 h-4" />
                    <span className="font-label-sm text-label-sm">Creada</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface">
                    {format(parseISO(selectedTask.created_at), 'd MMM yyyy, HH:mm')}
                  </p>
                </div>
              </div>
            </div>

            <footer className="flex flex-col-reverse sm:flex-row items-center justify-between gap-sm px-lg py-md border-t border-outline-variant bg-surface-container-lowest shrink-0">
              <div className="flex items-center gap-xs text-on-surface-variant">
                <CheckCircle className="w-4 h-4" />
                <span className="font-label-sm text-label-sm">Powered by InsForge</span>
              </div>
              <div className="flex gap-md w-full sm:w-auto">
                {canEditOrDelete(selectedTask) && (
                  <button 
                    onClick={() => { setIsDetailModalOpen(false); openEditModal(selectedTask); }}
                    className="flex-1 sm:flex-none px-lg py-sm rounded-lg font-label-md text-label-md text-on-surface border border-outline-variant hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                )}
                <button 
                  onClick={() => { 
                    handleToggleStatus(selectedTask);
                    setIsDetailModalOpen(false);
                    setSelectedTask(null);
                  }}
                  className={`flex-1 sm:flex-none px-lg py-sm rounded-lg font-label-md text-label-md transition-colors flex items-center justify-center gap-2 ${
                    selectedTask.status === 'COMPLETED'
                      ? 'bg-surface-container-low text-on-surface border border-outline-variant hover:bg-surface-container'
                      : 'bg-primary text-on-primary hover:bg-primary/90'
                  }`}
                >
                  {selectedTask.status === 'COMPLETED' ? (
                    <>Marcar pendiente</>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Completar
                    </>
                  )}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && selectedTask && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 pb-20 md:pb-4">
          <div className="relative bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant w-full max-w-2xl flex flex-col overflow-hidden max-h-[85vh]">
            <header className="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-lowest">
              <div>
                <h2 className="font-h3 text-h3 text-on-surface">Editar Tarea</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Modifica los detalles de la tarea.</p>
              </div>
              <button 
                onClick={() => { setIsEditModalOpen(false); setSelectedTask(null); }}
                className="p-sm text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-lg space-y-lg">
              <form id="editTaskForm" onSubmit={handleEditTask} className="space-y-lg">
                <div className="space-y-sm">
                  <label className="block font-label-md text-label-md text-on-surface">Título de la Tarea</label>
                  <input 
                    required
                    value={editFormData.title}
                    onChange={e => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" 
                    placeholder="ej. Limpiar la cocina a fondo" 
                  />
                </div>

                <div className="space-y-sm">
                  <label className="block font-label-md text-label-md text-on-surface">Descripción</label>
                  <textarea 
                    value={editFormData.description}
                    onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-y" 
                    placeholder="Añade notas o instrucciones específicas..." 
                    rows={3}
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="space-y-sm">
                    <label className="block font-label-md text-label-md text-on-surface">Fecha Límite</label>
                    <div className="relative">
                      <Calendar className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                      <input 
                        type="date"
                        value={editFormData.due_date}
                        onChange={e => setEditFormData({...editFormData, due_date: e.target.value})}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-xl pr-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" 
                      />
                    </div>
                  </div>

                  <div className="space-y-sm">
                    <label className="block font-label-md text-label-md text-on-surface">Prioridad</label>
                    <select 
                      value={editFormData.priority}
                      onChange={e => setEditFormData({ ...editFormData, priority: e.target.value as TaskPriority })}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    >
                      <option value="LOW">Baja</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>

                  <div className="space-y-sm md:col-span-2">
                    <label className="block font-label-md text-label-md text-on-surface">Asignar a</label>
                    <div className="relative">
                      <User className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                      <select 
                        value={editFormData.assigned_to}
                        onChange={e => setEditFormData({...editFormData, assigned_to: e.target.value})}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-xl pr-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                      >
                        <option value="unassigned">Sin asignar (Cualquiera)</option>
                        {members.map(m => (
                          <option key={m.user_id} value={m.user_id}>{m.name} {m.user_id === user?.id ? '(Tú)' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Recurrence Toggle */}
                <div className="bg-surface-bright border border-outline-variant rounded-xl p-md mt-sm flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                      <Repeat className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block font-label-md text-label-md text-on-surface">Tarea Recurrente</span>
                      <span className="block font-label-sm text-label-sm text-on-surface-variant">Repetir esta labor regularmente</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editFormData.is_recurring}
                      onChange={e => setEditFormData({...editFormData, is_recurring: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {editFormData.is_recurring && (
                  <div className="flex flex-col gap-1 mt-sm animate-fade-in">
                    <label className="block font-label-md text-label-md text-on-surface">Frecuencia</label>
                    <select
                      value={editFormData.recurrence_rule}
                      onChange={e => setEditFormData({...editFormData, recurrence_rule: e.target.value})}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    >
                      <option value="DAILY">Diaria</option>
                      <option value="WEEKLY">Semanal</option>
                      <option value="MONTHLY">Mensual</option>
                    </select>
                  </div>
                )}
              </form>
            </div>

            <footer className="flex flex-col-reverse sm:flex-row items-center justify-between gap-sm px-lg py-md border-t border-outline-variant bg-surface-container-lowest shrink-0">
              <div className="flex items-center gap-xs text-on-surface-variant">
                <CheckCircle className="w-4 h-4" />
                <span className="font-label-sm text-label-sm">Powered by InsForge</span>
              </div>
              <div className="flex gap-md w-full sm:w-auto">
                <button 
                  onClick={() => { setIsEditModalOpen(false); setSelectedTask(null); }}
                  className="flex-1 sm:flex-none px-lg py-sm rounded-lg font-label-md text-label-md text-on-surface border border-outline-variant hover:bg-surface-container-low transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  form="editTaskForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-lg py-sm rounded-lg font-label-md text-label-md text-on-primary bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Cambios
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
