"use client";

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { loginSchema, getFieldErrors } from '@/lib/validations';
import { Loader2 } from 'lucide-react';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const validationErrors = getFieldErrors(loginSchema, formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    const { error: signInError } = await signIn(formData.email, formData.password);

    if (signInError) {
      setError(signInError.message || 'Credenciales inválidas');
      setLoading(false);
    } else {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    }
  };

  return (
    <div className="bg-surface-dim min-h-screen flex items-center justify-center p-md text-on-surface font-body-md">
      <div className="w-full max-w-md bg-surface-container-low rounded-xl shadow-[0px_4px_30px_rgba(0,0,0,0.3)] border border-outline-variant p-lg md:p-xl flex flex-col gap-lg">
        <div className="text-center flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <h1 className="font-h1 text-h1 text-primary">HomeOS</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Inicia sesión en tu refugio</p>
        </div>

        {error && (
          <div className="p-3 bg-red-100/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface" htmlFor="email">Correo Electrónico</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">mail</span>
              <input
                className={`w-full pl-xl pr-sm py-sm rounded-lg border bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md placeholder-outline/50 ${errors.email ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant'}`}
                id="email"
                name="email"
                placeholder="nombre@correo.com"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && (
              <p className="text-error text-xs mt-xs">{errors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-xs">
            <div className="flex justify-between items-center">
              <label className="font-label-sm text-label-sm text-on-surface" htmlFor="password">Contraseña</label>
              <a className="font-label-sm text-label-sm text-primary hover:text-primary-fixed-dim transition-colors" href="#">¿Olvidaste tu contraseña?</a>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">lock</span>
              <input
                className={`w-full pl-xl pr-sm py-sm rounded-lg border bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md placeholder-outline/50 ${errors.password ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant'}`}
                id="password"
                name="password"
                placeholder="••••••••"
                type="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            {errors.password && (
              <p className="text-error text-xs mt-xs">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center gap-sm mt-xs">
            <input className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container-lowest cursor-pointer" id="remember" type="checkbox" />
            <label className="font-label-sm text-label-sm text-on-surface-variant cursor-pointer select-none" htmlFor="remember">Recordarme</label>
          </div>

          <button
            className="mt-sm w-full bg-primary text-on-primary font-label-sm text-label-sm py-sm px-lg rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
            {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
          </button>
        </form>

        <div className="text-center font-body-md text-body-md text-on-surface-variant border-t border-outline-variant pt-md">
          ¿No tienes cuenta?{' '}
          <Link href="/signup" className="text-primary hover:text-primary-fixed-dim font-label-sm text-label-sm transition-colors underline-offset-4 hover:underline">
            Crear una cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
