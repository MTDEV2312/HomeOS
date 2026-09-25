'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, X, Download, Eye, ChevronDown, FileText, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useHousehold } from '@/context/HouseholdContext'
import { useAuth } from '@/context/AuthContext'
import {
  getHouseholdDocuments,
  addHouseholdDocument,
  deleteHouseholdDocument,
  DocumentCategory,
} from '@/services/documentService'

export interface DocumentDisplayItem {
  id: string
  name: string
  category: string
  date: string
  status: string | null
  expiry?: string | null
  type: string
  size: string
  file_url?: string
  file_key?: string
}

const categories = ['Todos', 'Financieros', 'Legales', 'Garantías', 'Manuales', 'Médicos', 'Identificación', 'Otros']

const catColor: Record<string, string> = {
  Financieros: 'bg-olive-soft text-olive dark:bg-dark-surface dark:text-dark-olive',
  Legales: 'bg-softblue-bg text-ink dark:bg-dark-surface dark:text-dark-ink',
  Garantías: 'bg-sand-bg text-ink dark:bg-dark-surface dark:text-dark-ink',
  Manuales: 'bg-sage-soft text-ink dark:bg-dark-surface dark:text-dark-ink',
  Médicos: 'bg-terracotta-bg text-terracotta dark:bg-dark-surface dark:text-dark-terracotta',
  Identificación: 'bg-bg text-muted dark:bg-dark-surface dark:text-dark-muted',
  Otros: 'bg-bg text-muted dark:bg-dark-surface dark:text-dark-muted',
}

const mapCatToDb = (cat: string): DocumentCategory => {
  if (cat === 'Financieros') return 'RECEIPT'
  if (cat === 'Garantías') return 'WARRANTY'
  if (cat === 'Legales') return 'CONTRACT'
  if (cat === 'Identificación') return 'IDENTITY'
  return 'OTHER'
}

const mapCatFromDb = (cat: DocumentCategory): string => {
  if (cat === 'RECEIPT') return 'Financieros'
  if (cat === 'WARRANTY') return 'Garantías'
  if (cat === 'CONTRACT') return 'Legales'
  if (cat === 'IDENTITY') return 'Identificación'
  return 'Otros'
}

