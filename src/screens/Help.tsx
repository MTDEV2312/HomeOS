'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from '@/lib/navigation'
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Send,
  CheckCircle,
  ArrowRight,
  Info,
  Shield,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Check,
  AlertTriangle,
  Layers,
  Compass,
  DollarSign,
  CheckSquare,
  Home,
  ShoppingCart,
  Wrench,
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import {
  helpCategories,
  helpGuides,
  quickStartSteps,
  rolePermissions,
  troubleshootingItems,
  faqList,
  keyboardShortcuts,
  HelpGuide,
} from '@/data/helpContent'

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export default function Help() {
  const router = useRouter()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [openGuides, setOpenGuides] = useState<Record<string, boolean>>({
    'guide-expenses-monthly': true, // Open the first guide by default
  })
  const [openTroubleshoot, setOpenTroubleshoot] = useState<Record<string, boolean>>({})
  const [openFaq, setOpenFaq] = useState<Record<string, boolean>>({})

  // Support Form State
  const [form, setForm] = useState({ category: 'General', message: '', email: '' })
  const [sent, setSent] = useState(false)

  const toggleGuide = (id: string) => {
    setOpenGuides(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleTroubleshoot = (id: string) => {
    setOpenTroubleshoot(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleFaq = (id: string) => {
    setOpenFaq(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
  }

  const sendForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.message.trim()) {
      toast('Por favor, describí tu consulta antes de enviar.')
      return
    }
    setSent(true)
    toast('Consulta enviada. El equipo de soporte o tu administrador te responderán pronto.')
  }

  // Filtered Guides
  const filteredGuides = useMemo(() => {
    const q = normalizeText(searchQuery)
    return helpGuides.filter(g => {
      const matchesCategory = selectedCategory === 'all' || g.categoryId === selectedCategory
      if (!matchesCategory) return false

      if (!q) return true

      const inTitle = normalizeText(g.title).includes(q)
      const inSummary = normalizeText(g.summary).includes(q)
      const inSteps = g.steps.some(s => normalizeText(s).includes(q))
      const inKeywords = g.keywords.some(k => normalizeText(k).includes(q))

      return inTitle || inSummary || inSteps || inKeywords
    })
  }, [searchQuery, selectedCategory])

  // Filtered Troubleshooting
  const filteredTroubleshoot = useMemo(() => {
    const q = normalizeText(searchQuery)
    return troubleshootingItems.filter(t => {
      const matchesCategory = selectedCategory === 'all' || selectedCategory === 'troubleshooting'
      if (!matchesCategory) return false

      if (!q) return true

      const inTitle = normalizeText(t.title).includes(q)
      const inSymptom = normalizeText(t.symptom).includes(q)
      const inCause = normalizeText(t.cause).includes(q)
      const inKeywords = t.keywords.some(k => normalizeText(k).includes(q))

      return inTitle || inSymptom || inCause || inKeywords
    })
  }, [searchQuery, selectedCategory])

  // Filtered FAQ
  const filteredFaq = useMemo(() => {
    const q = normalizeText(searchQuery)
    return faqList.filter(f => {
      const matchesCategory = selectedCategory === 'all' || f.categoryId === selectedCategory
      if (!matchesCategory) return false

      if (!q) return true

      const inQuestion = normalizeText(f.question).includes(q)
      const inAnswer = normalizeText(f.answer).includes(q)
      const inKeywords = f.keywords.some(k => normalizeText(k).includes(q))

      return inQuestion || inAnswer || inKeywords
    })
  }, [searchQuery, selectedCategory])

  const totalResults = filteredGuides.length + filteredTroubleshoot.length + filteredFaq.length

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers': return <Layers size={13} />
      case 'Compass': return <Compass size={13} />
      case 'DollarSign': return <DollarSign size={13} />
      case 'CheckSquare': return <CheckSquare size={13} />
      case 'Home': return <Home size={13} />
      case 'ShoppingCart': return <ShoppingCart size={13} />
      case 'Wrench': return <Wrench size={13} />
      case 'Shield': return <Shield size={13} />
      case 'AlertTriangle': return <AlertTriangle size={13} />
      default: return <HelpCircle size={13} />
    }
  }

  return (
    <div className="w-full min-w-0 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-[1280px] mx-auto font-sans">
      {/* Header */}
      <div className="mb-8 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">
          Documentación y Soporte
        </p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-[32px] sm:text-[38px] lg:text-[52px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">
              CENTRO DE<br />AYUDA
            </h1>
            <p className="text-[14px] text-muted dark:text-dark-muted mt-3 max-w-xl">
              Guías paso a paso, respuestas a dudas comunes y explicación del funcionamiento real de HomeOS.
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-olive/10 text-olive dark:text-dark-olive">
              <Sparkles size={13} /> Sistema 100% Operativo
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-8 relative max-w-2xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted dark:text-dark-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Busca por tema: 'presupuesto mensual', 'tareas urgentes', 'invitar', 'roles'..."
            className="w-full pl-11 pr-10 py-3.5 bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[6px] text-[14px] text-ink dark:text-dark-ink placeholder:text-muted/60 focus:outline-none focus:border-olive transition-colors shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink dark:hover:text-dark-ink p-1"
              title="Borrar búsqueda"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {helpCategories.map(cat => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-ink text-surface dark:bg-dark-ink dark:text-dark-bg shadow-xs'
                    : 'bg-surface dark:bg-dark-surface border border-line dark:border-dark-line text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink'
                }`}
              >
                {getCategoryIcon(cat.iconName)}
                <span>{cat.name}</span>
              </button>
            )
          })}
        </div>

        {/* Filter Feedback */}
        {(searchQuery || selectedCategory !== 'all') && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted dark:text-dark-muted min-w-0">
            <span className="min-w-0">
              Mostrando <strong>{totalResults}</strong> resultado{totalResults === 1 ? '' : 's'}
              {searchQuery && <> para &quot;<strong>{searchQuery}</strong>&quot;</>}
            </span>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-olive dark:text-dark-olive hover:underline cursor-pointer shrink-0"
            >
              <RotateCcw size={12} /> Restablecer filtros
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8 lg:gap-10 items-start min-w-0">
        {/* Main Content Area */}
        <div className="space-y-10 min-w-0">
          {/* Quick Start Cards (Only when no active query or on QuickStart/All) */}
          {!searchQuery && (selectedCategory === 'all' || selectedCategory === 'quickstart') && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Compass size={16} className="text-olive" />
                <h2 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-ink dark:text-dark-ink">
                  Guía de Inicio Rápido
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {quickStartSteps.map(step => (
                  <div
                    key={step.step}
                    className="p-5 border border-line dark:border-dark-line rounded-[6px] bg-surface dark:bg-dark-surface hover:border-olive/50 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-6 h-6 rounded-full bg-olive/10 text-olive dark:text-dark-olive text-[11px] font-bold flex items-center justify-center">
                          {step.step}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">
                          Paso {step.step}
                        </span>
                      </div>
                      <h3 className="text-[14px] font-medium text-ink dark:text-dark-ink mb-1.5">
                        {step.title}
                      </h3>
                      <p className="text-[12px] text-muted dark:text-dark-muted leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(step.route)}
                      className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-olive dark:text-dark-olive hover:opacity-80 transition-opacity cursor-pointer self-start"
                    >
                      <span>{step.routeLabel}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Step-by-Step Guides */}
          {filteredGuides.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare size={16} className="text-olive" />
                <h2 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-ink dark:text-dark-ink">
                  Guías Paso a Paso ({filteredGuides.length})
                </h2>
              </div>
              <div className="border border-line dark:border-dark-line rounded-[6px] overflow-hidden bg-surface dark:bg-dark-surface">
                {filteredGuides.map((guide, idx) => {
                  const isOpen = !!openGuides[guide.id]
                  return (
                    <div
                      key={guide.id}
                      className={idx > 0 ? 'border-t border-line dark:border-dark-line' : ''}
                    >
                      <button
                        type="button"
                        onClick={() => toggleGuide(guide.id)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg dark:hover:bg-dark-bg transition-colors cursor-pointer"
                      >
                        <div className="pr-4 min-w-0 flex-1">
                          <span className="text-[14px] font-medium text-ink dark:text-dark-ink block truncate">
                            {guide.title}
                          </span>
                          <span className="text-[12px] text-muted dark:text-dark-muted mt-0.5 block line-clamp-1">
                            {guide.summary}
                          </span>
                        </div>
                        <div className="text-muted shrink-0 ml-2">
                          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-6 pt-2 border-t border-line/40 dark:border-dark-line/40 bg-bg/40 dark:bg-dark-bg/20 space-y-4">
                          <p className="text-[13px] text-ink/80 dark:text-dark-ink/80 leading-relaxed">
                            {guide.summary}
                          </p>

                          {/* Numbered Steps */}
                          <div className="space-y-2.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted block">
                              Procedimiento:
                            </span>
                            {guide.steps.map((st, i) => (
                              <div key={i} className="flex items-start gap-3 text-[13px] text-ink dark:text-dark-ink">
                                <span className="w-5 h-5 rounded-full bg-olive/15 text-olive dark:text-dark-olive text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="leading-snug break-words min-w-0 flex-1">{st}</span>
                              </div>
                            ))}
                          </div>

                          {/* Tip Box */}
                          {guide.tip && (
                            <div className="flex items-start gap-2.5 p-3 rounded-[4px] bg-olive/10 dark:bg-dark-olive/10 border border-olive/20 text-[12px] text-ink dark:text-dark-ink leading-relaxed">
                              <Info size={15} className="text-olive dark:text-dark-olive shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <strong className="font-semibold text-olive dark:text-dark-olive">Nota importante: </strong>
                                {guide.tip}
                              </div>
                            </div>
                          )}

                          {/* Direct CTA Link */}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => router.push(guide.route)}
                              className="inline-flex items-center gap-2 px-3.5 py-2 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[12px] font-medium hover:opacity-85 transition-opacity cursor-pointer"
                            >
                              <span>{guide.routeLabel}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section: Roles & Permissions Matrix */}
          {(selectedCategory === 'all' || selectedCategory === 'permissions') && !searchQuery && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield size={16} className="text-olive" />
                <h2 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-ink dark:text-dark-ink">
                  Matriz de Roles y Permisos en el Hogar
                </h2>
              </div>
              <div className="border border-line dark:border-dark-line rounded-[6px] overflow-hidden bg-surface dark:bg-dark-surface max-w-full">
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full text-left border-collapse min-w-[540px] text-[12px]">
                    <thead>
                      <tr className="border-b border-line dark:border-dark-line bg-bg dark:bg-dark-bg text-muted dark:text-dark-muted font-semibold tracking-wider uppercase text-[10px]">
                        <th className="py-3 px-4">Acción o Facultad</th>
                        <th className="py-3 px-4 text-center">Owner (Propietario)</th>
                        <th className="py-3 px-4 text-center">Admin (Administrador)</th>
                        <th className="py-3 px-4 text-center">Member (Miembro)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line dark:divide-dark-line">
                      {rolePermissions.map((row, i) => (
                        <tr key={i} className="hover:bg-bg/50 dark:hover:bg-dark-bg/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-medium text-ink dark:text-dark-ink block">{row.action}</span>
                            <span className="text-[11px] text-muted dark:text-dark-muted">{row.description}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {typeof row.owner === 'boolean' ? (
                              row.owner ? (
                                <Check size={16} className="text-olive inline-block" />
                              ) : (
                                <X size={16} className="text-muted inline-block" />
                              )
                            ) : (
                              <span className="text-[11px] font-medium text-olive">{row.owner}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {typeof row.admin === 'boolean' ? (
                              row.admin ? (
                                <Check size={16} className="text-olive inline-block" />
                              ) : (
                                <X size={16} className="text-muted inline-block" />
                              )
                            ) : (
                              <span className="text-[11px] font-medium text-ink dark:text-dark-ink">{row.admin}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {typeof row.member === 'boolean' ? (
                              row.member ? (
                                <Check size={16} className="text-olive inline-block" />
                              ) : (
                                <X size={16} className="text-muted inline-block" />
                              )
                            ) : (
                              <span className="text-[11px] text-muted">{row.member}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section: Troubleshooting / Diagnóstico de Problemas */}
          {filteredTroubleshoot.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-terracotta dark:text-dark-terracotta" />
                <h2 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-ink dark:text-dark-ink">
                  Solución de Problemas Frecuentes ({filteredTroubleshoot.length})
                </h2>
              </div>
              <div className="border border-line dark:border-dark-line rounded-[6px] overflow-hidden bg-surface dark:bg-dark-surface space-y-0">
                {filteredTroubleshoot.map((item, i) => {
                  const isOpen = !!openTroubleshoot[item.id]
                  return (
                    <div key={item.id} className={i > 0 ? 'border-t border-line dark:border-dark-line' : ''}>
                      <button
                        type="button"
                        onClick={() => toggleTroubleshoot(item.id)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg dark:hover:bg-dark-bg transition-colors cursor-pointer"
                      >
                        <span className="text-[14px] font-medium text-ink dark:text-dark-ink pr-4 min-w-0 flex-1">
                          {item.title}
                        </span>
                        <div className="text-muted shrink-0 ml-2">
                          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-5 pt-2 border-t border-line/40 dark:border-dark-line/40 bg-bg/40 dark:bg-dark-bg/20 space-y-3">
                          <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted block mb-1">
                              Causa identificada:
                            </span>
                            <p className="text-[13px] text-ink/80 dark:text-dark-ink/80 leading-relaxed">
                              {item.cause}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted block">
                              Pasos de solución:
                            </span>
                            {item.solutionSteps.map((step, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-2.5 text-[12px] text-ink dark:text-dark-ink">
                                <span className="font-mono text-olive font-bold">•</span>
                                <span className="leading-snug break-words min-w-0 flex-1">{step}</span>
                              </div>
                            ))}
                          </div>

                          {item.route && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => router.push(item.route!)}
                                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-olive dark:text-dark-olive hover:underline cursor-pointer"
                              >
                                <span>{item.routeLabel || 'Ir a la sección'}</span>
                                <ArrowRight size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section: Frequently Asked Questions */}
          {filteredFaq.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={16} className="text-olive" />
                <h2 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-ink dark:text-dark-ink">
                  Preguntas Frecuentes ({filteredFaq.length})
                </h2>
              </div>
              <div className="border border-line dark:border-dark-line rounded-[6px] overflow-hidden bg-surface dark:bg-dark-surface">
                {filteredFaq.map((f, i) => {
                  const isOpen = !!openFaq[f.id]
                  return (
                    <div key={f.id} className={i > 0 ? 'border-t border-line dark:border-dark-line' : ''}>
                      <button
                        type="button"
                        onClick={() => toggleFaq(f.id)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg dark:hover:bg-dark-bg transition-colors cursor-pointer"
                      >
                        <span className="text-[14px] font-medium text-ink dark:text-dark-ink pr-4 min-w-0 flex-1">
                          {f.question}
                        </span>
                        <div className="text-muted shrink-0 ml-2">
                          {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 pt-1 text-[13px] text-muted dark:text-dark-muted leading-relaxed border-t border-line/40 dark:border-dark-line/40">
                          {f.answer}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty Search Result State */}
          {totalResults === 0 && (
            <div className="py-16 text-center border border-line dark:border-dark-line rounded-[6px] bg-surface dark:bg-dark-surface p-8">
              <HelpCircle size={32} className="text-muted dark:text-dark-muted mx-auto mb-3 opacity-60" />
              <h3 className="text-[16px] font-medium text-ink dark:text-dark-ink mb-1">
                No encontramos resultados para tu búsqueda
              </h3>
              <p className="text-[13px] text-muted dark:text-dark-muted max-w-md mx-auto mb-5">
                Prueba con palabras más generales (como &quot;gastos&quot;, &quot;tareas&quot; o &quot;miembros&quot;) o limpia los filtros.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[12px] font-medium hover:opacity-85 transition-opacity"
              >
                Limpiar búsqueda y filtros
              </button>
            </div>
          )}
        </div>

        {/* Sidebar: Shortcuts & Support Contact */}
        <div className="space-y-6 min-w-0 w-full">
          {/* Keyboard Shortcuts Card */}
          <div className="border border-line dark:border-dark-line rounded-[6px] overflow-hidden bg-surface dark:bg-dark-surface">
            <div className="px-5 py-4 border-b border-line dark:border-dark-line bg-bg dark:bg-dark-bg">
              <h3 className="text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
                Atajos de Teclado
              </h3>
            </div>
            <div className="p-4 space-y-3 min-w-0">
              {keyboardShortcuts.map((s, i) => (
                <div key={i} className="text-[12px] flex items-center justify-between gap-3 min-w-0">
                  <span className="text-muted dark:text-dark-muted truncate min-w-0">{s.description}</span>
                  <kbd className="font-mono text-[10px] bg-bg dark:bg-dark-bg border border-line dark:border-dark-line px-2 py-0.5 rounded text-ink dark:text-dark-ink shrink-0 whitespace-nowrap">
                    {s.combo}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Support Consultation Form */}
          <div className="border border-line dark:border-dark-line rounded-[6px] overflow-hidden bg-surface dark:bg-dark-surface shadow-xs">
            <div className="px-5 py-4 border-b border-line dark:border-dark-line bg-bg dark:bg-dark-bg">
              <h3 className="text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
                ¿No encuentras lo que buscas?
              </h3>
            </div>
            <div className="p-4 sm:p-5 min-w-0">
              {sent ? (
                <div className="text-center py-6">
                  <CheckCircle size={28} className="text-olive dark:text-dark-olive mx-auto mb-3" />
                  <p className="text-[14px] font-medium text-ink dark:text-dark-ink mb-1">Consulta registrada</p>
                  <p className="text-[12px] text-muted dark:text-dark-muted">
                    Te responderemos o tu administrador recibirá la notificación.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false)
                      setForm({ category: 'General', message: '', email: '' })
                    }}
                    className="mt-4 text-[12px] text-olive dark:text-dark-olive hover:underline"
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
                      {['General', 'Gastos y Presupuestos', 'Tareas', 'Hogar y Miembros', 'Compras e Inventario', 'Mantenimiento', 'Documentos', 'Reportes'].map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">
                      Tu consulta o problema
                    </label>
                    <textarea
                      required
                      value={form.message}
                      onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="Describe qué estabas intentando hacer..."
                      rows={4}
                      className="w-full px-3 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-surface dark:bg-dark-surface placeholder:text-muted/40 focus:outline-none focus:border-olive resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-85 transition-opacity cursor-pointer"
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
