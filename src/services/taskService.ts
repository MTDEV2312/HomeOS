import { insforge } from '@/lib/insforge';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Task {
  id: string;
  household_id: string;
  creator_id: string;
  assigned_to?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  is_recurring: boolean;
  recurrence_rule?: string;
  created_at: string;
  updated_at: string;
  // Extended fields via join (if needed, e.g. assignee details)
  assignee?: { name: string; email: string };
}

export const getTasks = async (householdId: string): Promise<Task[]> => {
  const { data, error } = await insforge.database
    .from('tasks')
    .select(`
      *,
      assigned_to:users(name, email)
    `)
    .eq('household_id', householdId)
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  // Handle data format from join if users table exists in public. 
  // If not, we might need a custom RPC or handle auth.users join properly.
  // We'll return just the data for now.
  return data as Task[];
};

export const createTask = async (
  householdId: string, 
  creatorId: string, 
  taskData: Partial<Task>
): Promise<Task> => {
  const { data, error } = await insforge.database
    .from('tasks')
    .insert([
      {
        household_id: householdId,
        creator_id: creatorId,
        assigned_to: taskData.assigned_to || null,
        title: taskData.title,
        description: taskData.description || null,
        due_date: taskData.due_date || null,
        priority: taskData.priority || 'MEDIUM',
        status: taskData.status || 'PENDING',
        is_recurring: taskData.is_recurring || false,
        recurrence_rule: taskData.recurrence_rule || null
      }
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as Task;
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<Task> => {
  const { data, error } = await insforge.database
    .from('tasks')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as Task;
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
  const { data, error } = await insforge.database
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as Task;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const { error } = await insforge.database
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    throw new Error(error.message);
  }
};
