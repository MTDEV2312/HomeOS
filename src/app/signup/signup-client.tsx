"use client";

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { signupSchema, getFieldErrors } from '@/lib/validations';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function SignupClient() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);

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

    if (!acceptedPolicies) {
      setError('Debes aceptar los Términos y Condiciones y la Política de Privacidad.');
      return;
    }

    const validationErrors = getFieldErrors(signupSchema, formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    const { error, requireEmailVerification } = await signUp(formData.email, formData.password, formData.name);
    
    if (error) {
      setError(error.message || 'Error al crear la cuenta');
      setLoading(false);
    } else if (requireEmailVerification) {
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <main className="bg-surface-dim h-screen overflow-y-auto text-on-surface font-body-md">
      <div className="min-h-full w-full flex items-center justify-center p-md">
        <div className="w-full max-w-md flex flex-col gap-lg py-md">
        <div className="w-full bg-surface-container-low rounded-xl shadow-[0px_4px_30px_rgba(0,0,0,0.3)] border border-outline-variant p-lg md:p-xl flex flex-col gap-lg">
          <div className="text-center flex flex-col items-center gap-sm">
            <div className="w-16 h-16 relative">
              <Logo size={64} />
            </div>
            <h1 className="font-h1 text-h1 text-primary">Regístrate en HomeOS</h1>
            <h2 className="text-body-md text-on-surface-variant font-medium">Crea tu cuenta familiar</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Comienza tu refugio digital</p>
          </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          {error && (
            <div className="p-3 bg-red-100/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface" htmlFor="name">Nombre Completo</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">person</span>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`w-full pl-xl pr-sm py-sm rounded-lg border bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md placeholder-outline/50 ${errors.name ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant'}`}
                placeholder="Juan Pérez"
              />
            </div>
            {errors.name && (
              <p className="text-error text-xs mt-xs">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface" htmlFor="email">Correo Electrónico</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">mail</span>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-xl pr-sm py-sm rounded-lg border bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md placeholder-outline/50 ${errors.email ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant'}`}
                placeholder="juan@ejemplo.com"
              />
            </div>
            {errors.email && (
              <p className="text-error text-xs mt-xs">{errors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface" htmlFor="password">Contraseña</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">lock</span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-xl pr-xl py-sm rounded-lg border bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md placeholder-outline/50 ${errors.password ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant'}`}
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
            {errors.password && (
              <p className="text-error text-xs mt-xs">{errors.password}</p>
            )}
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface" htmlFor="confirmPassword">Confirmar Contraseña</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">lock</span>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-xl pr-sm py-sm rounded-lg border bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md placeholder-outline/50 ${errors.confirmPassword ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant'}`}
                placeholder="Repite tu contraseña"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-error text-xs mt-xs">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex items-start gap-xs mt-xs">
            <input
              id="acceptPolicies"
              name="acceptPolicies"
              type="checkbox"
              checked={acceptedPolicies}
              onChange={(e) => setAcceptedPolicies(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container-lowest transition-colors cursor-pointer"
            />
            <label htmlFor="acceptPolicies" className="text-body-sm text-on-surface-variant cursor-pointer select-none">
              Acepto los{' '}
              <Link href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                Términos y Condiciones
              </Link>{' '}
              y la{' '}
              <Link href="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                Política de Privacidad
              </Link>{' '}
              de HomeOS.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !acceptedPolicies}
            className="mt-sm w-full bg-primary text-on-primary font-label-sm text-label-sm py-sm px-lg rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Cuenta'}
            {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
          </button>
        </form>

        <div className="text-center font-body-md text-body-md text-on-surface-variant border-t border-outline-variant pt-md">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="inline-block py-1.5 px-2 -my-1.5 -mx-2 text-primary hover:text-primary-fixed-dim font-label-sm text-label-sm transition-colors underline-offset-4 hover:underline">
            Inicia Sesión
          </Link>
        </div>
      </div>

      <footer className="flex flex-col items-center gap-xs text-on-surface-variant/60 font-label-sm text-label-sm">
        <div className="flex flex-wrap justify-center items-center gap-md mt-sm">
          <a href="https://github.com/MTDEV2312" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
            </svg>
            <span>GitHub</span>
          </a>
          <span className="text-on-surface-variant/30">•</span>
          <Link href="/terms" target="_blank" className="hover:text-primary transition-colors">
            Términos
          </Link>
          <span className="text-on-surface-variant/30">•</span>
          <Link href="/privacy" target="_blank" className="hover:text-primary transition-colors">
            Privacidad
          </Link>
        </div>
        <span className="mt-xs">Desarrollado por MTDEV2312 • © {new Date().getFullYear()} HomeOS</span>
      </footer>
        </div>
      </div>
    </main>
  );
}