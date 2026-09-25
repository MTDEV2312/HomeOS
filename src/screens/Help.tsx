'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Send, CheckCircle } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

const sections = [
  { title: 'Primeros pasos', items: ['Crear tu hogar', 'Invitar miembros', 'Explorar el dashboard', 'Configurar tu perfil'] },
  { title: 'Mi residencia y miembros', items: ['Editar el nombre del hogar', 'Cambiar roles', 'Regenerar código de invitación', 'Abandonar o eliminar un hogar'] },
  { title: 'Tareas', items: ['Crear una tarea', 'Asignar responsables', 'Tareas recurrentes', 'Filtrar por estado o prioridad'] },
  { title: 'Compras', items: ['Crear una lista', 'Agregar ítems', 'Marcar como comprado', 'Agregar desde inventario'] },
  { title: 'Gastos', items: ['Registrar un gasto', 'Dividir entre miembros', 'Configurar presupuesto', 'Ver reportes'] },
  { title: 'Inventario', items: ['Agregar un ítem', 'Configurar stock mínimo', 'Alertas de vencimiento', 'Agregar a la lista de compras'] },
  { title: 'Mantenimiento', items: ['Registrar un activo', 'Programar mantenimiento', 'Ver historial', 'Gestionar garantías'] },
  { title: 'Documentos', items: ['Subir un documento', 'Categorizar archivos', 'Vincular con activos', 'Descargar y previsualizar'] },
]

const faq = [
  { q: '¿Cuántos hogares puedo administrar?', a: 'Podés pertenecer a varios hogares y cambiar entre ellos desde el selector en la barra superior o lateral.' },
  { q: '¿Cómo invito a alguien?', a: 'Vas a Mi residencia → Código de invitación, copiás el código o el enlace y lo compartís.' },
  { q: '¿Los datos son privados?', a: 'Sí. Cada hogar tiene su propio espacio aislado. Solo los miembros del hogar pueden ver los datos.' },
  { q: '¿Puedo usar HomeOS en el celular?', a: 'Sí. HomeOS está completamente optimizado para dispositivos móviles con una interfaz táctil adaptada.' },
]

const shortcuts = [
  { key: '⌘K / Ctrl+K', desc: 'Abrir búsqueda global' },
  { key: '/', desc: 'Abrir búsqueda global (desde cualquier campo sin foco)' },
  { key: 'Esc', desc: 'Cerrar modales y drawers' },
  { key: '↑↓', desc: 'Navegar en la command palette' },
  { key: '↵', desc: 'Seleccionar resultado en búsqueda' },
]

export default function Help() {
  const { toast } = useToast()
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [form, setForm] = useState({ category: 'General', message: '' })
  const [sent, setSent] = useState(false)

  const sendForm = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
    toast('Consulta enviada. Te responderemos pronto.', 'success')
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto font-sans">
      {/* Header */}
      <div className="mb-12 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-3">
          Centro de ayuda
        </p>
        <h1 className="text-[40px] lg:text-[56px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">
          AYUDA
        </h1>
        <p className="text-[15px] text-muted dark:text-dark-muted mt-4 max-w-lg leading-relaxed">
          Todo lo que necesitás para aprovechar HomeOS al máximo.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-12 items-start">
        <div>
          {/* Sections */}
          <h2 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-ink dark:text-dark-ink mb-5">
            Guías
          </h2>
          <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden mb-10 bg-surface dark:bg-dark-surface">
            {sections.map((s, i) => (
              <div key={s.title} className={i > 0 ? 'border-t border-line dark:border-dark-line' : ''}>
                <button
                  onClick={() => setOpenSection(openSection === s.title ? null : s.title)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg dark:hover:bg-dark-bg transition-colors"
                >
                  <span className="text-[14px] font-medium text-ink dark:text-dark-ink">{s.title}</span>
                  {openSection === s.title ? (
                    <ChevronDown size={15} className="text-muted dark:text-dark-muted" />
                  ) : (
                    <ChevronRight size={15} className="text-muted dark:text-dark-muted" />
                  )}
                </button>
                {openSection === s.title && (
                  <div className="px-5 pb-4 space-y-2 border-t border-line/40 dark:border-dark-line/40 pt-3">
                    {s.items.map(item => (
                      <div key={item} className="text-[13px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors py-1 cursor-pointer">
                        → {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* FAQ */}
          <h2 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-ink dark:text-dark-ink mb-5">
            Preguntas frecuentes
          </h2>
          <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden mb-10 bg-surface dark:bg-dark-surface">
            {faq.map((f, i) => (
              <div key={f.q} className={i > 0 ? 'border-t border-line dark:border-dark-line' : ''}>
                <button
                  onClick={() => setOpenFaq(openFaq === f.q ? null : f.q)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg dark:hover:bg-dark-bg"
                >
                  <span className="text-[14px] font-medium text-ink dark:text-dark-ink pr-4">{f.q}</span>
                  {openFaq === f.q ? (
                    <ChevronDown size={14} className="text-muted shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-muted shrink-0" />
                  )}
                </button>
                {openFaq === f.q && (
                  <div className="px-5 pb-4 text-[13px] text-muted dark:text-dark-muted leading-relaxed border-t border-line/40 dark:border-dark-line/40 pt-3">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Shortcuts */}
          <h2 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-ink dark:text-dark-ink mb-5">
            Atajos de teclado
          </h2>
          <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden bg-surface dark:bg-dark-surface">
            {shortcuts.map((s, i) => (
              <div
                key={s.key}
                className={`flex items-center gap-4 px-5 py-3.5 ${i > 0 ? 'border-t border-line dark:border-dark-line' : ''}`}
              >
                <kbd className="font-mono text-[11px] bg-bg dark:bg-dark-bg border border-line dark:border-dark-line px-2 py-0.5 rounded text-ink dark:text-dark-ink shrink-0 whitespace-nowrap">
                  {s.key}
                </kbd>
                <span className="text-[13px] text-muted dark:text-dark-muted">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Support form */}
        <div>
          <div className="border border-line dark:border-dark-line rounded-[6px] overflow-hidden sticky top-20 bg-surface dark:bg-dark-surface shadow-xs">
            <div className="px-5 py-4 border-b border-line dark:border-dark-line bg-bg dark:bg-dark-bg">
              <h3 className="text-[12px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
                ¿Necesitás ayuda?
              </h3>
            </div>
            <div className="p-5">
              {sent ? (
                <div className="text-center py-6">
                  <CheckCircle size={28} className="text-olive dark:text-dark-olive mx-auto mb-3" />
                  <p className="text-[14px] font-medium text-ink dark:text-dark-ink mb-1">Consulta enviada</p>
                  <p className="text-[12px] text-muted dark:text-dark-muted">Te responderemos a la brevedad.</p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-4 text-[12px] text-muted dark:text-dark-muted hover:text-ink transition-colors underline"
                  >
                    Enviar otra consulta
                  </button>
                </div>
              ) : (
                <form onSubmit={sendForm} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                      Categoría
                    </label>
                    <select
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface focus:outline-none focus:border-olive"
                    >
                      {['General', 'Gastos', 'Tareas', 'Inventario', 'Documentos', 'Cuenta', 'Error técnico'].map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                      Mensaje
                    </label>
                    <textarea
                      required
                      value={form.message}
                      onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="Describí tu consulta o problema…"
                      rows={5}
                      className="w-full px-3 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface placeholder:text-muted/40 focus:outline-none focus:border-olive resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity"
                  >
                    <Send size={13} /> Enviar consulta
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
