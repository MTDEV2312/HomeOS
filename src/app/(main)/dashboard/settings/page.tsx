"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState((user?.profile?.name as string) || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await updateProfile({ name });
    
    setLoading(false);
    if (error) {
      setMessage('Error al actualizar el perfil.');
    } else {
      setMessage('Perfil actualizado con éxito.');
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center gap-sm">
        <span className="material-symbols-outlined text-[32px] text-primary">settings</span>
        <h1 className="font-h2 text-h2 text-on-surface">Configuración</h1>
      </div>

      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-lg max-w-2xl">
        <h2 className="font-h3 text-h3 text-on-surface mb-md">Perfil de Usuario</h2>
        
        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes('Error') ? 'bg-red-100/10 text-red-400 border border-red-500/50' : 'bg-green-100/10 text-green-400 border border-green-500/50'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpdate} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface">Correo Electrónico</label>
            <input 
              type="email" 
              value={user?.email || ''} 
              disabled 
              className="w-full pl-md pr-md py-sm rounded-lg border border-outline-variant bg-surface-container-highest text-on-surface-variant cursor-not-allowed font-body-md text-body-md" 
            />
            <p className="text-[12px] text-on-surface-variant">El correo no puede ser modificado por seguridad.</p>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface">Nombre Completo</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full pl-md pr-md py-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md" 
            />
          </div>

          <div className="pt-sm border-t border-outline-variant flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary text-on-primary font-label-sm text-label-sm py-sm px-lg rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
