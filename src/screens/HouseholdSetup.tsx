'use client'

import React, { useState } from 'react'
import { useRouter, Link } from '@/lib/navigation'
import { Home, Key, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useHousehold } from '@/lib/household-context'
import { createHousehold, joinHousehold } from '@/services/householdService'
import { useToast } from '@/context/ToastContext'

export default function HouseholdSetup() {
  const router = useRouter()
  const { user } = useAuth()
  const { refreshHousehold } = useHousehold()
  const { toast } = useToast()

  const [mode, setMode] = useState<'create' | 'join' | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (!user) {
      toast('Debes iniciar sesión para crear un hogar', 'error')
      router.push('/login')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      await createHousehold(name.trim(), user.id)
      await refreshHousehold()
      toast('¡Hogar creado con éxito!', 'success')
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear el hogar'
      setErrorMsg(msg)
      toast(msg, 'error')
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setErrorMsg('')
    try {
      await joinHousehold(code.trim().toUpperCase())
      await refreshHousehold()
      toast('¡Te has unido al hogar exitosamente!', 'success')
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al unirse al hogar. Verificá el código.'
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

        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted dark:text-dark-muted mb-2">Último paso</p>
        <h1 className="text-[28px] font-light tracking-[-0.02em] text-ink dark:text-dark-ink mb-3">Tu hogar</h1>
        <p className="text-[13px] text-muted dark:text-dark-muted mb-8 leading-relaxed">
          Creá un hogar nuevo o unite a uno existente con un código de invitación.
        </p>

        {errorMsg && (
          <div className="mb-5 px-3.5 py-2.5 rounded-[4px] bg-terracotta-bg border border-terracotta text-terracotta dark:bg-dark-surface dark:border-dark-terracotta dark:text-dark-terracotta text-[13px]">
            {errorMsg}
          </div>
        )}

        {!mode && (
          <div className="space-y-3">
            <button
              onClick={() => { setMode('create'); setErrorMsg('') }}
              className="w-full flex items-center gap-4 p-4 border border-line dark:border-dark-line rounded-[6px] text-left hover:border-olive dark:hover:border-dark-olive hover:bg-olive-soft dark:hover:bg-dark-olive-soft transition-colors group bg-surface dark:bg-dark-surface"
            >
              <div className="w-10 h-10 bg-olive-soft dark:bg-dark-olive-soft rounded-[4px] flex items-center justify-center shrink-0">
                <Home size={18} className="text-olive dark:text-dark-olive" />
              </div>
              <div>
                <div className="text-[14px] font-medium text-ink dark:text-dark-ink">Crear un hogar</div>
                <div className="text-[12px] text-muted dark:text-dark-muted">Nuevo espacio para vos y tu familia</div>
              </div>
            </button>
            <button
              onClick={() => { setMode('join'); setErrorMsg('') }}
              className="w-full flex items-center gap-4 p-4 border border-line dark:border-dark-line rounded-[6px] text-left hover:border-olive dark:hover:border-dark-olive hover:bg-olive-soft dark:hover:bg-dark-olive-soft transition-colors group bg-surface dark:bg-dark-surface"
            >
              <div className="w-10 h-10 bg-sand-bg dark:bg-dark-surface-2 rounded-[4px] flex items-center justify-center shrink-0">
                <Key size={18} className="text-muted dark:text-dark-muted" />
              </div>
              <div>
                <div className="text-[14px] font-medium text-ink dark:text-dark-ink">Unirme a uno existente</div>
                <div className="text-[12px] text-muted dark:text-dark-muted">Usá un código de invitación</div>
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Nombre del hogar</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Casa Terán"
                className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[14px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface placeholder:text-muted/40 focus:outline-none focus:border-olive dark:focus:border-dark-olive"
              />
              <p className="text-[11px] text-muted dark:text-dark-muted mt-1.5">Podés cambiarlo después desde Mi residencia.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-olive dark:bg-dark-olive text-white rounded-[4px] text-[14px] font-medium inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Crear hogar</span> <ArrowRight size={15} /></>}
            </button>
            <button
              type="button"
              onClick={() => { setMode(null); setErrorMsg('') }}
              className="w-full text-center text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
            >
              Volver
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Código de invitación</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                required
                placeholder="TERAN-8X2"
                className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[16px] font-mono tracking-widest text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface placeholder:text-muted/40 focus:outline-none focus:border-olive dark:focus:border-dark-olive uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium inline-flex items-center justify-center gap-2 hover:opacity-80 disabled:opacity-50"
            >
              {loading ? <span className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" /> : <><span>Unirme</span> <ArrowRight size={15} /></>}
            </button>
            <button
              type="button"
              onClick={() => { setMode(null); setErrorMsg('') }}
              className="w-full text-center text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
            >
              Volver
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
