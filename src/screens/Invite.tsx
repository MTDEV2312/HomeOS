'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams, Link } from '@/lib/navigation'
import { Home, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useHousehold } from '@/lib/household-context'
import { joinHousehold, getHouseholdByInviteCode } from '@/services/householdService'
import { useToast } from '@/context/ToastContext'

export default function Invite({ initialCode }: { initialCode?: string }) {
  const router = useRouter()
  const params = useParams<{ code?: string }>()
  const code = (initialCode || params.code || '').toUpperCase()

  const { user } = useAuth()
  const { refreshHousehold } = useHousehold()
  const { toast } = useToast()

  const [status, setStatus] = useState<'loading' | 'ready' | 'joining' | 'success' | 'error'>('loading')
  const [householdName, setHouseholdName] = useState('Hogar')
  const [errorMessage, setErrorMessage] = useState('')

  const checkInvite = useCallback(async () => {
    if (!code) {
      setStatus('error')
      setErrorMessage('No se proporcionó un código de invitación.')
      return
    }

    try {
      const hh = await getHouseholdByInviteCode(code)
      if (hh) {
        setHouseholdName(hh.name)
        setStatus('ready')
      } else {
        setStatus('ready')
        setHouseholdName('Hogar')
      }
    } catch {
      setStatus('ready')
    }
  }, [code])

  useEffect(() => {
    checkInvite()
  }, [checkInvite])

  const join = async () => {
    if (!user) {
      toast('Iniciá sesión para unirte al hogar', 'info')
      router.push(`/login?redirect=/invite/${code}`)
      return
    }

    setStatus('joining')
    try {
      await joinHousehold(code)
      await refreshHousehold()
      setStatus('success')
      toast('¡Te has unido exitosamente!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al unirte al hogar'
      setErrorMessage(msg)
      setStatus('error')
      toast(msg, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="text-[14px] font-semibold text-ink dark:text-dark-ink flex items-center justify-center gap-1.5 mb-12">
          <span className="w-2 h-2 rounded-full bg-olive dark:bg-dark-olive" />
          HomeOS
        </Link>

        {status === 'loading' && (
          <div className="py-12">
            <div className="w-8 h-8 border-2 border-line dark:border-dark-line border-t-olive dark:border-t-dark-olive rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[13px] text-muted dark:text-dark-muted">Verificando invitación…</p>
          </div>
        )}

        {status === 'ready' && (
          <div>
            <div className="w-16 h-16 bg-olive-soft dark:bg-dark-olive-soft rounded-full flex items-center justify-center mx-auto mb-6">
              <Home size={24} className="text-olive dark:text-dark-olive" />
            </div>
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted dark:text-dark-muted mb-2">Invitación</p>
            <h1 className="text-[24px] font-light text-ink dark:text-dark-ink mb-2">{householdName}</h1>
            <p className="text-[13px] text-muted dark:text-dark-muted mb-2">Has sido invitado a un hogar familiar.</p>
            <p className="text-[11px] font-mono text-muted dark:text-dark-muted mb-8 bg-surface dark:bg-dark-surface px-3 py-1.5 rounded inline-block border border-line dark:border-dark-line">
              Código: {code}
            </p>
            <div className="space-y-3">
              <button
                onClick={join}
                className="w-full py-3 bg-olive dark:bg-dark-olive text-white rounded-[4px] text-[14px] font-medium hover:opacity-90 transition-opacity"
              >
                Unirme a {householdName}
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full py-3 border border-line dark:border-dark-line text-muted dark:text-dark-muted rounded-[4px] text-[14px] hover:text-ink dark:hover:text-dark-ink transition-colors bg-surface dark:bg-dark-surface"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {status === 'joining' && (
          <div className="py-12">
            <div className="w-8 h-8 border-2 border-olive/30 border-t-olive dark:border-t-dark-olive rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[13px] text-muted dark:text-dark-muted">Uniéndote al hogar…</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircle size={40} className="text-olive dark:text-dark-olive mx-auto mb-4" />
            <h2 className="text-[24px] font-light text-ink dark:text-dark-ink mb-3">¡Bienvenido!</h2>
            <p className="text-[13px] text-muted dark:text-dark-muted mb-8">Te uniste correctamente a {householdName}.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium hover:opacity-80 transition-opacity"
            >
              Ir al hogar
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <AlertCircle size={40} className="text-terracotta dark:text-dark-terracotta mx-auto mb-4" />
            <h2 className="text-[24px] font-light text-ink dark:text-dark-ink mb-3">Invitación no disponible</h2>
            <p className="text-[13px] text-muted dark:text-dark-muted mb-8 leading-relaxed">
              {errorMessage || 'El código expiró o no es válido. Pedile una nueva invitación al administrador.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 border border-line dark:border-dark-line rounded-[4px] text-[14px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors bg-surface dark:bg-dark-surface"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
