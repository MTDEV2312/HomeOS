'use client'

import React, { useState } from 'react'
import { useRouter, Link } from '@/lib/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/context/ToastContext'

export default function ForgotPassword() {
  const router = useRouter()
  const { sendResetPasswordEmail } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { error } = await sendResetPasswordEmail(email)
      if (error) {
        const msg = error.message || 'Error al enviar el email de recuperación.'
        setErrorMsg(msg)
        toast(msg, 'error')
        setLoading(false)
        return
      }

      setSent(true)
      toast('Código enviado a tu casilla.', 'success')
      setLoading(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setErrorMsg(msg)
      toast(msg, 'error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-[14px] font-semibold text-ink dark:text-dark-ink flex items-center gap-1.5 mb-12">
          <span className="w-2 h-2 rounded-full bg-olive dark:bg-dark-olive" />
          HomeOS
        </Link>

        {sent ? (
          <div>
            <div className="w-10 h-10 bg-olive-soft dark:bg-dark-olive-soft rounded-full flex items-center justify-center mb-6">
              <span className="text-olive dark:text-dark-olive text-lg">✉</span>
            </div>
            <h2 className="text-[24px] font-light text-ink dark:text-dark-ink mb-3">Revisá tu correo</h2>
            <p className="text-[13px] text-muted dark:text-dark-muted mb-8 leading-relaxed">
              Te enviamos las instrucciones para restablecer tu contraseña a <strong className="text-ink dark:text-dark-ink">{email}</strong>.
            </p>
            <button
              onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium inline-flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
            >
              Ingresar código <ArrowRight size={15} />
            </button>
            <div className="mt-4 text-center">
              <button
                onClick={() => setSent(false)}
                className="text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted dark:text-dark-muted mb-2">Recuperación</p>
            <h1 className="text-[28px] font-light tracking-[-0.02em] text-ink dark:text-dark-ink mb-3">¿Olvidaste tu contraseña?</h1>
            <p className="text-[13px] text-muted dark:text-dark-muted mb-8 leading-relaxed">
              Ingresá tu email y te enviamos un código para restablecer tu contraseña.
            </p>

            {errorMsg && (
              <div className="mb-5 px-3.5 py-2.5 rounded-[4px] bg-terracotta-bg border border-terracotta text-terracotta dark:bg-dark-surface dark:border-dark-terracotta dark:text-dark-terracotta text-[13px]">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="ana@ejemplo.com"
                  className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[14px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface placeholder:text-muted/40 focus:outline-none focus:border-olive dark:focus:border-dark-olive transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium inline-flex items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {loading ? <span className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" /> : 'Enviar código'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft size={12} /> Volver al inicio de sesión
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
