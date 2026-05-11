"use client";

import { useState, Suspense, type FormEvent, type ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

type ResetMode = 'verify-code' | 'new-password';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';
  const { exchangeResetPasswordToken, resetPassword } = useAuth();
  
  const [mode, setMode] = useState<ResetMode>('verify-code');
  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!code || code.length !== 6) {
      setError('Por favor ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);

    const { error: exchangeError, token } = await exchangeResetPasswordToken(email, code);

    if (exchangeError) {
      setError(exchangeError.message || 'Código inválido o expirado');
      setLoading(false);
    } else if (token) {
      setResetToken(token);
      setMode('new-password');
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!resetToken) {
      setError('Sesión expirada. Por favor inicia el proceso de nuevo.');
      setMode('verify-code');
      setLoading(false);
      return;
    }

    setLoading(true);

    const { error: resetError } = await resetPassword(newPassword, resetToken);

    if (resetError) {
      setError(resetError.message || 'Error al restablecer la contraseña');
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-surface-dim min-h-screen flex items-center justify-center p-md text-on-surface font-body-md">
        <div className="w-full max-w-md bg-surface-container-low rounded-xl shadow-[0px_4px_30px_rgba(0,0,0,0.3)] border border-outline-variant p-lg md:p-xl flex flex-col gap-lg">
          <div className="text-center flex flex-col items-center gap-sm">
            <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <h1 className="font-h1 text-h1 text-primary">Contraseña Restablecida</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Tu contraseña ha sido actualizada exitosamente
            </p>
          </div>

          <div className="p-4 bg-surface-container rounded-lg border border-outline-variant/50">
            <p className="text-sm text-on-surface-variant text-center">
              Ahora puedes iniciar sesión con tu nueva contraseña.
            </p>
          </div>

          <Link 
            href="/login" 
            className="mt-sm w-full bg-primary text-on-primary font-label-sm text-label-sm py-sm px-lg rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm"
          >
            Iniciar Sesión
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    );
  }

  if (mode === 'new-password') {
    return (
      <div className="bg-surface-dim min-h-screen flex items-center justify-center p-md text-on-surface font-body-md">
        <div className="w-full max-w-md bg-surface-container-low rounded-xl shadow-[0px_4px_30px_rgba(0,0,0,0.3)] border border-outline-variant p-lg md:p-xl flex flex-col gap-lg">
          <div className="text-center flex flex-col items-center gap-sm">
            <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
            <h1 className="font-h1 text-h1 text-primary">Nueva Contraseña</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Ingresa tu nueva contraseña
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-100/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface" htmlFor="newPassword">Nueva Contraseña</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                  className="w-full pl-xl pr-xl py-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md placeholder-outline/50"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-sm top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface" htmlFor="confirmPassword">Confirmar Contraseña</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  className="w-full pl-xl pr-sm py-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md placeholder-outline/50"
                  placeholder="Repite tu contraseña"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-sm w-full bg-primary text-on-primary font-label-sm text-label-sm py-sm px-lg rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Restablecer Contraseña'}
              {!loading && <span className="material-symbols-outlined text-[18px]">check</span>}
            </button>
          </form>

          <div className="text-center font-body-md text-body-md text-on-surface-variant border-t border-outline-variant pt-md">
            <button 
              onClick={() => { setMode('verify-code'); setResetToken(''); setCode(''); }} 
              className="text-primary hover:text-primary-fixed-dim font-label-sm text-label-sm transition-colors underline-offset-4 hover:underline"
            >
              Volver al código
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-dim min-h-screen flex items-center justify-center p-md text-on-surface font-body-md">
      <div className="w-full max-w-md bg-surface-container-low rounded-xl shadow-[0px_4px_30px_rgba(0,0,0,0.3)] border border-outline-variant p-lg md:p-xl flex flex-col gap-lg">
        <div className="text-center flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>pin</span>
          <h1 className="font-h1 text-h1 text-primary">Código de Verificación</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Ingresa el código de 6 dígitos que enviamos a tu correo
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyCode} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface" htmlFor="email">Correo Electrónico</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">mail</span>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="w-full pl-xl pr-sm py-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md placeholder-outline/50"
                placeholder="nombre@correo.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface" htmlFor="code">Código de 6 dígitos</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">pin</span>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-xl pr-sm py-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md placeholder-outline/50 tracking-[0.5em] text-center"
                placeholder="000000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-sm w-full bg-primary text-on-primary font-label-sm text-label-sm py-sm px-lg rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar Código'}
            {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
          </button>
        </form>

        <div className="text-center font-body-md text-body-md text-on-surface-variant border-t border-outline-variant pt-md">
          ¿No recibiste el código?{' '}
          <Link href="/forgot-password" className="text-primary hover:text-primary-fixed-dim font-label-sm text-label-sm transition-colors underline-offset-4 hover:underline">
            Enviar de nuevo
          </Link>
        </div>

        <div className="text-center">
          <Link href="/login" className="text-on-surface-variant hover:text-primary font-label-sm text-label-sm transition-colors">
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="bg-surface-dim min-h-screen flex items-center justify-center p-md">
      <div className="flex items-center gap-md text-on-surface-variant">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Cargando...</span>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}