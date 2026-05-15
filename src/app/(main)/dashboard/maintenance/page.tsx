'use client';

import { useEffect, useState } from 'react';
import { useHousehold } from '@/lib/household-context';
import { useAuth } from '@/lib/auth-context';
import { insforge } from '@/lib/insforge';
import {
  Asset,
  AssetCategory,
  MaintenanceSchedule,
  MaintenanceLog,
  getAssets,
  getAllMaintenanceSchedules,
  getMaintenanceLogs,
  addAsset,
  updateAsset,
  deleteAsset,
  addMaintenanceSchedule,
  updateMaintenanceSchedule,
  deleteMaintenanceSchedule,
  addMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog
} from '@/services/maintenanceService';
import { useToast } from '@/lib/toast-context';
import { getErrorMessage } from '@/lib/errors';

const CATEGORY_ICONS: Record<AssetCategory, string> = {
  APPLIANCE: 'kitchen',
  HVAC: 'ac_unit',
  PLUMBING: 'water_drop',
  ELECTRICAL: 'electrical_services',
  VEHICLE: 'directions_car',
  STRUCTURE: 'home',
  OTHER: 'category'
};

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  APPLIANCE: 'Electrodoméstico',
  HVAC: 'Climatización',
  PLUMBING: 'Plomería',
  ELECTRICAL: 'Eléctrico',
  VEHICLE: 'Vehículo',
  STRUCTURE: 'Estructura',
  OTHER: 'Otro'
};

