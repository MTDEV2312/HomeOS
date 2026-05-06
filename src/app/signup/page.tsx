"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const { error, requireEmailVerification } = await signUp(email, password, name);
    
    if (error) {
      setError(error.message || 'Error al crear la cuenta');
      setLoading(false);
    } else if (requireEmailVerification) {
      // Redirect to verify-email page with the email in query
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="bg-surface-dim min-h-screen flex items-center justify-center p-md text-on-surface font-body-md">
      <div className="w-full max-w-md bg-surface-container-low rounded-xl shadow-[0px_4px_30px_rgba(0,0,0,0.3)] border border-outline-variant p-lg md:p-xl flex flex-col gap-lg">
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <h1 className="font-h1 text-h1 text-primary">HomeOS</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Comienza tu refugio digital</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          {error && (
            <div className="p-3 bg-red-100/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface" htmlFor="signup-name">Nombre Completo</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">person</span>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-xl pr-sm py-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md placeholder-outline/50"
                placeholder="Juan Pérez"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface" htmlFor="signup-email">Correo Electrónico</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">mail</span>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-xl pr-sm py-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md placeholder-outline/50"
                placeholder="juan@ejemplo.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface" htmlFor="signup-password">Contraseña</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">lock</span>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
            <label className="font-label-sm text-label-sm text-on-surface" htmlFor="signup-confirm">Confirmar Contraseña</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">lock</span>
              <input
                id="signup-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Cuenta'}
            {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
          </button>
        </form>

        {/* Footer Links */}
        <div className="text-center font-body-md text-body-md text-on-surface-variant border-t border-outline-variant pt-md">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="text-primary hover:text-primary-fixed-dim font-label-sm text-label-sm transition-colors underline-offset-4 hover:underline">
            Inicia Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}