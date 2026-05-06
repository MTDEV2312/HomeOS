import React from 'react';

export default function DashboardPage() {
  return (
    <>
      {/* Welcome Section */}
      <div className="flex flex-col gap-sm mb-md">
        <h1 className="font-h1 text-h1 text-on-background">Bienvenido a HomeOS</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Aquí tienes un resumen del estado de tu hogar.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        
        {/* Widget 1: Quick Status */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col gap-md col-span-1 md:col-span-2">
          <div className="flex justify-between items-center">
            <h2 className="font-h3 text-h3 text-on-surface">Estado del Hogar</h2>
            <span className="material-symbols-outlined text-secondary">info</span>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div className="bg-surface-container-low p-md rounded-lg flex flex-col gap-xs">
              <span className="font-label-md text-label-md text-on-surface-variant">Tareas Pendientes</span>
              <span className="font-h2 text-h2 font-bold text-primary">12</span>
            </div>
            <div className="bg-surface-container-low p-md rounded-lg flex flex-col gap-xs">
              <span className="font-label-md text-label-md text-on-surface-variant">Poco Inventario</span>
              <span className="font-h2 text-h2 font-bold text-error">3</span>
            </div>
          </div>
        </div>

        {/* Widget 2: Quick Action */}
        <div className="bg-primary-container rounded-xl border border-outline-variant p-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-center items-center gap-md text-on-primary-container col-span-1 cursor-pointer hover:bg-surface-tint transition-colors">
          <span className="material-symbols-outlined text-4xl" style={{ fontSize: '48px' }}>add_circle</span>
          <span className="font-h3 text-h3 font-bold">Nueva Tarea</span>
        </div>

        {/* Widget 3: Recent Activity */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col gap-md col-span-1 md:col-span-3">
          <h2 className="font-h3 text-h3 text-on-surface">Actividad Reciente</h2>
          <div className="flex flex-col gap-sm">
            
            <div className="flex items-center gap-md p-sm border-b border-outline-variant pb-md">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined">shopping_cart</span>
              </div>
              <div className="flex-1">
                <div className="font-body-md text-body-md text-on-surface font-medium">Lista de compras actualizada</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Hace 2 horas</div>
              </div>
            </div>

            <div className="flex items-center gap-md p-sm border-b border-outline-variant pb-md">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined">build</span>
              </div>
              <div className="flex-1">
                <div className="font-body-md text-body-md text-on-surface font-medium">Solicitud de mantenimiento cerrada</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Ayer</div>
              </div>
            </div>

            <div className="flex items-center gap-md p-sm">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div className="flex-1">
                <div className="font-body-md text-body-md text-on-surface font-medium">Factura de servicios pagada</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Hace 2 días</div>
              </div>
            </div>

          </div>
        </div>
        
      </div>
    </>
  );
}