export default function Documents() {
  const { toast } = useToast()
  const { currentHousehold } = useHousehold()
  const { user } = useAuth()
  const [docs, setDocs] = useState<DocumentDisplayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filterCat, setFilterCat] = useState('Todos')
  const [form, setForm] = useState({ name: '', category: 'Financieros', expiry: '', asset: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<DocumentDisplayItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!currentHousehold) return
    let mounted = true
    setLoading(true)

    getHouseholdDocuments(currentHousehold.id)
      .then(data => {
        if (!mounted) return
        if (data) {
          setDocs(
            data.map(d => {
              const ext = d.file_url ? d.file_url.split('.').pop()?.toUpperCase() || 'DOC' : 'DOC'
              return {
                id: d.id,
                name: d.title,
                category: mapCatFromDb(d.category),
                date: new Date(d.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }),
                status: 'Vigente',
                expiry: null,
                type: ext,
                size: '—',
                file_url: d.file_url,
                file_key: d.file_key,
              }
            })
          )
        }
      })
      .catch(err => {
        console.error('Error fetching documents:', err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [currentHousehold])

  const filtered = filterCat === 'Todos' ? docs : docs.filter(d => d.category === filterCat)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      if (!form.name) {
        setForm(p => ({ ...p, name: file.name.replace(/\.[^/.]+$/, '') }))
      }
    }
  }

  const upload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHousehold || !user) return

    if (!selectedFile) {
      toast('Por favor seleccioná un archivo para subir.')
      return
    }

    try {
      setUploading(true)
      const created = await addHouseholdDocument(
        {
          household_id: currentHousehold.id,
          title: form.name,
          category: mapCatToDb(form.category),
          related_type: form.asset ? 'ASSET' : null,
          related_id: null,
          created_by: user.id,
        },
        selectedFile
      )

      const ext = selectedFile.name.split('.').pop()?.toUpperCase() || 'DOC'
      const fileSize = `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`

      const newItem: DocumentDisplayItem = {
        id: created.id,
        name: created.title,
        category: mapCatFromDb(created.category),
        date: new Date(created.created_at).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        status: 'Reciente',
        expiry: form.expiry || null,
        type: ext,
        size: fileSize,
        file_url: created.file_url,
        file_key: created.file_key,
      }

      setDocs(prev => [newItem, ...prev])
      setDrawerOpen(false)
      setSelectedFile(null)
      setForm({ name: '', category: 'Financieros', expiry: '', asset: '' })
      toast('Documento subido correctamente.')
    } catch (err) {
      console.error('Error uploading document:', err)
      toast('Error al subir documento.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, fileKey?: string) => {
    try {
      if (fileKey) {
        await deleteHouseholdDocument(id, fileKey)
      }
      setDocs(p => p.filter(d => d.id !== id))
      toast('Documento eliminado.')
    } catch (err) {
      console.error('Error deleting document:', err)
      toast('Error al eliminar documento.')
    }
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="mb-10 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">Hogar</p>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[42px] lg:text-[56px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">DOCUMENTOS</h1>
            <p className="text-[14px] text-muted dark:text-dark-muted mt-3">Todo lo importante de tu hogar, en un solo lugar.</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity"
          >
            <Plus size={14} /> Subir documento
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <div className="w-6 h-6 border-2 border-olive border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-px bg-line dark:bg-dark-line rounded-[4px] overflow-hidden mb-8">
            {[
              { label: 'Total de documentos', value: docs.length },
              { label: 'Por vencer', value: docs.filter(d => d.status === 'Vigente' && d.expiry).length },
              { label: 'Recientes', value: docs.filter(d => d.status === 'Reciente').length },
            ].map(m => (
              <div key={m.label} className="bg-surface dark:bg-dark-surface px-5 py-4">
                <div className="text-[11px] text-muted dark:text-dark-muted mb-1">{m.label}</div>
                <div className="font-mono text-[28px] font-light text-ink dark:text-dark-ink">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-[3px] text-[12px] font-medium border transition-colors ${
                  filterCat === cat
                    ? 'border-ink dark:border-dark-ink bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg'
                    : 'border-line dark:border-dark-line text-muted dark:text-dark-muted hover:border-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Document list */}
          <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden">
            <div className="hidden lg:grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-line dark:border-dark-line bg-bg dark:bg-dark-bg text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
              <span></span>
              <span>Nombre</span>
              <span>Categoría</span>
              <span>Fecha</span>
              <span>Estado</span>
              <span></span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] text-ink dark:text-dark-ink mb-1">Aún no has guardado documentos.</p>
                <p className="text-[13px] text-muted dark:text-dark-muted">Subí garantías, facturas, contratos y más con el botón superior.</p>
              </div>
            ) : (
              filtered.map((doc, i) => (
                <div
                  key={doc.id}
                  className={`flex lg:grid lg:grid-cols-[auto_1fr_1fr_auto_auto_auto] items-center gap-4 px-5 py-4 ${
                    i > 0 ? 'border-t border-line dark:border-dark-line' : ''
                  } hover:bg-bg dark:hover:bg-dark-bg transition-colors group`}
                >
                  <div className="w-8 h-8 bg-bg dark:bg-dark-bg rounded-[4px] flex items-center justify-center flex-shrink-0 border border-line dark:border-dark-line">
                    {['JPG', 'JPEG', 'PNG', 'WEBP'].includes(doc.type) ? (
                      <ImageIcon size={14} className="text-muted dark:text-dark-muted" />
                    ) : (
                      <FileText size={14} className="text-muted dark:text-dark-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-ink dark:text-dark-ink truncate">{doc.name}</div>
                    <div className="text-[11px] text-muted dark:text-dark-muted mt-0.5 font-mono">{doc.type} · {doc.size}</div>
                  </div>
                  <span className={`hidden lg:inline-flex text-[10px] font-medium px-2 py-0.5 rounded ${catColor[doc.category] || catColor.Otros}`}>
                    {doc.category}
                  </span>
                  <span className="hidden lg:block font-mono text-[11px] text-muted dark:text-dark-muted">{doc.date}</span>
                  <div className="hidden lg:block">
                    {doc.status && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        doc.status === 'Vigente'
                          ? 'text-olive bg-olive-soft dark:bg-dark-olive-soft dark:text-dark-olive'
                          : 'text-sand bg-sand-bg dark:bg-dark-surface'
                      }`}>
                        {doc.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-auto lg:ml-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.file_url && (
                      <>
                        <button
                          onClick={() => setPreview(doc)}
                          className="p-1.5 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
                          title="Ver"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => window.open(doc.file_url, '_blank')}
                          className="p-1.5 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
                          title="Descargar"
                        >
                          <Download size={13} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id, doc.file_key)}
                      className="p-1.5 text-muted dark:text-dark-muted hover:text-terracotta dark:hover:text-dark-terracotta transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Upload drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink/20 dark:bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink">Subir documento</h3>
              <button onClick={() => setDrawerOpen(false)} className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink"><X size={18} /></button>
            </div>
            <form onSubmit={upload} className="flex-1 flex flex-col">
              <div className="flex-1 px-6 py-6 space-y-5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                />
                {/* Upload zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-line dark:border-dark-line rounded-[6px] p-8 text-center hover:border-olive dark:hover:border-dark-olive transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-bg dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus size={18} className="text-muted dark:text-dark-muted group-hover:text-olive dark:group-hover:text-dark-olive transition-colors" />
                  </div>
                  {selectedFile ? (
                    <div>
                      <p className="text-[13px] font-medium text-ink dark:text-dark-ink">{selectedFile.name}</p>
                      <p className="text-[11px] text-muted dark:text-dark-muted mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[13px] text-muted dark:text-dark-muted">Hacé clic para seleccionar archivo</p>
                      <p className="text-[11px] text-muted/60 dark:text-dark-muted/60 mt-1">PDF, JPG, PNG — hasta 20 MB</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Título del documento</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Garantía — Heladera Samsung"
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Categoría</label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive appearance-none"
                    >
                      {categories.filter(c => c !== 'Todos').map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Activo relacionado (opcional)</label>
                  <input
                    value={form.asset}
                    onChange={e => setForm(p => ({ ...p, asset: e.target.value }))}
                    placeholder="Heladera Samsung"
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Fecha de vencimiento (opcional)</label>
                  <input
                    type="date"
                    value={form.expiry}
                    onChange={e => setForm(p => ({ ...p, expiry: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
                  />
                </div>
              </div>
              <div className="px-6 py-5 border-t border-line dark:border-dark-line flex gap-3">
                <button type="button" onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted hover:text-ink transition-colors">Cancelar</button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {uploading ? 'Subiendo...' : 'Subir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview panel */}
      {preview && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink/20 dark:bg-black/40" onClick={() => setPreview(null)} />
          <div className="relative w-full max-w-lg h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <div>
                <div className="text-[14px] font-semibold text-ink dark:text-dark-ink">{preview.name}</div>
                <div className="text-[11px] text-muted dark:text-dark-muted mt-0.5">{preview.category} · {preview.type} · {preview.size}</div>
              </div>
              <button onClick={() => setPreview(null)} className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink"><X size={18} /></button>
            </div>
            <div className="flex-1 flex items-center justify-center bg-bg dark:bg-dark-bg p-4 overflow-auto">
              {preview.file_url && ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(preview.type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.file_url} alt={preview.name} className="max-w-full max-h-[80vh] object-contain rounded" />
              ) : (
                <div className="text-center">
                  <FileText size={40} className="text-line dark:text-dark-line mx-auto mb-3" />
                  <p className="text-[13px] text-muted dark:text-dark-muted">Previsualización de documento</p>
                  {preview.file_url && (
                    <button
                      onClick={() => window.open(preview.file_url, '_blank')}
                      className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 border border-line dark:border-dark-line rounded text-[12px] text-ink dark:text-dark-ink hover:border-olive transition-colors"
                    >
                      <Download size={13} /> Abrir archivo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
