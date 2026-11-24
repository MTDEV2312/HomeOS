'use client'

import React, { useState } from 'react'
import { useRouter, Link } from '@/lib/navigation'
import { ArrowRight, MailCheck, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/context/ToastContext'

export default function Signup() {
  const router = useRouter()
  const { signUp, resendVerificationEmail } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', terms: false })

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setErrorMsg('Las contraseñas no coinciden.')
      toast('Las contraseñas no coinciden.', 'error')
      return
    }

    if (!form.terms) {
      setErrorMsg('Debes aceptar los términos y condiciones.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const { error, requireEmailVerification } = await signUp(form.email, form.password, form.name)
      if (error) {
        const msg = error.message || 'Error al crear la cuenta.'
        setErrorMsg(msg)
        toast(msg, 'error')
        setLoading(false)
        return
      }

      if (requireEmailVerification) {
        setVerificationSent(true)
        setLoading(false)
        toast('Te enviamos un enlace de confirmación a tu correo.', 'success')
      } else {
        toast('¡Cuenta creada con éxito!', 'success')
        router.push('/household-setup')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setErrorMsg(msg)
      toast(msg, 'error')
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      const { error } = await resendVerificationEmail(form.email)
      if (error) {
        toast(error.message || 'Error al reenviar el enlace.', 'error')
      } else {
        toast('Enlace reenviado. Revisá tu casilla.', 'success')
      }
    } catch {
      toast('Error al reenviar el enlace.', 'error')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <Link href="/" className="text-[14px] font-semibold text-ink dark:text-dark-ink flex items-center gap-1.5 mb-10">
            <span className="w-2 h-2 rounded-full bg-olive dark:bg-dark-olive" />
            HomeOS
          </Link>
          {!verificationSent && (
            <>
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted dark:text-dark-muted mb-2">Empezá ahora</p>
              <h1 className="text-[28px] font-light tracking-[-0.02em] text-ink dark:text-dark-ink">Crear mi hogar</h1>
            </>
          )}
        </div>

        {verificationSent ? (
          <div>
            <div className="w-10 h-10 bg-olive-soft dark:bg-dark-olive-soft rounded-full flex items-center justify-center mb-6">
              <MailCheck size={20} className="text-olive dark:text-dark-olive" />
            </div>
            <h1 className="text-[24px] font-light text-ink dark:text-dark-ink mb-3">Revisá tu correo</h1>
            <p className="text-[13px] text-muted dark:text-dark-muted mb-8 leading-relaxed">
              Te enviamos un enlace de confirmación a <strong className="text-ink dark:text-dark-ink">{form.email}</strong>. Hacé clic en el enlace del correo para activar tu cuenta y continuar.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium inline-flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
              >
                Volver al inicio de sesión <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink inline-flex items-center justify-center gap-2 hover:border-olive transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Reenviando...' : 'Reenviar enlace'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="mb-5 px-3.5 py-2.5 rounded-[4px] bg-terracotta-bg border border-terracotta text-terracotta dark:bg-dark-surface dark:border-dark-terracotta dark:text-dark-terracotta text-[13px]">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Nombre completo', key: 'name', type: 'text', placeholder: 'Ana Terán' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'ana@ejemplo.com' },
                { label: 'Contraseña', key: 'password', type: 'password', placeholder: '••••••••' },
                { label: 'Confirmar contraseña', key: 'confirm', type: 'password', placeholder: '••••••••' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={form[field.key as keyof typeof form] as string}
                    onChange={e => set(field.key, e.target.value)}
                    required
                    placeholder={field.placeholder}
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[14px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface placeholder:text-muted/40 focus:outline-none focus:border-olive dark:focus:border-dark-olive transition-colors"
                  />
                </div>
              ))}

              <label className="flex items-start gap-3 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.terms}
                  onChange={e => set('terms', e.target.checked)}
                  required
                  className="mt-0.5 w-4 h-4 rounded border-line accent-olive"
                />
                <span className="text-[12px] text-muted dark:text-dark-muted leading-relaxed">
                  Acepto los{' '}
                  <Link href="/terms" className="text-ink dark:text-dark-ink underline-offset-2 underline">Términos</Link>
                  {' '}y la{' '}
                  <Link href="/privacy" className="text-ink dark:text-dark-ink underline-offset-2 underline">Política de privacidad</Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium inline-flex items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50 mt-2"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
                  : <><span>Crear cuenta</span> <ArrowRight size={15} /></>}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-line dark:border-dark-line text-center">
              <p className="text-[13px] text-muted dark:text-dark-muted">
                ¿Ya tenés cuenta?{' '}
                <button onClick={() => router.push('/login')} className="text-ink dark:text-dark-ink font-medium hover:text-olive dark:hover:text-dark-olive transition-colors">
                  Iniciar sesión
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
