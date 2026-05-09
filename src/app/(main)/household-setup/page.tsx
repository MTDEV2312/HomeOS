"use client";

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useHousehold } from '@/lib/household-context';
import { createHousehold, joinHousehold } from '@/services/householdService';
import { householdSchema, inviteCodeSchema, getFieldErrors } from '@/lib/validations';
import { Home, UserPlus, ShieldCheck, PlusCircle, LogIn, Loader2 } from 'lucide-react';

export default function HouseholdSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshHousehold, switchHousehold } = useHousehold();
  
  const [createData, setCreateData] = useState({ name: '' });
  const [joinData, setJoinData] = useState({ code: '' });
  
  const [loadingType, setLoadingType] = useState<'CREATE' | 'JOIN' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const handleCreateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setCreateData({ name: value });
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const handleJoinChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setJoinData({ code: value.toUpperCase() });
    if (errors.code) {
      setErrors((prev) => ({ ...prev, code: '' }));
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validationErrors = getFieldErrors(householdSchema, createData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoadingType('CREATE');
      setError('');
      const newHousehold = await createHousehold(createData.name.trim(), user.id);
      await refreshHousehold();
      switchHousehold(newHousehold.id);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al crear el hogar');
    } finally {
      setLoadingType(null);
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validationErrors = getFieldErrors(inviteCodeSchema, joinData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoadingType('JOIN');
      setError('');
      const joinedHousehold = await joinHousehold(joinData.code.trim(), user.id);
      await refreshHousehold();
      switchHousehold(joinedHousehold.id);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al unirse al hogar');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-md min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-lg bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant overflow-hidden">
        
        <div className="flex-1 p-xl flex flex-col justify-center bg-surface-container-low border-b md:border-b-0 md:border-r border-outline-variant relative">
          <div className="mb-xl">
            <h1 className="font-h1 text-h1 text-primary mb-sm">HomeOS</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Tu santuario digital te espera.</p>
          </div>
          
          <div className="space-y-lg">
            <div className="flex items-start gap-md">
              <div className="text-primary bg-primary-fixed p-sm rounded-full mt-xs">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-h3 text-h3 text-on-surface mb-xs">Crea un Espacio</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Configura un nuevo hogar e invita a tu familia o compañeros de piso.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-md">
              <div className="text-primary bg-primary-fixed p-sm rounded-full mt-xs">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-h3 text-h3 text-on-surface mb-xs">Únete a uno Existente</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">¿Tienes un código de invitación? Úsalo para unirte sin problemas.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-xl">
            <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
              <ShieldCheck className="w-4 h-4" />
              Powered by InsForge
            </p>
          </div>
        </div>

        <div className="flex-1 p-xl flex flex-col gap-xl">
          {error && (
            <div className="bg-error-container text-on-error-container p-sm rounded font-body-md text-body-md">
              {error}
            </div>
          )}

          <div className="bg-surface rounded-lg p-lg border border-outline-variant hover:border-primary transition-colors duration-200">
            <h2 className="font-h3 text-h3 text-on-surface mb-md flex items-center gap-sm">
              <PlusCircle className="w-6 h-6 text-primary" />
              Crea un Hogar
            </h2>
            <form className="space-y-md" onSubmit={handleCreate}>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs" htmlFor="householdName">
                  Nombre del Hogar
                </label>
                <input 
                  className={`w-full rounded bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-primary font-body-md text-body-md placeholder-on-surface-variant ${errors.name ? 'border-error border-2' : 'border-outline-variant border'}`}
                  id="householdName" 
                  placeholder="ej. Residencia Smith" 
                  type="text"
                  value={createData.name}
                  onChange={handleCreateChange}
                  disabled={loadingType !== null}
                />
                {errors.name && (
                  <p className="text-error text-xs mt-xs">{errors.name}</p>
                )}
              </div>
              <button 
                className="w-full bg-primary text-on-primary font-label-md text-label-md py-md rounded hover:bg-primary-container transition-colors duration-200 flex justify-center items-center gap-2 disabled:opacity-50" 
                type="submit"
                disabled={loadingType !== null}
              >
                {loadingType === 'CREATE' && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear
              </button>
            </form>
          </div>

          <div className="relative flex py-sm items-center">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="flex-shrink-0 mx-md text-on-surface-variant font-label-md text-label-md">o</span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>

          <div className="bg-surface rounded-lg p-lg border border-outline-variant hover:border-primary transition-colors duration-200">
            <h2 className="font-h3 text-h3 text-on-surface mb-md flex items-center gap-sm">
              <LogIn className="w-6 h-6 text-primary" />
              Únete a un Hogar
            </h2>
            <form className="space-y-md" onSubmit={handleJoin}>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs" htmlFor="inviteCode">
                  Código de Invitación
                </label>
                <input 
                  className={`w-full rounded bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-primary font-body-md text-body-md placeholder-on-surface-variant tracking-widest uppercase ${errors.code ? 'border-error border-2' : 'border-outline-variant border'}`}
                  id="inviteCode" 
                  maxLength={8} 
                  placeholder="8-LETRAS" 
                  type="text"
                  value={joinData.code}
                  onChange={handleJoinChange}
                  disabled={loadingType !== null}
                />
                {errors.code && (
                  <p className="text-error text-xs mt-xs">{errors.code}</p>
                )}
                <p className="mt-xs font-label-sm text-label-sm text-on-surface-variant">Pídele el código a un administrador del hogar.</p>
              </div>
              <button 
                className="w-full bg-surface-container-high text-on-surface font-label-md text-label-md py-md rounded border border-outline-variant hover:bg-surface-variant transition-colors duration-200 flex justify-center items-center gap-2 disabled:opacity-50" 
                type="submit"
                disabled={loadingType !== null}
              >
                {loadingType === 'JOIN' && <Loader2 className="w-4 h-4 animate-spin" />}
                Unirse
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}