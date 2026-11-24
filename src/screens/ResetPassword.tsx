'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, Link } from '@/lib/navigation'
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { supabase, createEphemeralSupabaseClient } from '@/lib/supabase'

type RecoveryStatus = 'checking' | 'ready' | 'invalid' | 'success'
type EphemeralClient = ReturnType<typeof createEphemeralSupabaseClient>

interface InitResult {
  status: 'ready' | 'invalid'
  client: EphemeralClient | null
  errorMessage?: string
}

export default function ResetPassword() {
  const router = useRouter()
  const { toast } = useToast()

  const [status, setStatus] = useState<RecoveryStatus>('checking')
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const ephemeralClientRef = useRef<EphemeralClient | null>(null)
  const initPromiseRef = useRef<Promise<InitResult> | null>(null)

  useEffect(() => {
    let active = true

    if (!initPromiseRef.current && typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const hashRaw = window.location.hash.replace(/^#/, '')
      const hashParams = new URLSearchParams(hashRaw)

      const urlError = searchParams.get('error') || hashParams.get('error')
      const urlErrorDesc = searchParams.get('error_description') || hashParams.get('error_description')
      const hashType = hashParams.get('type')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const tokenHash = searchParams.get('token_hash')
      const queryType = searchParams.get('type')

      if (window.location.search || window.location.hash) {
        window.history.replaceState({}, '', '/reset-password')
      }

      initPromiseRef.current = (async (): Promise<InitResult> => {
        if (urlError) {
          return {
            status: 'invalid',
            client: null,
            errorMessage: urlErrorDesc || 'El enlace de recuperación es inválido o ya expiró. Solicitá uno nuevo.',
          }
        }

        if (hashType === 'recovery' && accessToken && refreshToken) {
          const ephemeral = createEphemeralSupabaseClient()
          const { data, error } = await ephemeral.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error || !data.session) {
            return {
              status: 'invalid',
              client: null,
              errorMessage: 'El enlace de recuperación es inválido o ya expiró. Solicitá uno nuevo.',
            }
          }
          return { status: 'ready', client: ephemeral }
        }

        if (tokenHash && queryType === 'recovery') {
          const ephemeral = createEphemeralSupabaseClient()
          const { data, error } = await ephemeral.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          })
          if (error || !data.session) {
            return {
              status: 'invalid',
              client: null,
              errorMessage: 'El enlace de recuperación es inválido o ya expiró. Solicitá uno nuevo.',
            }
          }
          return { status: 'ready', client: ephemeral }
        }

        return { status: 'invalid', client: null }
      })()
    }

    initPromiseRef.current?.then((result) => {
      if (!active) return
      ephemeralClientRef.current = result.client
      if (result.errorMessage) {
        setErrorMsg(result.errorMessage)
      }
      setStatus(result.status)
    })

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!pass) {
      setErrorMsg('Ingresá una nueva contraseña.')
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

    const client = ephemeralClientRef.current
    if (!client) {
      setStatus('invalid')
      return
    }

    setLoading(true)
    try {
      const { error } = await client.auth.updateUser({ password: pass })
      if (error) {
        const msg = error.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.'
        setErrorMsg(msg)
        toast(msg, 'error')
        setLoading(false)
        return
      }

      await client.auth.signOut({ scope: 'global' }).catch(() => {})
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
      ephemeralClientRef.current = null
      toast('Contraseña restablecida con éxito.', 'success')
      setStatus('success')
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

        {status === 'checking' && (
          <div className="py-12 text-center">
            <span className="w-6 h-6 border-2 border-olive/30 border-t-olive rounded-full animate-spin mx-auto block mb-4" />
            <p className="text-[13px] text-muted dark:text-dark-muted">Validando enlace de recuperación...</p>
          </div>
        )}

        {status === 'invalid' && (
          <div className="text-center py-4">
            <div className="w-10 h-10 bg-terracotta-bg dark:bg-dark-surface border border-terracotta dark:border-dark-terracotta rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={20} className="text-terracotta dark:text-dark-terracotta" />
            </div>
            <h1 className="text-[24px] font-light text-ink dark:text-dark-ink mb-3">Enlace inválido o expirado</h1>
            <p className="text-[13px] text-muted dark:text-dark-muted mb-8 leading-relaxed">
              {errorMsg || 'Abrí esta página desde el enlace que te enviamos por correo, o solicitá uno nuevo.'}
            </p>
            <div className="space-y-3">
              <Link
                href="/forgot-password"
                className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium inline-flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
              >
                Solicitar nuevo enlace
              </Link>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft size={12} /> Volver al inicio de sesión
              </button>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="mb-6">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted dark:text-dark-muted mb-2">Nueva clave</p>
              <h1 className="text-[28px] font-light tracking-[-0.02em] text-ink dark:text-dark-ink mb-2">Nueva contraseña</h1>
              <p className="text-[13px] text-muted dark:text-dark-muted leading-relaxed">
                Ingresá una contraseña segura de al menos 8 caracteres para tu cuenta.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 px-3.5 py-2.5 rounded-[4px] bg-terracotta-bg border border-terracotta text-terracotta dark:bg-dark-surface dark:border-dark-terracotta dark:text-dark-terracotta text-[13px]">
                {errorMsg}
              </div>
            )}

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
          </form>
        )}

        {status === 'success' && (
          <div className="text-center py-4">
            <CheckCircle size={40} className="text-olive dark:text-dark-olive mx-auto mb-4" />
            <h1 className="text-[28px] font-light tracking-[-0.02em] text-ink dark:text-dark-ink mb-3">Contraseña actualizada</h1>
            <p className="text-[13px] text-muted dark:text-dark-muted mb-8 leading-relaxed">
              Tu contraseña fue cambiada correctamente. Ya podés iniciar sesión con tu nueva clave.
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
