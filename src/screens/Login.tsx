'use client'

import React, { useState } from 'react'
import { useRouter } from '@/lib/navigation'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/context/ToastContext'

export default function Login() {
  const router = useRouter()
  const { signIn } = useAuth()
  const { toast } = useToast()

  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { error } = await signIn(email, password)
      if (error) {
        const msg = error.message || 'Error al iniciar sesión. Verificá tus credenciales.'
        setErrorMsg(msg)
        toast(msg, 'error')
        setLoading(false)
        return
      }

      toast('¡Bienvenido de vuelta!', 'success')
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setErrorMsg(msg)
      toast(msg, 'error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg grid lg:grid-cols-2">
      {/* Left - editorial */}
      <div className="hidden lg:flex flex-col justify-between bg-ink dark:bg-dark-surface p-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=1000&fit=crop&auto=format)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative z-10">
          <span className="text-[14px] font-semibold tracking-tight text-surface/70 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-olive" />
            HomeOS
          </span>
        </div>
        <div className="relative z-10">
          <p className="text-[72px] font-light leading-[0.9] tracking-[-0.03em] text-surface mb-8">
            TU CASA.<br />
            <span className="font-semibold">TU ESPACIO.</span><br />
            TU RITMO.
          </p>
          <p className="text-[14px] text-surface/50 leading-relaxed max-w-xs">
            Todo lo que necesitás para que tu hogar funcione, en un solo lugar.
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-[11px] text-surface/30 tracking-widest uppercase">Sistema operativo para el hogar</p>
        </div>
      </div>

      {/* Right - form */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-16">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-10">
            <div className="lg:hidden mb-8">
              <span className="text-[14px] font-semibold text-ink dark:text-dark-ink flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-olive dark:bg-dark-olive" />
                HomeOS
              </span>
            </div>
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted dark:text-dark-muted mb-2">Bienvenido de vuelta</p>
            <h1 className="text-[28px] font-light tracking-[-0.02em] text-ink dark:text-dark-ink">Iniciar sesión</h1>
          </div>

          {errorMsg && (
            <div className="mb-5 px-3.5 py-2.5 rounded-[4px] bg-terracotta-bg border border-terracotta text-terracotta dark:bg-dark-surface dark:border-dark-terracotta dark:text-dark-terracotta text-[13px]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[14px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface placeholder:text-muted/50 dark:placeholder:text-dark-muted/50 focus:outline-none focus:border-olive dark:focus:border-dark-olive transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 border border-line dark:border-dark-line rounded-[4px] text-[14px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface placeholder:text-muted/50 focus:outline-none focus:border-olive dark:focus:border-dark-olive transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted dark:text-dark-muted"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[14px] font-medium inline-flex items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
              ) : (
                <><span>Iniciar sesión</span> <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-line dark:border-dark-line text-center">
            <p className="text-[13px] text-muted dark:text-dark-muted">
              ¿Aún no tenés cuenta?{' '}
              <button
                onClick={() => router.push('/signup')}
                className="text-ink dark:text-dark-ink font-medium hover:text-olive dark:hover:text-dark-olive transition-colors"
              >
                Crear mi hogar
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
