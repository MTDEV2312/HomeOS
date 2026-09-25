'use client'

import React from 'react'
import { useRouter, Link } from '@/lib/navigation'
import { ArrowRight } from 'lucide-react'

const features = [
  { num: '01', title: 'TAREAS', desc: 'Organizá el trabajo cotidiano de tu hogar. Asigná responsables, establecé prioridades y seguí el progreso en tiempo real.' },
  { num: '02', title: 'COMPRAS', desc: 'Sabé qué necesitás antes de salir. Listas compartidas, categorías y sincronización en tiempo real.' },
  { num: '03', title: 'GASTOS', desc: 'Entendé cómo se mueve el dinero. Registrá, dividí y administrá presupuestos por categoría.' },
  { num: '04', title: 'INVENTARIO', desc: 'Lo que tenés. Lo que falta. Alertas antes de quedarte sin algo importante.' },
  { num: '05', title: 'MANTENIMIENTO', desc: 'Cuidá tu casa antes de que algo falle. Activos, programaciones e historial completo.' },
  { num: '06', title: 'DOCUMENTOS', desc: 'Todo lo importante en un solo lugar. Garantías, facturas, contratos y manuales.' },
]

export default function Landing() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 dark:bg-dark-bg/90 backdrop-blur-sm border-b border-line dark:border-dark-line">
        <div className="max-w-[1280px] mx-auto px-8 lg:px-16 h-14 flex items-center justify-between">
          <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink dark:text-dark-ink flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-olive dark:bg-dark-olive" />
            HomeOS
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/help" className="hidden sm:block text-[13px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors">
              Ayuda
            </Link>
            <button
              onClick={() => router.push('/login')}
              className="text-[13px] font-medium text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="text-[13px] font-medium bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg px-4 py-2 rounded-[4px] hover:opacity-80 transition-opacity"
            >
              Crear mi hogar
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-8 lg:px-16 max-w-[1280px] mx-auto">
        <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-end">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-olive dark:text-dark-olive mb-6">
              Sistema operativo para el hogar
            </p>
            <h1 className="text-[56px] sm:text-[72px] lg:text-[88px] font-light leading-[0.95] tracking-[-0.03em] text-ink dark:text-dark-ink mb-8">
              Todo lo que<br />
              <em className="not-italic font-semibold">mantiene tu hogar</em><br />
              en marcha.
            </h1>
            <p className="text-[16px] text-muted dark:text-dark-muted max-w-md leading-relaxed mb-10">
              Tareas, compras, gastos, inventario, mantenimiento y documentos. En un solo lugar, para todos los que viven bajo ese techo.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/signup')}
                className="inline-flex items-center gap-2 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg px-7 py-3.5 rounded-[4px] text-[14px] font-medium hover:opacity-80 transition-opacity"
              >
                Crear mi hogar <ArrowRight size={15} />
              </button>
              <button
                onClick={() => router.push('/login')}
                className="text-[14px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors border-b border-muted/40 pb-0.5"
              >
                Entrar
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="w-72 h-80 rounded-[6px] overflow-hidden border border-line dark:border-dark-line bg-sage-soft dark:bg-dark-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=576&h=640&fit=crop&auto=format"
                alt="Interior doméstico contemporáneo"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-line dark:border-dark-line max-w-[1280px] mx-auto px-8 lg:px-16" />

      {/* Features - editorial sequence */}
      <section className="py-20 max-w-[1280px] mx-auto px-8 lg:px-16">
        <div className="mb-16">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-3">Qué incluye</p>
          <h2 className="text-[36px] lg:text-[48px] font-light tracking-[-0.02em] text-ink dark:text-dark-ink">Diseñado para el hogar real.</h2>
        </div>

        <div className="space-y-0">
          {features.map((f, i) => (
            <div
              key={f.num}
              className={`flex flex-col sm:flex-row items-start gap-8 py-10 border-t border-line dark:border-dark-line ${i % 2 === 1 ? 'sm:flex-row-reverse' : ''}`}
            >
              <div className="shrink-0 sm:w-56">
                <span className="text-[11px] font-mono text-olive dark:text-dark-olive">{f.num}</span>
                <h3 className="text-[28px] font-semibold tracking-[-0.01em] text-ink dark:text-dark-ink mt-1">{f.title}</h3>
              </div>
              <div className="flex-1 sm:pt-6">
                <p className="text-[15px] text-muted dark:text-dark-muted leading-relaxed max-w-md">{f.desc}</p>
              </div>
              {i % 2 === 0 && (
                <div className="hidden sm:block w-48 h-32 rounded-[4px] overflow-hidden border border-line dark:border-dark-line bg-sand dark:bg-dark-surface shrink-0" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="border-t border-line dark:border-dark-line">
        <div className="max-w-[1280px] mx-auto px-8 lg:px-16 py-24 lg:py-36">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-4">Empezá hoy</p>
            <h2 className="text-[48px] sm:text-[64px] font-light leading-[0.95] tracking-[-0.03em] text-ink dark:text-dark-ink mb-10">
              TU CASA,<br />
              <strong className="font-semibold">EN ORDEN.</strong>
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/signup')}
                className="inline-flex items-center gap-2 bg-olive dark:bg-dark-olive text-surface px-8 py-4 rounded-[4px] text-[15px] font-medium hover:opacity-90 transition-opacity"
              >
                Crear mi hogar <ArrowRight size={16} />
              </button>
              <button
                onClick={() => router.push('/login')}
                className="text-[14px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
              >
                Ya tengo cuenta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line dark:border-dark-line">
        <div className="max-w-[1280px] mx-auto px-8 lg:px-16 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[12px] text-muted dark:text-dark-muted flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-olive dark:bg-dark-olive" />
            HomeOS © 2026
          </span>
          <div className="flex items-center gap-6">
            {[
              ['Inicio', '/'],
              ['Entrar', '/login'],
              ['Registrarse', '/signup'],
              ['Términos', '/terms'],
              ['Privacidad', '/privacy'],
              ['Ayuda', '/help']
            ].map(([label, href]) => (
              <Link key={href} href={href} className="text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
