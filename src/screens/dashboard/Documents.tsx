'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus,
  X,
  Download,
  Eye,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Trash2,
  Pencil,
  Loader2,
  FileSpreadsheet,
  Presentation,
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useHousehold } from '@/context/HouseholdContext'
import { useAuth } from '@/context/AuthContext'
import {
  getHouseholdDocuments,
  addHouseholdDocument,
  updateHouseholdDocument,
  deleteHouseholdDocument,
  downloadHouseholdDocument,
  DocumentCategory,
} from '@/services/documentService'
import SpreadsheetViewer from '@/components/documents/SpreadsheetViewer'

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

// Documents' file_url values are served from the configured storage backend.
// Derive the allowed host(s) from that same configuration rather than trusting the URL blindly.
const ALLOWED_HOSTS: string[] = (() => {
  try {
    const base = process.env.NEXT_PUBLIC_INSFORGE_URL || ''
    return base ? [new URL(base).hostname] : []
  } catch {
    return []
  }
})()

function isSafeExternalUrl(url: string | undefined, allowedHosts: string[]) {
  if (!url) return false
  try {
    const parsed = new URL(String(url).replace(/[\t\n\r]/g, ''))
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    return allowedHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))
  } catch {
    return false
  }
}

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

const getDocTypeIcon = (type: string) => {
  if (['JPG', 'JPEG', 'PNG', 'WEBP'].includes(type)) {
    return <ImageIcon size={14} className="text-muted dark:text-dark-muted" />
  }
  if (['XLS', 'XLSX', 'CSV'].includes(type)) {
    return <FileSpreadsheet size={14} className="text-olive dark:text-dark-olive" />
  }
  if (['PPT', 'PPTX'].includes(type)) {
    return <Presentation size={14} className="text-terracotta dark:text-dark-terracotta" />
  }
  return <FileText size={14} className="text-muted dark:text-dark-muted" />
}

