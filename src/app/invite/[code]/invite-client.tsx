"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useHousehold } from '@/lib/household-context';
import { joinHousehold } from '@/services/householdService';
import { Home, Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';

export default function InviteClient() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { refreshHousehold, switchHousehold } = useHousehold();

  const code = typeof params.code === 'string' ? params.code : '';

  const [status, setStatus] = useState<'loading' | 'ready' | 'joining' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to login with a return URL
      const returnUrl = `/invite/${code}`;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // User is authenticated, show the join prompt
    setStatus('ready');
  }, [user, authLoading, code, router]);

  const handleJoin = async () => {
    if (!user || !code) return;
    try {
      setStatus('joining');
      const household = await joinHousehold(code);
      await refreshHousehold();
      switchHousehold(household.id);
      setStatus('success');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, 'Error al unirse al hogar.'));
      setStatus('error');
    }
  };

  if (status === 'loading' || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-md">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="font-body-md text-body-md text-on-surface-variant">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-md">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_20px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Header */}
        <div className="bg-primary-container p-xl flex flex-col items-center gap-md text-center">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
            <Home className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="font-h1 text-h1 text-on-primary-container">Invitación a un Hogar en HomeOS</h1>
            <h2 className="text-body-md text-on-primary-container/80 font-medium mt-xs">Únete a un hogar familiar</h2>
            <p className="font-body-md text-body-md text-on-primary-container/70 mt-xs">
              Te invitaron a unirte a un hogar en HomeOS
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-xl">
          {status === 'ready' && (
            <div className="flex flex-col items-center gap-lg text-center">
              <div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-sm">
                  Código de invitación:
                </p>
                <p className="font-mono text-h3 font-bold tracking-widest text-primary bg-surface-container-low rounded-lg px-lg py-md border border-outline-variant">
                  {code.toUpperCase()}
                </p>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">
                ¿Querés unirte a este hogar como <strong className="text-on-surface">{user?.profile?.name || user?.email}</strong>?
              </p>
              <button
                onClick={handleJoin}
                className="w-full bg-primary text-on-primary font-label-md text-label-md py-md rounded-lg hover:bg-primary/90 transition-colors flex justify-center items-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Unirme al Hogar
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          {status === 'joining' && (
            <div className="flex flex-col items-center gap-md py-lg">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="font-body-md text-body-md text-on-surface-variant">Uniéndote al hogar...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-md py-lg text-center">
              <CheckCircle className="w-12 h-12 text-primary" />
              <div>
                <p className="font-h3 text-h3 text-on-surface">¡Te uniste correctamente!</p>
                <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                  Redirigiendo al dashboard...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-lg py-lg text-center">
              <XCircle className="w-12 h-12 text-error" />
              <div>
                <p className="font-h3 text-h3 text-on-surface">No se pudo unir</p>
                <p className="font-body-md text-body-md text-error mt-xs">{errorMessage}</p>
              </div>
              <div className="flex gap-md w-full">
                <button
                  onClick={() => setStatus('ready')}
                  className="flex-1 bg-surface-container-high text-on-surface font-label-md text-label-md py-md rounded-lg border border-outline-variant hover:bg-surface-variant transition-colors"
                >
                  Reintentar
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 bg-primary text-on-primary font-label-md text-label-md py-md rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Ir al Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
