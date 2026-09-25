'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams, Link } from '@/lib/navigation'
import { CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/context/ToastContext'

export default function VerifyEmail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, verifyEmail } = useAuth()
  const { toast } = useToast()

  const emailParam = searchParams.get('email') || user?.email || ''
  const [email] = useState(emailParam)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[i] = digit
    setCode(next)
    if (digit && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const otp = code.join('')
    if (otp.length < 6) return

    setLoading(true)
    try {
      if (email) {
        const { error: verifyErr } = await verifyEmail(email, otp)
        if (verifyErr) {
          setError(verifyErr.message || 'Código incorrecto. Intentá de nuevo.')
          toast(verifyErr.message || 'Error de verificación.', 'error')
          setLoading(false)
          return
        }
      }
      setVerified(true)
      toast('¡Email verificado!', 'success')
      setTimeout(() => router.push('/household-setup'), 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al verificar'
      setError(msg)
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

        {verified ? (
          <div className="text-center py-8">
            <CheckCircle size={40} className="text-olive dark:text-dark-olive mx-auto mb-4" />
            <h2 className="text-[22px] font-light text-ink dark:text-dark-ink mb-2">¡Email verificado!</h2>
            <p className="text-[13px] text-muted dark:text-dark-muted">Redirigiendo a la configuración de tu hogar…</p>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted dark:text-dark-muted mb-2">Verificación</p>
            <h1 className="text-[28px] font-light tracking-[-0.02em] text-ink dark:text-dark-ink mb-3">Verificá tu email</h1>
            <p className="text-[13px] text-muted dark:text-dark-muted mb-8 leading-relaxed">
              Te enviamos un código de 6 dígitos {email ? `a ${email}` : 'a tu casilla de correo'}. Ingresalo a continuación.
            </p>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex gap-2 justify-between">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    maxLength={1}
                    className={`w-12 h-14 text-center text-[22px] font-mono border rounded-[4px] bg-surface dark:bg-dark-surface text-ink dark:text-dark-ink focus:outline-none transition-colors ${
                      error ? 'border-terracotta' : 'border-line dark:border-dark-line focus:border-olive dark:focus:border-dark-olive'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <p className="text-[12px] text-terracotta dark:text-dark-terracotta">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || code.some(d => !d)}
                className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium inline-flex items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-40"
              >
                {loading ? <span className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" /> : 'Verificar'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => toast('Código reenviado.', 'info')}
                className="text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
              >
                ¿No recibiste el código? <span className="text-ink dark:text-dark-ink font-medium">Reenviar</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