export default function Documents() {
  const { toast } = useToast()
  const { currentHousehold } = useHousehold()
  const { user } = useAuth()
  const [docs, setDocs] = useState<DocumentDisplayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<DocumentDisplayItem | null>(null)
  const [filterCat, setFilterCat] = useState('Todos')
  const [form, setForm] = useState({ name: '', category: 'Financieros', expiry: '', asset: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<DocumentDisplayItem | null>(null)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
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
                date: new Date(d.created_at).toLocaleDateString('es-EC', {
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

  useEffect(() => {
    if (!preview) {
      setPreviewBlobUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setPreviewLoading(false)
      setPreviewError(null)
      return
    }

    const isImage = ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(preview.type)
    const isSpreadsheet = ['XLS', 'XLSX', 'CSV'].includes(preview.type)
    const isOffice = ['DOC', 'DOCX', 'PPT', 'PPTX'].includes(preview.type)
    if (isImage || isSpreadsheet || isOffice) {
      setPreviewBlobUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setPreviewLoading(false)
      setPreviewError(null)
      return
    }

    if (preview.type !== 'PDF') {
      setPreviewBlobUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setPreviewLoading(false)
      setPreviewError(null)
      return
    }

    let active = true
    setPreviewLoading(true)
    setPreviewError(null)

    const fetchBlob = async () => {
      try {
        let blob: Blob | null = null
        if (preview.file_key) {
          try {
            blob = await downloadHouseholdDocument(preview.file_key)
          } catch (err) {
            console.warn('Storage download failed, trying fetch fallback:', err)
          }
        }
        if (!blob && preview.file_url) {
          const res = await fetch(preview.file_url)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          blob = await res.blob()
        }
        if (!blob) throw new Error('No se pudo obtener el archivo.')

        if (active) {
          const mime = 'application/pdf'
          const typedBlob = new Blob([blob], { type: mime })
          const url = URL.createObjectURL(typedBlob)
          setPreviewBlobUrl(url)
        }
      } catch (err) {
        if (active) {
          console.error('Error loading preview blob:', err)
          setPreviewError('No se pudo cargar la previsualización del documento.')
        }
      } finally {
        if (active) {
          setPreviewLoading(false)
        }
      }
    }

    fetchBlob()

    return () => {
      active = false
      setPreviewBlobUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [preview])

  const filtered = filterCat === 'Todos' ? docs : docs.filter(d => d.category === filterCat)
  const isImage = preview ? ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(preview.type) : false
  const isSpreadsheet = preview ? ['XLS', 'XLSX', 'CSV'].includes(preview.type) : false
  const isOfficeDoc = preview ? ['DOC', 'DOCX', 'PPT', 'PPTX'].includes(preview.type) : false

  const handleOpenCreateDrawer = () => {
    setEditingDoc(null)
    setForm({ name: '', category: 'Financieros', expiry: '', asset: '' })
    setSelectedFile(null)
    setDrawerOpen(true)
  }

  const handleStartEdit = (doc: DocumentDisplayItem) => {
    setEditingDoc(doc)
    setForm({
      name: doc.name,
      category: doc.category,
      expiry: doc.expiry || '',
      asset: '',
    })
    setSelectedFile(null)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setEditingDoc(null)
    setSelectedFile(null)
    setForm({ name: '', category: 'Financieros', expiry: '', asset: '' })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      if (!form.name) {
        setForm(p => ({ ...p, name: file.name.replace(/\.[^/.]+$/, '') }))
      }
    }
  }

  const handleDownload = async (doc: DocumentDisplayItem) => {
    try {
      let blob: Blob | null = null
      if (doc.file_key) {
        try {
          blob = await downloadHouseholdDocument(doc.file_key)
        } catch {}
      }
      if (!blob && doc.file_url) {
        const res = await fetch(doc.file_url)
        if (res.ok) blob = await res.blob()
      }

      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const ext = doc.type ? `.${doc.type.toLowerCase()}` : ''
        a.download = doc.name.endsWith(ext) ? doc.name : `${doc.name}${ext}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        return
      }

      if (doc.file_url) window.open(doc.file_url, '_blank')
    } catch (err) {
      console.error('Download error:', err)
      if (doc.file_url) window.open(doc.file_url, '_blank')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHousehold || !user) return

    if (editingDoc) {
      try {
        setUploading(true)
        await updateHouseholdDocument(editingDoc.id, {
          title: form.name,
          category: mapCatToDb(form.category),
          related_type: form.asset ? 'ASSET' : null,
        })

        setDocs(prev =>
          prev.map(d =>
            d.id === editingDoc.id
              ? { ...d, name: form.name, category: form.category, expiry: form.expiry || null }
              : d
          )
        )
        toast('Documento actualizado correctamente.')
        handleCloseDrawer()
      } catch (err) {
        console.error('Error updating document:', err)
        toast('Error al actualizar documento.')
      } finally {
        setUploading(false)
      }
      return
    }

    if (!selectedFile) {
      toast('Por favor selecciona un archivo para subir.')
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
        date: new Date(created.created_at).toLocaleDateString('es-EC', {
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
      handleCloseDrawer()
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
    <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="mb-10 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">Hogar</p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-[32px] sm:text-[42px] lg:text-[56px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">DOCUMENTOS</h1>
            <p className="text-[14px] text-muted dark:text-dark-muted mt-3">Todo lo importante de tu hogar, en un solo lugar.</p>
          </div>
          <button
            onClick={handleOpenCreateDrawer}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line dark:bg-dark-line rounded-[4px] overflow-hidden mb-8">
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

          {/* Document table */}
          <div className="border border-line dark:border-dark-line rounded-[4px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-line dark:border-dark-line bg-bg dark:bg-dark-bg text-[10px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">
                    <th className="py-3 px-4 w-12 text-center">Tipo</th>
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-4 w-36">Categoría</th>
                    <th className="py-3 px-4 w-32">Fecha</th>
                    <th className="py-3 px-4 w-28">Estado</th>
                    <th className="py-3 px-4 w-36 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <p className="text-[15px] text-ink dark:text-dark-ink mb-1">Aún no has guardado documentos.</p>
                        <p className="text-[13px] text-muted dark:text-dark-muted">Sube garantías, facturas, contratos y más con el botón superior.</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map(doc => (
                      <tr
                        key={doc.id}
                        className="border-b border-line dark:border-dark-line last:border-0 hover:bg-bg dark:hover:bg-dark-bg transition-colors group"
                      >
                        <td className="py-3 px-4 w-12 text-center">
                          <div className="w-8 h-8 bg-bg dark:bg-dark-bg rounded-[4px] flex items-center justify-center mx-auto border border-line dark:border-dark-line">
                            {getDocTypeIcon(doc.type)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[13px] font-medium text-ink dark:text-dark-ink truncate max-w-xs lg:max-w-md">{doc.name}</div>
                          <div className="text-[11px] text-muted dark:text-dark-muted mt-0.5 font-mono">{doc.type} · {doc.size}</div>
                        </td>
                        <td className="py-3 px-4 w-36 whitespace-nowrap">
                          <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded ${catColor[doc.category] || catColor.Otros}`}>
                            {doc.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 w-32 font-mono text-[11px] text-muted dark:text-dark-muted whitespace-nowrap">
                          {doc.date}
                        </td>
                        <td className="py-3 px-4 w-28 whitespace-nowrap">
                          {doc.status && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              doc.status === 'Vigente'
                                ? 'text-olive bg-olive-soft dark:bg-dark-olive-soft dark:text-dark-olive'
                                : 'text-sand bg-sand-bg dark:bg-dark-surface'
                            }`}>
                              {doc.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 w-36 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
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
                                  onClick={() => handleDownload(doc)}
                                  className="p-1.5 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
                                  title="Descargar"
                                >
                                  <Download size={13} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleStartEdit(doc)}
                              className="p-1.5 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
                              title="Editar"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id, doc.file_key)}
                              className="p-1.5 text-muted dark:text-dark-muted hover:text-terracotta dark:hover:text-dark-terracotta transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Upload / Edit drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink/20 dark:bg-black/40" onClick={handleCloseDrawer} />
          <div className="relative w-full max-w-md h-full bg-surface dark:bg-dark-surface border-l border-line dark:border-dark-line shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line dark:border-dark-line">
              <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink">
                {editingDoc ? 'Editar documento' : 'Subir documento'}
              </h3>
              <button onClick={handleCloseDrawer} className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="flex-1 px-6 py-6 space-y-5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
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
                  ) : editingDoc ? (
                    <div>
                      <p className="text-[13px] font-medium text-ink dark:text-dark-ink">{editingDoc.name}</p>
                      <p className="text-[11px] text-muted dark:text-dark-muted mt-1">Archivo actual ({editingDoc.type}). Haz clic para reemplazar (opcional).</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[13px] text-muted dark:text-dark-muted">Haz clic para seleccionar un archivo</p>
                      <p className="text-[11px] text-muted/60 dark:text-dark-muted/60 mt-1">PDF, Word, Excel, PowerPoint, Imágenes — hasta 20 MB</p>
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
                <button type="button" onClick={handleCloseDrawer} className="flex-1 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted hover:text-ink transition-colors">Cancelar</button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {uploading ? (editingDoc ? 'Guardando...' : 'Subiendo...') : (editingDoc ? 'Guardar cambios' : 'Subir')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview modal overlay */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[8px] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line dark:border-dark-line">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-ink dark:text-dark-ink truncate">{preview.name}</h3>
                  <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded flex-shrink-0 ${catColor[preview.category] || catColor.Otros}`}>
                    {preview.category}
                  </span>
                </div>
                <div className="text-[11px] text-muted dark:text-dark-muted mt-0.5 font-mono">{preview.type} · {preview.size}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(preview.file_url || preview.file_key) && (
                  <button
                    onClick={() => handleDownload(preview)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-line dark:border-dark-line rounded-[4px] text-[12px] font-medium text-ink dark:text-dark-ink hover:border-olive transition-colors"
                    title="Descargar"
                  >
                    <Download size={13} />
                    <span>Descargar</span>
                  </button>
                )}
                <button
                  onClick={() => setPreview(null)}
                  className="p-1.5 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors rounded-[4px]"
                  title="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* Preview body */}
            <div className={`flex-1 flex items-center justify-center bg-bg dark:bg-dark-bg ${isSpreadsheet ? 'p-0 overflow-hidden' : 'p-4 overflow-auto'} min-h-[300px]`}>
              {previewLoading ? (
                <div className="text-center py-16">
                  <Loader2 size={32} className="animate-spin text-olive mx-auto mb-3" />
                  <p className="text-[13px] text-muted dark:text-dark-muted">Cargando previsualización...</p>
                </div>
              ) : isSpreadsheet ? (
                <SpreadsheetViewer
                  fileKey={preview.file_key}
                  fileUrl={preview.file_url}
                  fileName={preview.name}
                />
              ) : isImage && preview.file_url ? (
                <img
                  src={preview.file_url}
                  alt={preview.name}
                  className="max-w-full max-h-[75vh] object-contain rounded mx-auto shadow-sm"
                />
              ) : preview.type === 'PDF' && previewBlobUrl ? (
                <iframe
                  src={previewBlobUrl}
                  className="w-full h-[75vh] border-0 rounded bg-white shadow-sm"
                  title={preview.name}
                />
              ) : isOfficeDoc && preview.file_url ? (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(preview.file_url)}&embedded=true`}
                  className="w-full h-[75vh] border-0 rounded bg-white shadow-sm"
                  title={preview.name}
                />
              ) : (
                <div className="text-center py-12">
                  <FileText size={48} className="text-line dark:text-dark-line mx-auto mb-3" />
                  <p className="text-[14px] font-medium text-ink dark:text-dark-ink mb-1">
                    {previewError || 'Previsualización no disponible'}
                  </p>
                  <p className="text-[12px] text-muted dark:text-dark-muted mb-4">
                    {previewError
                      ? 'Ocurrió un problema al cargar el archivo. Puedes descargarlo directamente.'
                      : 'Este formato no se puede previsualizar en el navegador.'}
                  </p>
                  {(preview.file_url || preview.file_key) && (
                    <button
                      onClick={() => handleDownload(preview)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[12px] font-medium hover:opacity-80 transition-opacity"
                    >
                      <Download size={13} /> Descargar archivo
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
