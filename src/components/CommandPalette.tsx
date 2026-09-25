'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from '@/lib/navigation'
import {
  Search, CheckSquare, ShoppingCart, DollarSign, Package,
  FileText, Users, Home, X, Building2, Wrench, BarChart2,
  Settings, HelpCircle
} from 'lucide-react'

interface Props {
  onClose: () => void
}

const searchItems = [
  { group: 'Páginas', icon: Home, label: 'Inicio', to: '/dashboard' },
  { group: 'Páginas', icon: Building2, label: 'Mi residencia', to: '/dashboard/household' },
  { group: 'Páginas', icon: Users, label: 'Miembros', to: '/dashboard/members' },
  { group: 'Páginas', icon: CheckSquare, label: 'Tareas', to: '/dashboard/tasks' },
  { group: 'Páginas', icon: ShoppingCart, label: 'Compras', to: '/dashboard/shopping' },
  { group: 'Páginas', icon: DollarSign, label: 'Gastos', to: '/dashboard/expenses' },
  { group: 'Páginas', icon: Package, label: 'Inventario', to: '/dashboard/inventory' },
  { group: 'Páginas', icon: Wrench, label: 'Mantenimiento', to: '/dashboard/maintenance' },
  { group: 'Páginas', icon: FileText, label: 'Documentos', to: '/dashboard/documents' },
  { group: 'Páginas', icon: BarChart2, label: 'Reportes', to: '/dashboard/reports' },
  { group: 'Páginas', icon: Settings, label: 'Configuración', to: '/dashboard/settings' },
  { group: 'Páginas', icon: HelpCircle, label: 'Ayuda', to: '/help' },
  { group: 'Tareas', icon: CheckSquare, label: 'Limpiar el filtro de la campana', to: '/dashboard/tasks' },
  { group: 'Tareas', icon: CheckSquare, label: 'Pagar las expensas', to: '/dashboard/tasks' },
  { group: 'Documentos', icon: FileText, label: 'Garantía — Heladera Samsung', to: '/dashboard/documents' },
  { group: 'Documentos', icon: FileText, label: 'Factura electricidad — Octubre 2026', to: '/dashboard/documents' },
  { group: 'Gastos', icon: DollarSign, label: 'Supermercado Disco — $ 18.400', to: '/dashboard/expenses' },
]

export default function CommandPalette({ onClose }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered = searchItems.filter(item =>
    !query || item.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected(s => Math.min(s + 1, Math.max(0, filtered.length - 1)))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected(s => Math.max(s - 1, 0))
      }
      if (e.key === 'Enter' && filtered[selected]) {
        e.preventDefault()
        router.push(filtered[selected].to)
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [filtered, selected, onClose, router])

  const groups = Array.from(new Set(filtered.map(i => i.group)))

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/30 dark:bg-black/60 backdrop-blur-xs" />
      <div
        className="relative w-full max-w-xl bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[8px] shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line dark:border-dark-line">
          <Search size={16} className="text-muted dark:text-dark-muted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelected(0)
            }}
            placeholder="Buscar tareas, gastos, documentos…"
            className="flex-1 text-[14px] text-ink dark:text-dark-ink bg-transparent outline-none placeholder:text-muted dark:placeholder:text-dark-muted"
          />
          <button
            onClick={onClose}
            className="p-1 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-muted dark:text-dark-muted">
              Sin resultados para &ldquo;{query}&rdquo;
            </div>
          ) : (
            groups.map(group => {
              const groupItems = filtered.filter(i => i.group === group)
              return (
                <div key={group}>
                  <div className="px-4 py-1.5 text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
                    {group}
                  </div>
                  {groupItems.map((item) => {
                    const globalIdx = filtered.indexOf(item)
                    return (
                      <button
                        key={`${item.group}-${item.label}-${globalIdx}`}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          globalIdx === selected
                            ? 'bg-olive-soft dark:bg-dark-olive-soft text-olive dark:text-dark-olive'
                            : 'text-ink dark:text-dark-ink hover:bg-bg dark:hover:bg-dark-bg'
                        }`}
                        onMouseEnter={() => setSelected(globalIdx)}
                        onClick={() => {
                          router.push(item.to)
                          onClose()
                        }}
                      >
                        <item.icon size={14} className="flex-shrink-0 text-muted dark:text-dark-muted" />
                        <span className="text-[13px]">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-line dark:border-dark-line flex items-center gap-4 text-[11px] text-muted dark:text-dark-muted">
          <span><kbd className="font-mono bg-bg dark:bg-dark-bg px-1 py-0.5 rounded border border-line dark:border-dark-line">↑↓</kbd> navegar</span>
          <span><kbd className="font-mono bg-bg dark:bg-dark-bg px-1 py-0.5 rounded border border-line dark:border-dark-line">↵</kbd> abrir</span>
          <span><kbd className="font-mono bg-bg dark:bg-dark-bg px-1 py-0.5 rounded border border-line dark:border-dark-line">Esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  )
}
