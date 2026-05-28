"use client";

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2, MailCheck, RefreshCw } from 'lucide-react';
import { insforge } from '@/lib/insforge';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';
  const { verifyEmail } = useAuth();

  const [email] = useState(emailFromQuery);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').split('').slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Ingresa el código completo de 6 dígitos');
      return;
    }

    setError('');
    setLoading(true);

    const { error } = await verifyEmail(email, code);
    
    if (error) {
      setError(error.message || 'Código inválido');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendSuccess(false);
    setError('');

    try {
      const { error } = await insforge.auth.resendVerificationEmail({ email });
      if (error) {
        setError('Error al reenviar el código');
      } else {
        setResendSuccess(true);
      }
    } catch {
      setError('Error al reenviar el código');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container min-h-screen flex items-center justify-center p-md">
      <div className="w-full max-w-md flex flex-col gap-lg">
        <div className="auth-card">
          {/* Icon */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
              <MailCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verificación de Email en HomeOS</h1>
            <h2 className="text-body-md text-slate-500 font-medium">Ingresa tu código OTP</h2>
            <p className="text-slate-500 mt-2 text-sm">
              Enviamos un código de 6 dígitos a{' '}
              <span className="font-semibold text-slate-700">{email}</span>
            </p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="alert alert-success">
              <span>Código reenviado exitosamente</span>
            </div>
          )}

          {/* OTP Input */}
          <div className="flex justify-center gap-2.5">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-bold border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
                aria-label={`Dígito ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar email'}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-6 text-center space-y-3">
          <button
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Reenviando...' : 'Reenviar código'}
          </button>
          <p className="text-sm text-slate-400">
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>

      <footer className="flex flex-col items-center gap-xs text-on-surface-variant/60 font-label-sm text-label-sm mt-sm">
        <div className="flex gap-md">
          <a href="https://github.com/MTDEV2312" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
            </svg>
            <span>GitHub</span>
          </a>
        </div>
        <span className="mt-xs">Desarrollado por MTDEV2312 • © {new Date().getFullYear()} HomeOS</span>
      </footer>
    </div>
  </div>
  );
}

export default function VerifyEmailClient() {
  return (
    <Suspense fallback={
      <div className="auth-container min-h-screen flex items-center justify-center p-md">
        <div className="auth-card flex items-center justify-center py-16 w-full max-w-md">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
