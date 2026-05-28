import { insforge } from '@/lib/insforge';

export type AssetCategory = 'APPLIANCE' | 'HVAC' | 'PLUMBING' | 'ELECTRICAL' | 'VEHICLE' | 'STRUCTURE' | 'OTHER';

export type Asset = {
  id: string;
  household_id: string;
  name: string;
  category: AssetCategory;
  model_number: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  location: string | null;
  manual_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
};

export type MaintenanceLog = {
  id: string;
  asset_id: string;
  task_name: string;
  performed_by: string | null;
  service_date: string | null;
  cost: number | null;
  notes: string | null;
  next_service_date: string | null;
  created_at: string;
  created_by: string;
};

export type MaintenanceSchedule = {
  id: string;
  asset_id: string;
  task_description: string;
  frequency_months: number;
  last_performed: string | null;
  next_due: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
};

type ScheduleWithAsset = MaintenanceSchedule & { asset: Asset };

// --- Assets ---

export const getAssets = async (householdId: string): Promise<Asset[]> => {
  const { data, error } = await insforge.database
    .from('assets')
    .select('*')
    .eq('household_id', householdId)
    .order('name');
  if (error) throw error;
  return data as Asset[];
};

export const addAsset = async (payload: Partial<Asset>): Promise<Asset> => {
  const { data, error } = await insforge.database
    .from('assets')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data as Asset;
};

export const updateAsset = async (id: string, payload: Partial<Asset>): Promise<Asset> => {
  const { data, error } = await insforge.database
    .from('assets')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Asset;
};

export const deleteAsset = async (id: string): Promise<void> => {
  const { error } = await insforge.database.from('assets').delete().eq('id', id);
  if (error) throw error;
};

// --- Maintenance Logs ---

export const getMaintenanceLogs = async (assetId: string): Promise<MaintenanceLog[]> => {
  const { data, error } = await insforge.database
    .from('maintenance_logs')
    .select('*')
    .eq('asset_id', assetId)
    .order('service_date', { ascending: false });
  if (error) throw error;
  return data as MaintenanceLog[];
};

export const addMaintenanceLog = async (payload: Partial<MaintenanceLog>): Promise<MaintenanceLog> => {
  const { data, error } = await insforge.database
    .from('maintenance_logs')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data as MaintenanceLog;
};

export const deleteMaintenanceLog = async (id: string): Promise<void> => {
  const { error } = await insforge.database.from('maintenance_logs').delete().eq('id', id);
  if (error) throw error;
};

export const updateMaintenanceLog = async (id: string, payload: Partial<MaintenanceLog>): Promise<MaintenanceLog> => {
  // Filter out undefined values and non-updatable fields
  const updates: Partial<MaintenanceLog> = {};
  if (payload.task_name !== undefined) updates.task_name = payload.task_name;
  if (payload.performed_by !== undefined) updates.performed_by = payload.performed_by;
  if (payload.service_date !== undefined) updates.service_date = payload.service_date;
  if (payload.cost !== undefined) updates.cost = payload.cost;
  if (payload.notes !== undefined) updates.notes = payload.notes;
  if (payload.next_service_date !== undefined) updates.next_service_date = payload.next_service_date;
  
  const { data, error } = await insforge.database
    .from('maintenance_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    throw new Error(error.message || 'Error al actualizar el registro');
  }
  return data as MaintenanceLog;
};

// --- Maintenance Schedule ---

export const getMaintenanceSchedules = async (assetId: string): Promise<MaintenanceSchedule[]> => {
  const { data, error } = await insforge.database
    .from('maintenance_schedule')
    .select('*')
    .eq('asset_id', assetId)
    .order('next_due', { ascending: true });
  if (error) throw error;
  return data as MaintenanceSchedule[];
};

export const getAllMaintenanceSchedules = async (householdId: string): Promise<ScheduleWithAsset[]> => {
  // Fetch schedules joining with assets and filtering on household_id on the database server
  const { data, error } = await insforge.database
    .from('maintenance_schedule')
    .select('*, asset:assets!inner(*)')
    .eq('asset.household_id', householdId)
    .order('next_due', { ascending: true });
    
  if (error) throw error;
  
  return data as ScheduleWithAsset[];
};

export const addMaintenanceSchedule = async (payload: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> => {
  const { data, error } = await insforge.database
    .from('maintenance_schedule')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data as MaintenanceSchedule;
};

export const updateMaintenanceSchedule = async (id: string, payload: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> => {
  const { data, error } = await insforge.database
    .from('maintenance_schedule')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as MaintenanceSchedule;
};

export const deleteMaintenanceSchedule = async (id: string): Promise<void> => {
  const { error } = await insforge.database.from('maintenance_schedule').delete().eq('id', id);
  if (error) throw error;
};
