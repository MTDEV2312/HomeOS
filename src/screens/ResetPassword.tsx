'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams, Link } from '@/lib/navigation'
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/context/ToastContext'

const SESSION_STORAGE_KEY = 'homeos_recovery_session'
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
const steps = ['Código', 'Nueva contraseña', 'Listo']

interface RecoverySession {
  resetToken: string
  email: string
  lastActivity: number
}

function getValidStoredSession(): RecoverySession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Partial<RecoverySession>
    if (
      typeof session.resetToken === 'string' &&
      session.resetToken &&
      typeof session.lastActivity === 'number' &&
      Date.now() - session.lastActivity < INACTIVITY_TIMEOUT_MS
    ) {
      return session as RecoverySession
    }
    // Expired or malformed
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  } catch {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      // ignore
    }
    return null
  }
}

function saveRecoverySession(session: RecoverySession): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // ignore
  }
}

function clearRecoverySession(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export default function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { exchangeResetPasswordToken, resetPassword } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSessionExpired, setIsSessionExpired] = useState(false)

  const lastActivityRef = useRef<number>(0)
  const lastSyncRef = useRef<number>(0)
  const hasMountedRef = useRef(false)

  const purgeSession = useCallback(() => {
    clearRecoverySession()
    setResetToken('')
    setPass('')
    setConfirm('')
  }, [])

  const performTokenExchange = useCallback(async (targetEmail: string, targetCode: string) => {
    setErrorMsg('')
    setIsSessionExpired(false)
    setLoading(true)

    try {
      const res = await exchangeResetPasswordToken(targetEmail.trim(), targetCode.trim())
      const token = res.resetToken || res.token

      if (res.error || !token) {
        setErrorMsg('El código ingresado es inválido o ya expiró. Solicitá uno nuevo.')
        toast('El código ingresado es inválido o ya expiró. Solicitá uno nuevo.', 'error')
        setLoading(false)
        return
      }

      const now = Date.now()
      lastActivityRef.current = now
      lastSyncRef.current = now

      saveRecoverySession({
        resetToken: token,
        email: targetEmail.trim(),
        lastActivity: now,
      })

      setResetToken(token)
      // Sanitize URL via window.history.replaceState to prevent replay
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/reset-password')
      }
      setStep(1)
      setLoading(false)
    } catch {
      setErrorMsg('El código ingresado es inválido o ya expiró. Solicitá uno nuevo.')
      toast('El código ingresado es inválido o ya expiró. Solicitá uno nuevo.', 'error')
      setLoading(false)
    }
  }, [exchangeResetPasswordToken, toast])

  // Step 0 & Step 1 initialization on mount
  useEffect(() => {
    if (hasMountedRef.current) return
    hasMountedRef.current = true

    // 1. Check if a valid session already exists in sessionStorage
    const existingSession = getValidStoredSession()
    if (existingSession) {
      const now = Date.now()
      lastActivityRef.current = now
      lastSyncRef.current = now
      saveRecoverySession({
        ...existingSession,
        lastActivity: now,
      })
      setResetToken(existingSession.resetToken)
      if (existingSession.email) {
        setEmail(existingSession.email)
      }
      setStep(1)

      // Sanitize URL if query params exist
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, '', '/reset-password')
      }
      return
    }

    // 2. Read URL query params
    const urlEmail = searchParams.get('email') || ''
    const urlCode = searchParams.get('code') || searchParams.get('token') || ''

    if (urlEmail) {
      setEmail(urlEmail)
    }
    if (urlCode) {
      setCode(urlCode)
    }

    // Auto-trigger if both email and code/token are present in URL on mount
    if (urlEmail && urlCode) {
      performTokenExchange(urlEmail, urlCode)
    }
  }, [searchParams, performTokenExchange])

  // Step 1: Validated Recovery Session with 15-Minute Sliding Inactivity Window
  useEffect(() => {
    if (step !== 1) return

    if (!lastActivityRef.current) {
      lastActivityRef.current = Date.now()
    }

    const updateActivity = () => {
      const now = Date.now()
      lastActivityRef.current = now

      // Periodically sync to sessionStorage (throttled to once every 2 seconds)
      if (now - lastSyncRef.current > 2000) {
        lastSyncRef.current = now
        const currentSession = getValidStoredSession()
        if (currentSession) {
          saveRecoverySession({
            ...currentSession,
            lastActivity: now,
          })
        }
      }
    }

    const events: Array<keyof WindowEventMap> = ['keydown', 'mousedown', 'touchstart', 'focus', 'input']
    events.forEach(evt => window.addEventListener(evt, updateActivity, { passive: true }))

    const timer = setInterval(() => {
      const inactiveDuration = Date.now() - lastActivityRef.current
      if (inactiveDuration >= INACTIVITY_TIMEOUT_MS) {
        purgeSession()
        setIsSessionExpired(true)
        setErrorMsg('Tu sesión de recuperación expiró por inactividad (15 minutos). Por seguridad, deberás solicitar un nuevo código.')
      }
    }, 1000)

    return () => {
      events.forEach(evt => window.removeEventListener(evt, updateActivity))
      clearInterval(timer)
    }
  }, [step, purgeSession])

  const handleStep0Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!email.trim()) {
      setErrorMsg('Ingresa tu correo electrónico.')
      return
    }
    if (!code.trim()) {
      setErrorMsg('Ingresa el código de verificación.')
      return
    }

    await performTokenExchange(email, code)
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!pass) {
      setErrorMsg('Ingresa una nueva contraseña.')
      return
    }

    if (pass.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (pass !== confirm) {
      setErrorMsg('Las contraseñas no coinciden.')
      toast('Las contraseñas no coinciden.', 'error')
      return
    }

    if (!resetToken) {
      purgeSession()
      setIsSessionExpired(true)
      setErrorMsg('Tu sesión de recuperación expiró o no es válida. Solicita un nuevo código.')
      return
    }

    setLoading(true)
    try {
      const { error } = await resetPassword(pass, resetToken)
      if (error) {
        const msg = error.message || 'Error al restablecer la contraseña. El código puede haber expirado.'
        setErrorMsg(msg)
        toast(msg, 'error')
        setLoading(false)
        return
      }

      // On success: purge sessionStorage and advance to step 2
      purgeSession()
      toast('Contraseña restablecida con éxito.', 'success')
      setStep(2)
      setLoading(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setErrorMsg(msg)
      toast(msg, 'error')
      setLoading(false)
    }
  }

  const handleCancelStep1 = () => {
    purgeSession()
    setErrorMsg('')
    setIsSessionExpired(false)
    setStep(0)
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
              <div
                className={`w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center transition-colors ${
                  i < step
                    ? 'bg-olive dark:bg-dark-olive text-white'
                    : i === step
                    ? 'bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg'
                    : 'bg-line dark:bg-dark-line text-muted dark:text-dark-muted'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[11px] ${i === step ? 'text-ink dark:text-dark-ink font-medium' : 'text-muted dark:text-dark-muted'}`}>
                {s}
              </span>
              {i < steps.length - 1 && <div className="w-6 h-px bg-line dark:bg-dark-line ml-1" />}
            </div>
          ))}
        </div>

        {errorMsg && !isSessionExpired && (
          <div className="mb-5 px-3.5 py-2.5 rounded-[4px] bg-terracotta-bg border border-terracotta text-terracotta dark:bg-dark-surface dark:border-dark-terracotta dark:text-dark-terracotta text-[13px]">
            {errorMsg}
          </div>
        )}

        {/* Step 0: Upfront Code / Token Validation */}
        {step === 0 && (
          <form onSubmit={handleStep0Submit} className="space-y-5">
            <div className="mb-6">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted dark:text-dark-muted mb-2">Recuperación</p>
              <h1 className="text-[28px] font-light tracking-[-0.02em] text-ink dark:text-dark-ink mb-2">Ingresa el código</h1>
              <p className="text-[13px] text-muted dark:text-dark-muted leading-relaxed">
                Ingresa el correo asociado a tu cuenta y el código de verificación que te enviamos.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="ana@ejemplo.com"
                className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[14px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface placeholder:text-muted/40 focus:outline-none focus:border-olive dark:focus:border-dark-olive transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                Código de verificación
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                placeholder="123456"
                className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[18px] font-mono text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface tracking-widest focus:outline-none focus:border-olive dark:focus:border-dark-olive transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium hover:opacity-80 disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin mx-auto block" />
              ) : (
                'Validar código'
              )}
            </button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  purgeSession()
                  router.push('/login')
                }}
                className="text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft size={12} /> Volver al inicio de sesión
              </button>
            </div>
          </form>
        )}

        {/* Step 1: Validated Recovery Session */}
        {step === 1 && (
          <>
            {isSessionExpired ? (
              <div className="text-center py-4">
                <div className="w-10 h-10 bg-terracotta-bg dark:bg-dark-surface border border-terracotta dark:border-dark-terracotta rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={20} className="text-terracotta dark:text-dark-terracotta" />
                </div>
                <h2 className="text-[24px] font-light text-ink dark:text-dark-ink mb-3">Sesión expirada</h2>
                <p className="text-[13px] text-muted dark:text-dark-muted mb-8 leading-relaxed">
                  Tu sesión de recuperación expiró por inactividad (15 minutos). Por seguridad, deberás solicitar un nuevo código.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/forgot-password"
                    onClick={() => {
                      purgeSession()
                      setIsSessionExpired(false)
                      setStep(0)
                    }}
                    className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium inline-flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    Solicitar nuevo código
                  </Link>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        purgeSession()
                        setIsSessionExpired(false)
                        setErrorMsg('')
                        setStep(0)
                      }}
                      className="text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
                    >
                      Ingresar otro código
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleStep1Submit} className="space-y-5">
                <div className="mb-6">
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted dark:text-dark-muted mb-2">Nueva clave</p>
                  <h1 className="text-[28px] font-light tracking-[-0.02em] text-ink dark:text-dark-ink mb-2">Nueva contraseña</h1>
                  <p className="text-[13px] text-muted dark:text-dark-muted leading-relaxed">
                    Ingresa una contraseña segura de al menos 8 caracteres para tu cuenta.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[14px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface focus:outline-none focus:border-olive dark:focus:border-dark-olive transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[14px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface focus:outline-none focus:border-olive dark:focus:border-dark-olive transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium hover:opacity-80 disabled:opacity-50 transition-opacity"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin mx-auto block" />
                  ) : (
                    'Guardar contraseña'
                  )}
                </button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleCancelStep1}
                    className="text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
                  >
                    Volver
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Step 2: Success Confirmation */}
        {step === 2 && (
          <div className="text-center py-4">
            <CheckCircle size={40} className="text-olive dark:text-dark-olive mx-auto mb-4" />
            <h2 className="text-[28px] font-light tracking-[-0.02em] text-ink dark:text-dark-ink mb-3">Contraseña actualizada</h2>
            <p className="text-[13px] text-muted dark:text-dark-muted mb-8 leading-relaxed">
              Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión con tu nueva clave.
            </p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium hover:opacity-80 transition-opacity"
            >
              Ir al inicio de sesión
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
