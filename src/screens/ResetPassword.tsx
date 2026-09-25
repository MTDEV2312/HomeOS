'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams, Link } from '@/lib/navigation'
import { CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/context/ToastContext'

const steps = ['Código', 'Nueva contraseña', 'Listo']

export default function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resetPassword } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState(0)
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const next = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (step === 0) {
      if (!code.trim()) {
        setErrorMsg('Ingresá el código de verificación.')
        return
      }
      setStep(1)
      return
    }

    if (step === 1) {
      if (pass !== confirm) {
        setErrorMsg('Las contraseñas no coinciden.')
        toast('Las contraseñas no coinciden.', 'error')
        return
      }

      setLoading(true)
      try {
        const { error } = await resetPassword(pass, code)
        if (error) {
          const msg = error.message || 'Error al restablecer la contraseña. El código puede haber expirado.'
          setErrorMsg(msg)
          toast(msg, 'error')
          setLoading(false)
          return
        }

        toast('Contraseña restablecida con éxito.', 'success')
        setStep(2)
        setLoading(false)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error inesperado'
        setErrorMsg(msg)
        toast(msg, 'error')
        setLoading(false)
      }
      return
    }

    if (step === 2) {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-[14px] font-semibold text-ink dark:text-dark-ink flex items-center gap-1.5 mb-12">
          <span className="w-2 h-2 rounded-full bg-olive dark:bg-dark-olive" />
          HomeOS
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center transition-colors ${
                i < step ? 'bg-olive dark:bg-dark-olive text-white' :
                i === step ? 'bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg' :
                'bg-line dark:bg-dark-line text-muted dark:text-dark-muted'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[11px] ${i === step ? 'text-ink dark:text-dark-ink font-medium' : 'text-muted dark:text-dark-muted'}`}>{s}</span>
              {i < steps.length - 1 && <div className="w-6 h-px bg-line dark:bg-dark-line ml-1" />}
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="mb-5 px-3.5 py-2.5 rounded-[4px] bg-terracotta-bg border border-terracotta text-terracotta dark:bg-dark-surface dark:border-dark-terracotta dark:text-dark-terracotta text-[13px]">
            {errorMsg}
          </div>
        )}

        {step === 0 && (
          <form onSubmit={next} className="space-y-5">
            <h1 className="text-[24px] font-light text-ink dark:text-dark-ink mb-6">Ingresá el código</h1>
            <div>
              <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Código de verificación</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                placeholder="123456"
                className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[18px] font-mono text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface tracking-widest focus:outline-none focus:border-olive dark:focus:border-dark-olive"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium hover:opacity-80 disabled:opacity-50">
              {loading ? <span className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin mx-auto block" /> : 'Continuar'}
            </button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={next} className="space-y-5">
            <h1 className="text-[24px] font-light text-ink dark:text-dark-ink mb-6">Nueva contraseña</h1>
            {[
              { label: 'Nueva contraseña', value: pass, set: setPass },
              { label: 'Confirmar contraseña', value: confirm, set: setConfirm },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">{f.label}</label>
                <input
                  type="password"
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[14px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface focus:outline-none focus:border-olive dark:focus:border-dark-olive"
                />
              </div>
            ))}
            <button type="submit" disabled={loading} className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium hover:opacity-80 disabled:opacity-50">
              {loading ? <span className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin mx-auto block" /> : 'Guardar contraseña'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="text-center py-4">
            <CheckCircle size={40} className="text-olive dark:text-dark-olive mx-auto mb-4" />
            <h2 className="text-[24px] font-light text-ink dark:text-dark-ink mb-3">Contraseña actualizada</h2>
            <p className="text-[13px] text-muted dark:text-dark-muted mb-8">Tu contraseña fue cambiada correctamente.</p>
            <button onClick={() => router.push('/login')} className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium hover:opacity-80">
              Ir al inicio de sesión
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
