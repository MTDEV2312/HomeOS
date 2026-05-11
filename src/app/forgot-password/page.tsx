"use client";

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { sendResetPasswordEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);

    const { error: resetError, success: resetSuccess } = await sendResetPasswordEmail(email);

    if (resetError) {
      setError(resetError.message || 'Error al enviar el correo de recuperación');
      setLoading(false);
    } else if (resetSuccess) {
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    }
  };

  return (
    <div className="bg-surface-dim min-h-screen flex items-center justify-center p-md text-on-surface font-body-md">
      <div className="w-full max-w-md bg-surface-container-low rounded-xl shadow-[0px_4px_30px_rgba(0,0,0,0.3)] border border-outline-variant p-lg md:p-xl flex flex-col gap-lg">
        <div className="text-center flex flex-col items-center gap-sm">
          <div className="w-16 h-16 relative">
            <Logo size={64} />
          </div>
          <h1 className="font-h1 text-h1 text-primary">¿Olvidaste tu contraseña?</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Ingresa tu correo y te enviaremos un código para restablecerla
          </p>
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
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleChange}
                className="w-full pl-xl pr-sm py-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md placeholder-outline/50"
                placeholder="nombre@correo.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-sm w-full bg-primary text-on-primary font-label-sm text-label-sm py-sm px-lg rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Código'}
            {!loading && <span className="material-symbols-outlined text-[18px]">send</span>}
          </button>
        </form>

        <div className="text-center font-body-md text-body-md text-on-surface-variant border-t border-outline-variant pt-md">
          ¿Recordaste tu contraseña?{' '}
          <Link href="/login" className="text-primary hover:text-primary-fixed-dim font-label-sm text-label-sm transition-colors underline-offset-4 hover:underline">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}