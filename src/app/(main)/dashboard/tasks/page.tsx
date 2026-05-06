"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useHousehold } from '@/lib/household-context';
import { getTasks, createTask, updateTaskStatus, deleteTask, Task } from '@/services/taskService';
import { getHouseholdMembers, HouseholdMemberDetails } from '@/services/householdService';
import { insforge } from '@/lib/insforge';
import { 
  CheckCircle, PlusCircle, MoreVertical, Calendar, User, 
  Filter, Repeat, X, AlertCircle, Loader2
} from 'lucide-react';
import { format, isToday, isPast, parseISO, isFuture } from 'date-fns';

type Tab = 'TODAY' | 'UPCOMING' | 'COMPLETED';

export default function TasksPage() {
  const { user } = useAuth();
  const { activeHousehold, isLoadingHousehold } = useHousehold();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<HouseholdMemberDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<Tab>('TODAY');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'MEDIUM',
    assigned_to: 'unassigned',
    is_recurring: false
  });

  useEffect(() => {
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
        setTasks(tasksData);
        setMembers(membersData);

        // Realtime Subscription
        await insforge.realtime.connect();
        const channelName = `household:${activeHousehold.id}`;
        await insforge.realtime.subscribe(channelName);

        insforge.realtime.on('INSERT_task', (payload: any) => {
          setTasks(prev => prev.find(t => t.id === payload.id) ? prev : [...prev, payload]);
        });

        insforge.realtime.on('UPDATE_task', (payload: any) => {
          setTasks(prev => prev.map(t => t.id === payload.id ? payload : t));
        });

        insforge.realtime.on('DELETE_task', (payload: any) => {
          setTasks(prev => prev.filter(t => t.id !== payload.id));
        });

      } catch (err: any) {
        setError(err.message || 'Error al cargar las tareas');
      } finally {
        setLoading(false);
      }
    }
    loadData();

    return () => {
      if (activeHousehold) {
        insforge.realtime.unsubscribe(`household:${activeHousehold.id}`);
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
        priority: formData.priority as any,
        assigned_to: formData.assigned_to === 'unassigned' ? undefined : formData.assigned_to,
        is_recurring: formData.is_recurring,
        status: 'PENDING'
      });
      
      setTasks([...tasks, newTask]);
      setIsModalOpen(false);
      setFormData({
        title: '', description: '', due_date: '', priority: 'MEDIUM', assigned_to: 'unassigned', is_recurring: false
      });
    } catch (err: any) {
      alert(err.message || 'Error al crear la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const updated = await updateTaskStatus(taskId, newStatus);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: updated.status } : t));
    } catch (err: any) {
      alert(err.message || 'Error actualizando tarea');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err: any) {
      alert(err.message || 'Error eliminando la tarea');
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
    <div className="flex-1 flex flex-col gap-lg">
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
            <div key={task.id} className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderColor}`}></div>
              <div className="flex justify-between items-start mb-sm pl-sm">
                <div className="flex items-center gap-sm">
                  <div 
                    onClick={() => handleToggleStatus(task.id, task.status)}
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
                
                {user?.id === task.creator_id && (
                  <button onClick={() => handleDelete(task.id)} className="text-on-surface-variant hover:text-error p-1 rounded-full hover:bg-error-container transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-50 transition-opacity flex items-center justify-center p-md">
          <div className="relative bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
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
                      onChange={e => setFormData({...formData, priority: e.target.value})}
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

                {/* Recurrence (Toggle only for now) */}
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
              </form>
            </div>

            <footer className="flex items-center justify-between px-lg py-md border-t border-outline-variant bg-surface-container-lowest">
              <div className="flex items-center gap-xs text-on-surface-variant">
                <CheckCircle className="w-4 h-4" />
                <span className="font-label-sm text-label-sm">Powered by InsForge</span>
              </div>
              <div className="flex gap-md">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-lg py-sm rounded-lg font-label-md text-label-md text-on-surface border border-outline-variant hover:bg-surface-container-low transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  form="taskForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-lg py-sm rounded-lg font-label-md text-label-md text-on-primary bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Tarea
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