export default function MaintenanceDashboard() {
  const { activeHousehold, activeRole } = useHousehold();
  const { user } = useAuth();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [schedules, setSchedules] = useState<(MaintenanceSchedule & { asset: Asset })[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToast();

  // Asset Modal State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  
  // Asset Form State
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('APPLIANCE');
  const [assetModel, setAssetModel] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetPurchaseDate, setAssetPurchaseDate] = useState('');
  const [assetWarranty, setAssetWarranty] = useState('');
  const [assetLocation, setAssetLocation] = useState('');

  // Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedAssetForLog, setSelectedAssetForLog] = useState<Asset | null>(null);
  const [logTaskName, setLogTaskName] = useState('');
  const [logPerformedBy, setLogPerformedBy] = useState('');
  const [logCost, setLogCost] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logNotes, setLogNotes] = useState('');

  // View Logs State
  const [isLogsViewModalOpen, setIsLogsViewModalOpen] = useState(false);
  const [logsViewAsset, setLogsViewAsset] = useState<Asset | null>(null);
  const [assetLogs, setAssetLogs] = useState<MaintenanceLog[]>([]);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);
  const [completingSchedule, setCompletingSchedule] = useState<MaintenanceSchedule & { asset: Asset } | null>(null);
  
  // Edit Log Form State
  const [editLogTaskName, setEditLogTaskName] = useState('');
  const [editLogPerformedBy, setEditLogPerformedBy] = useState('');
  const [editLogCost, setEditLogCost] = useState('');
  const [editLogDate, setEditLogDate] = useState('');
  const [editLogNotes, setEditLogNotes] = useState('');

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleAsset, setScheduleAsset] = useState<Asset | null>(null);
  const [scheduleTaskDesc, setScheduleTaskDesc] = useState('');
  const [scheduleFreq, setScheduleFreq] = useState('6');
  const [scheduleNextDue, setScheduleNextDue] = useState('');
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'ASSETS' | 'UPCOMING'>('ASSETS');

  // Permission check: creator OR ADMIN/OWNER
  const canEditOrDelete = (createdBy: string) => {
    if (!user || !activeRole) return false;
    return createdBy === user.id || activeRole === 'OWNER' || activeRole === 'ADMIN';
  };

  useEffect(() => {
    if (!activeHousehold) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [loadedAssets, loadedSchedules] = await Promise.all([
          getAssets(activeHousehold.id),
          getAllMaintenanceSchedules(activeHousehold.id)
        ]);
        setAssets(loadedAssets);
        setSchedules(loadedSchedules);
      } catch (err) {
        console.error('Error loading maintenance data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const setupRealtime = async () => {
      try {
        await insforge.realtime.connect();
        const channelName = `household:${activeHousehold.id}`;
        await insforge.realtime.subscribe(channelName);
        
        insforge.realtime.on('INSERT_assets', () => loadData());
        insforge.realtime.on('UPDATE_assets', () => loadData());
        insforge.realtime.on('DELETE_assets', () => loadData());

        insforge.realtime.on('INSERT_maintenance_schedule', () => loadData());
        insforge.realtime.on('UPDATE_maintenance_schedule', () => loadData());
        insforge.realtime.on('DELETE_maintenance_schedule', () => loadData());

        insforge.realtime.on('INSERT_maintenance_logs', () => loadData());
      } catch (err) {
        console.error('Error setting up realtime:', err);
      }
    };

    setupRealtime();

    return () => {
      insforge.realtime.unsubscribe(`household:${activeHousehold.id}`);
    };
  }, [activeHousehold]);

  // Asset functions
  const openAssetModal = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setAssetName(asset.name);
      setAssetCategory(asset.category);
      setAssetModel(asset.model_number || '');
      setAssetSerial(asset.serial_number || '');
      setAssetPurchaseDate(asset.purchase_date || '');
      setAssetWarranty(asset.warranty_expiry || '');
      setAssetLocation(asset.location || '');
    } else {
      setEditingAsset(null);
      setAssetName('');
      setAssetCategory('APPLIANCE');
      setAssetModel('');
      setAssetSerial('');
      setAssetPurchaseDate('');
      setAssetWarranty('');
      setAssetLocation('');
    }
    setIsAssetModalOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold) return;

    try {
      const payload: Partial<Asset> = {
        household_id: activeHousehold.id,
        name: assetName,
        category: assetCategory,
        model_number: assetModel || null,
        serial_number: assetSerial || null,
        purchase_date: assetPurchaseDate || null,
        warranty_expiry: assetWarranty || null,
        location: assetLocation || null
      };

      if (editingAsset) {
        await updateAsset(editingAsset.id, payload);
      } else {
        await addAsset({ ...payload, created_by: user!.id });
      }
      setIsAssetModalOpen(false);
      success('Activo guardado', 'El activo se ha guardado correctamente.');
    } catch (err: unknown) {
      console.error('Error saving asset:', err);
      showError('Error al guardar el activo', getErrorMessage(err));
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este activo y todo su historial de mantenimiento?')) {
      try {
        await deleteAsset(id);
        success('Activo eliminado', 'El activo se ha eliminado correctamente.');
      } catch (err: unknown) {
        console.error('Error deleting asset:', err);
        showError('Error al eliminar el activo', getErrorMessage(err));
      }
    }
  };

  // Log functions
  const openLogModal = (asset: Asset) => {
    setSelectedAssetForLog(asset);
    setLogTaskName('');
    setLogPerformedBy('');
    setLogCost('');
    setLogDate(new Date().toISOString().split('T')[0]);
    setLogNotes('');
    setIsLogModalOpen(true);
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForLog || !user) return;

    try {
      await addMaintenanceLog({
        asset_id: selectedAssetForLog.id,
        task_name: logTaskName,
        performed_by: logPerformedBy || null,
        cost: logCost ? parseFloat(logCost) : null,
        service_date: logDate || null,
        notes: logNotes || null,
        created_by: user.id
      });

      // If this is completing a schedule, update the schedule's last_performed and next_due
      if (completingSchedule) {
        const serviceDate = logDate || new Date().toISOString().split('T')[0];
        const nextDueDate = new Date(serviceDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + completingSchedule.frequency_months);
        
        await updateMaintenanceSchedule(completingSchedule.id, {
          last_performed: serviceDate,
          next_due: nextDueDate.toISOString()
        });
        
        // Refresh schedules
        const updatedSchedules = await getAllMaintenanceSchedules(activeHousehold.id);
        setSchedules(updatedSchedules);
        
        setCompletingSchedule(null);
      }

      setIsLogModalOpen(false);
      success('Mantenimiento registrado', 'El mantenimiento se ha registrado con éxito.');
    } catch (err: unknown) {
      console.error('Error saving maintenance log:', err);
      showError('Error al registrar el mantenimiento', getErrorMessage(err));
    }
  };

  const handleOpenLogsView = async (asset: Asset) => {
    setLogsViewAsset(asset);
    setIsLogsViewModalOpen(true);
    try {
      const logs = await getMaintenanceLogs(asset.id);
      setAssetLogs(logs);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const openScheduleModal = (asset: Asset) => {
    setScheduleAsset(asset);
    setScheduleTaskDesc('');
    setScheduleFreq('6');
    setScheduleNextDue('');
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleAsset || !user) return;
    try {
      if (editingSchedule) {
        // Update existing schedule
        await updateMaintenanceSchedule(editingSchedule.id, {
          task_description: scheduleTaskDesc,
          frequency_months: parseInt(scheduleFreq, 10),
          next_due: scheduleNextDue || null
        });
        success('Mantenimiento actualizado', 'El mantenimiento se ha actualizado correctamente.');
      } else {
        // Create new schedule
        await addMaintenanceSchedule({
          asset_id: scheduleAsset.id,
          task_description: scheduleTaskDesc,
          frequency_months: parseInt(scheduleFreq, 10),
          next_due: scheduleNextDue || null,
          created_by: user.id
        });
        success('Mantenimiento programado', 'El mantenimiento se ha programado correctamente.');
      }
      setIsScheduleModalOpen(false);
      setEditingSchedule(null);
    } catch (err: unknown) {
      console.error('Error scheduling maintenance:', err);
      showError('Error al programar el mantenimiento', getErrorMessage(err));
    }
  };

  // Open edit schedule modal
  const openScheduleEditModal = (schedule: MaintenanceSchedule & { asset: Asset }) => {
    setEditingSchedule(schedule);
    setScheduleAsset(schedule.asset);
    setScheduleTaskDesc(schedule.task_description);
    setScheduleFreq(schedule.frequency_months.toString());
    setScheduleNextDue(schedule.next_due ? schedule.next_due.split('T')[0] : '');
    setIsScheduleModalOpen(true);
  };

  // Delete schedule
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!window.confirm('¿Eliminar esta programación de mantenimiento?')) return;
    try {
      await deleteMaintenanceSchedule(scheduleId);
      setSchedules(schedules.filter(s => s.id !== scheduleId));
      success('Programación eliminada', 'La programación de mantenimiento se ha eliminado.');
    } catch (err: unknown) {
      console.error('Error deleting schedule:', err);
      showError('Error al eliminar', getErrorMessage(err));
    }
  };

  // Open edit log modal
  const openEditLogModal = (log: MaintenanceLog) => {
    // Need to set a temporary asset for the modal to show
    // We'll use logsViewAsset which is the asset whose logs we're viewing
    setEditingLog(log);
    setEditLogTaskName(log.task_name);
    setEditLogPerformedBy(log.performed_by || '');
    setEditLogCost(log.cost?.toString() || '');
    setEditLogDate(log.service_date ? log.service_date.split('T')[0] : '');
    setEditLogNotes(log.notes || '');
    setIsLogsViewModalOpen(false);
    
    // Set the asset from the logs view so modal can display
    if (logsViewAsset) {
      setSelectedAssetForLog(logsViewAsset);
    }
    setIsLogModalOpen(true);
  };

  // Save edited log
  const handleSaveEditedLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    try {
      await updateMaintenanceLog(editingLog.id, {
        task_name: editLogTaskName,
        performed_by: editLogPerformedBy || null,
        cost: editLogCost ? parseFloat(editLogCost) : null,
        service_date: editLogDate || null,
        notes: editLogNotes || null
      });
      
      // Refresh logs if viewing same asset
      if (logsViewAsset) {
        const logs = await getMaintenanceLogs(logsViewAsset.id);
        setAssetLogs(logs);
      }
      // If we set a temp asset, clear it
      if (editingLog) {
        setSelectedAssetForLog(null);
      }
      setIsLogModalOpen(false);
      setEditingLog(null);
      success('Registro actualizado', 'El mantenimiento se ha actualizado correctamente.');
    } catch (err: unknown) {
      console.error('Error updating log:', err);
      showError('Error al actualizar', getErrorMessage(err));
    }
  };

  // Delete log
  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm('¿Eliminar este registro de mantenimiento?')) return;
    try {
      await deleteMaintenanceLog(logId);
      setAssetLogs(assetLogs.filter(l => l.id !== logId));
      success('Registro eliminado', 'El mantenimiento se ha eliminado.');
    } catch (err: unknown) {
      console.error('Error deleting log:', err);
      showError('Error al eliminar', getErrorMessage(err));
    }
  };

  if (!activeHousehold || !user) {
    return <div className="p-margin">Cargando contexto del hogar...</div>;
  }

  // Dashboard Stats
  const upcomingSchedules = schedules.filter(s => s.next_due && new Date(s.next_due) <= new Date(new Date().setMonth(new Date().getMonth() + 1)));
  const overdueSchedules = schedules.filter(s => s.next_due && new Date(s.next_due) < new Date());

  return (
    <div className="flex flex-col gap-xl w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Mantenimiento</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Gestión de activos, equipos y mantenimiento preventivo
          </p>
        </div>
        <button 
          onClick={() => openAssetModal()}
          className="w-full sm:w-auto px-lg py-sm rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm"
        >
          <span className="material-symbols-outlined">add</span>
          Agregar Activo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm">
          <div className="flex items-center gap-sm mb-2 text-on-surface-variant">
            <span className="material-symbols-outlined">home_repair_service</span>
            <span className="font-label-md text-label-md">Total de Activos</span>
          </div>
          <div className="font-h2 text-h2 text-on-surface">{assets.length}</div>
        </div>
        
        <div className="bg-tertiary-container rounded-xl p-lg border border-tertiary shadow-sm">
          <div className="flex items-center gap-sm mb-2 text-on-tertiary-container">
            <span className="material-symbols-outlined">event_upcoming</span>
            <span className="font-label-md text-label-md">Próximos a Vencer (30 días)</span>
          </div>
          <div className="font-h2 text-h2 text-tertiary">{upcomingSchedules.length}</div>
        </div>

        <div className="bg-error-container rounded-xl p-lg border border-error shadow-sm">
          <div className="flex items-center gap-sm mb-2 text-on-error-container">
            <span className="material-symbols-outlined">warning</span>
            <span className="font-label-md text-label-md">Mantenimientos Atrasados</span>
          </div>
          <div className="font-h2 text-h2 text-error">{overdueSchedules.length}</div>
        </div>
      </div>

      <div className="flex border-b border-outline-variant mb-4">
        <button 
          onClick={() => setActiveTab('ASSETS')}
          className={`px-4 py-3 font-label-md text-label-md border-b-2 transition-colors ${activeTab === 'ASSETS' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
        >
          Mis Activos
        </button>
        <button 
          onClick={() => setActiveTab('UPCOMING')}
          className={`px-4 py-3 font-label-md text-label-md border-b-2 transition-colors flex gap-2 items-center ${activeTab === 'UPCOMING' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
        >
          Agenda de Mantenimiento
          {upcomingSchedules.length > 0 && (
            <span className="bg-tertiary text-on-tertiary text-xs px-2 py-0.5 rounded-full">{upcomingSchedules.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'ASSETS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {loading && assets.length === 0 ? (
            <div className="col-span-full flex justify-center p-xl">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
            </div>
          ) : assets.length === 0 ? (
            <div className="col-span-full bg-surface-container-lowest p-xl rounded-xl border border-outline-variant text-center text-on-surface-variant font-body-md shadow-sm">
              No tienes activos registrados. Agrega tus equipos principales para empezar a hacer seguimiento.
            </div>
          ) : (
            assets.map(asset => (
              <div key={asset.id} className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm flex flex-col gap-md transition-shadow hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-sm">
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">{CATEGORY_ICONS[asset.category]}</span>
                    </div>
                    <div>
                      <h3 className="font-h3 text-h3 text-on-surface">{asset.name}</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{CATEGORY_LABELS[asset.category]}</p>
                    </div>
                  </div>
                  <div className="flex">
                    {canEditOrDelete(asset.created_by) && (
                      <>
                        <button onClick={() => openAssetModal(asset)} className="text-on-surface-variant hover:text-primary transition-colors p-1" title="Editar Activo">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button onClick={() => handleDeleteAsset(asset.id)} className="text-on-surface-variant hover:text-error transition-colors p-1" title="Eliminar Activo">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 bg-surface-container-low p-sm rounded-lg font-body-sm text-body-sm">
                  <div className="flex flex-col">
                    <span className="text-on-surface-variant">Ubicación</span>
                    <span className="text-on-surface font-medium">{asset.location || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-on-surface-variant">Marca/Modelo</span>
                    <span className="text-on-surface font-medium">{asset.model_number || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-on-surface-variant">Garantía hasta</span>
                    <span className="text-on-surface font-medium">{asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : '-'}</span>
                  </div>
                </div>

                <div className="mt-auto pt-2 border-t border-outline-variant grid grid-cols-2 lg:grid-cols-3 gap-2">
                  <button 
                    onClick={() => openLogModal(asset)}
                    className="py-2 bg-surface-container text-primary font-label-md text-label-md rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1 col-span-1 lg:col-span-1 text-xs"
                    title="Registrar"
                  >
                    <span className="material-symbols-outlined text-[16px]">build</span>
                    <span className="hidden sm:inline">Registrar</span>
                  </button>
                  <button 
                    onClick={() => openScheduleModal(asset)}
                    className="py-2 bg-surface-container text-tertiary font-label-md text-label-md rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1 col-span-1 lg:col-span-1 text-xs"
                    title="Programar"
                  >
                    <span className="material-symbols-outlined text-[16px]">event</span>
                    <span className="hidden sm:inline">Programar</span>
                  </button>
                  <button 
                    onClick={() => handleOpenLogsView(asset)}
                    className="py-2 bg-surface-container text-secondary font-label-md text-label-md rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1 col-span-2 lg:col-span-1 text-xs"
                    title="Historial"
                  >
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    <span className="hidden sm:inline">Historial</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'UPCOMING' && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          {loading && schedules.length === 0 ? (
            <div className="flex justify-center p-xl">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-xl text-center text-on-surface-variant font-body-md">
              No hay mantenimientos programados.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-label-md text-label-md text-on-surface-variant">
                  <th className="p-md font-medium">Activo</th>
                  <th className="p-md font-medium">Tarea</th>
                  <th className="p-md font-medium">Frecuencia</th>
                  <th className="p-md font-medium">Último Servicio</th>
                  <th className="p-md font-medium">Próximo Vencimiento</th>
                  <th className="p-md font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant">
                {schedules.map(schedule => {
                  const isOverdue = schedule.next_due && new Date(schedule.next_due) < new Date();
                  const isUpcoming = schedule.next_due && new Date(schedule.next_due) <= new Date(new Date().setMonth(new Date().getMonth() + 1));
                  
                  return (
                    <tr key={schedule.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="p-md">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{CATEGORY_ICONS[schedule.asset.category]}</span>
                          <span className="font-medium text-on-surface">{schedule.asset.name}</span>
                        </div>
                      </td>
                      <td className="p-md">{schedule.task_description}</td>
                      <td className="p-md">{schedule.frequency_months} meses</td>
                      <td className="p-md text-on-surface-variant">
                        {schedule.last_performed ? new Date(schedule.last_performed).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-md">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          isOverdue ? 'bg-error-container text-error' : 
                          isUpcoming ? 'bg-tertiary-container text-tertiary' : 
                          'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          {isOverdue && <span className="material-symbols-outlined text-[14px]">warning</span>}
                          {schedule.next_due ? new Date(schedule.next_due).toLocaleDateString() : '-'}
                        </span>
                      </td>
                      <td className="p-md text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEditOrDelete(schedule.created_by) && (
                            <>
                              <button 
                                onClick={() => openScheduleEditModal(schedule)}
                                className="text-on-surface-variant hover:text-primary p-1 rounded hover:bg-surface-container transition-colors"
                                title="Editar programación"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="text-on-surface-variant hover:text-error p-1 rounded hover:bg-error-container transition-colors"
                                title="Eliminar programación"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => {
                              setLogTaskName(schedule.task_description);
                              setCompletingSchedule(schedule);
                              openLogModal(schedule.asset);
                            }} 
                            className="px-3 py-1 bg-primary text-on-primary rounded-md font-label-sm text-label-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
                          >
                            Completar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Asset Modal */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pb-20 md:pb-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low shrink-0">
              <h2 className="font-h3 text-h3 text-on-surface font-semibold flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">{editingAsset ? 'edit' : 'home_repair_service'}</span>
                {editingAsset ? 'Editar Activo' : 'Agregar Activo'}
              </h2>
              <button 
                onClick={() => setIsAssetModalOpen(false)}
                className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="overflow-y-auto">
              <form id="assetForm" onSubmit={handleSaveAsset} className="p-lg flex flex-col gap-md">
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-on-surface font-medium">Nombre del Activo *</label>
                  <input
                    type="text"
                    required
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Ej. Aire Acondicionado, Lavarropas"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-on-surface font-medium">Categoría</label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value as AssetCategory)}
                    className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-md">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <label className="font-label-md text-on-surface font-medium">Marca / Modelo</label>
                    <input
                      type="text"
                      value={assetModel}
                      onChange={(e) => setAssetModel(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <label className="font-label-md text-on-surface font-medium">Ubicación</label>
                    <input
                      type="text"
                      value={assetLocation}
                      onChange={(e) => setAssetLocation(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-on-surface font-medium">Número de Serie</label>
                  <input
                    type="text"
                    value={assetSerial}
                    onChange={(e) => setAssetSerial(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-md">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <label className="font-label-md text-on-surface font-medium">Fecha de Compra</label>
                    <input
                      type="date"
                      value={assetPurchaseDate}
                      onChange={(e) => setAssetPurchaseDate(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <label className="font-label-md text-on-surface font-medium">Vencimiento Garantía</label>
                    <input
                      type="date"
                      value={assetWarranty}
                      onChange={(e) => setAssetWarranty(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-lg border-t border-outline-variant flex flex-col-reverse sm:flex-row justify-end gap-sm sm:gap-md shrink-0 bg-surface-container-lowest">
              <button 
                type="button" 
                onClick={() => setIsAssetModalOpen(false)}
                className="w-full sm:w-auto px-lg py-sm rounded-lg font-label-md text-label-md text-primary border border-outline-variant hover:bg-primary-container transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="assetForm"
                className="w-full sm:w-auto px-lg py-sm rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Modal */}
      {isLogModalOpen && selectedAssetForLog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pb-20 md:pb-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low shrink-0">
              <h2 className="font-h3 text-h3 text-on-surface font-semibold flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">{editingLog ? 'edit' : 'build'}</span>
                {editingLog ? 'Editar Mantenimiento' : 'Registrar Mantenimiento'}
              </h2>
              <button 
                onClick={() => { setIsLogModalOpen(false); setEditingLog(null); }}
                className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="overflow-y-auto">
              <form id="logForm" onSubmit={editingLog ? handleSaveEditedLog : handleSaveLog} className="p-lg flex flex-col gap-md">
                <div className="bg-surface-container-low p-sm rounded-lg flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">{CATEGORY_ICONS[selectedAssetForLog.category]}</span>
                  <div className="font-medium text-on-surface">{selectedAssetForLog.name}</div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-on-surface font-medium">Tarea Realizada *</label>
                  <input
                    type="text"
                    required
                    value={editingLog ? editLogTaskName : logTaskName}
                    onChange={(e) => editingLog ? setEditLogTaskName(e.target.value) : setLogTaskName(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Ej. Cambio de filtros, Revisión general"
                  />
                </div>

                <div className="flex gap-md">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <label className="font-label-md text-on-surface font-medium">Realizado Por</label>
                    <input
                      type="text"
                      value={editingLog ? editLogPerformedBy : logPerformedBy}
                      onChange={(e) => editingLog ? setEditLogPerformedBy(e.target.value) : setLogPerformedBy(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      placeholder="Ej. Juan Pérez (Técnico)"
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-1/3">
                    <label className="font-label-md text-on-surface font-medium">Costo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingLog ? editLogCost : logCost}
                        onChange={(e) => editingLog ? setEditLogCost(e.target.value) : setLogCost(e.target.value)}
                        className="w-full bg-surface rounded-lg border border-outline-variant pl-7 pr-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-on-surface font-medium">Fecha del Servicio</label>
                  <input
                    type="date"
                    required
                    value={editingLog ? editLogDate : logDate}
                    onChange={(e) => editingLog ? setEditLogDate(e.target.value) : setLogDate(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-on-surface font-medium">Notas Adicionales</label>
                  <textarea
                    rows={3}
                    value={editingLog ? editLogNotes : logNotes}
                    onChange={(e) => editingLog ? setEditLogNotes(e.target.value) : setLogNotes(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                    placeholder="Detalles sobre el mantenimiento, repuestos usados..."
                  />
                </div>
              </form>
            </div>
            
            <div className="p-lg border-t border-outline-variant flex justify-end gap-md shrink-0 bg-surface-container-lowest">
              <button 
                type="button" 
                onClick={() => { 
                  setIsLogModalOpen(false); 
                  setEditingLog(null);
                  if (editingLog) {
                    setSelectedAssetForLog(null);
                  }
                }}
                className="px-lg py-sm rounded-lg font-label-md text-label-md text-primary hover:bg-primary-container transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="logForm"
                className="px-lg py-sm rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
              >
                {editingLog ? 'Guardar Cambios' : 'Guardar Registro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs View Modal */}
      {isLogsViewModalOpen && logsViewAsset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pb-20 md:pb-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low shrink-0">
              <h2 className="font-h3 text-h3 text-on-surface font-semibold flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary">history</span>
                Historial de {logsViewAsset.name}
              </h2>
              <button 
                onClick={() => setIsLogsViewModalOpen(false)}
                className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="overflow-y-auto p-md flex flex-col gap-sm bg-surface">
              {assetLogs.length === 0 ? (
                <div className="text-center p-xl text-on-surface-variant font-body-md">
                  No hay mantenimientos registrados.
                </div>
              ) : (
                assetLogs.map(log => (
                  <div key={log.id} className="bg-surface-container-lowest p-md rounded-lg border border-outline-variant relative group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-label-lg text-on-surface font-semibold">{log.task_name}</span>
                      <div className="flex items-center gap-2">
                        {canEditOrDelete(log.created_by) && (
                          <>
                            <button 
                              onClick={() => openEditLogModal(log)}
                              className="text-on-surface-variant hover:text-primary p-1 rounded hover:bg-surface-container transition-colors"
                              title="Editar"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteLog(log.id)}
                              className="text-on-surface-variant hover:text-error p-1 rounded hover:bg-error-container transition-colors"
                              title="Eliminar"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </>
                        )}
                        <span className="text-on-surface-variant text-sm font-medium">{log.service_date ? new Date(log.service_date).toLocaleDateString() : '-'}</span>
                      </div>
                    </div>
                    {log.performed_by && <div className="text-sm text-on-surface-variant mb-1">Realizado por: <span className="text-on-surface">{log.performed_by}</span></div>}
                    {log.cost !== null && <div className="text-sm text-on-surface-variant mb-1">Costo: <span className="text-on-surface">${log.cost}</span></div>}
                    {log.notes && <div className="text-sm text-on-surface bg-surface-container-low p-2 rounded mt-2">{log.notes}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && scheduleAsset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pb-20 md:pb-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low shrink-0">
              <h2 className="font-h3 text-h3 text-on-surface font-semibold flex items-center gap-sm">
                <span className="material-symbols-outlined text-tertiary">{editingSchedule ? 'edit' : 'event'}</span>
                {editingSchedule ? 'Editar Mantenimiento' : 'Programar Mantenimiento'}
              </h2>
              <button 
                onClick={() => { setIsScheduleModalOpen(false); setEditingSchedule(null); }}
                className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="overflow-y-auto">
              <form id="scheduleForm" onSubmit={handleSaveSchedule} className="p-lg flex flex-col gap-md">
                <div className="bg-surface-container-low p-sm rounded-lg flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">{CATEGORY_ICONS[scheduleAsset.category]}</span>
                  <div className="font-medium text-on-surface">{scheduleAsset.name}</div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-on-surface font-medium">Descripción de la Tarea *</label>
                  <input
                    type="text"
                    required
                    value={scheduleTaskDesc}
                    onChange={(e) => setScheduleTaskDesc(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Ej. Limpieza de filtros mensual"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-on-surface font-medium">Frecuencia (Meses) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={scheduleFreq}
                    onChange={(e) => setScheduleFreq(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-on-surface font-medium">Próximo Vencimiento</label>
                  <input
                    type="date"
                    value={scheduleNextDue}
                    onChange={(e) => setScheduleNextDue(e.target.value)}
                    className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-lg border-t border-outline-variant flex justify-end gap-md shrink-0 bg-surface-container-lowest">
              <button 
                type="button" 
                onClick={() => { setIsScheduleModalOpen(false); setEditingSchedule(null); }}
                className="px-lg py-sm rounded-lg font-label-md text-label-md text-primary hover:bg-primary-container transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="scheduleForm"
                className="px-lg py-sm rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
              >
                {editingSchedule ? 'Guardar Cambios' : 'Programar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
