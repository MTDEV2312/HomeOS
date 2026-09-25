'use client'

import React from 'react'
import { useRouter } from '@/lib/navigation'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg flex flex-col items-center justify-center px-8 font-sans">
      <div className="text-center max-w-md">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-6">Error 404</p>
        <h1 className="text-[56px] lg:text-[80px] font-light leading-[0.9] tracking-[-0.03em] text-ink dark:text-dark-ink mb-6">
          Esta página<br />
          <em className="not-italic font-semibold">se perdió</em><br />
          en el camino.
        </h1>
        <p className="text-[14px] text-muted dark:text-dark-muted mb-10 leading-relaxed">
          No pudimos encontrar lo que buscabas. Puede que la dirección haya cambiado o que la página no exista.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[13px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Volver
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity cursor-pointer"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
