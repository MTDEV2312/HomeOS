'use client'

import { useState, useEffect, useMemo } from 'react'
import { Loader2, Search, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { downloadHouseholdDocument } from '@/services/documentService'

interface SpreadsheetViewerProps {
  fileKey?: string
  fileUrl?: string
  fileName: string
}

type CellValue = string | number | boolean | null | undefined

export default function SpreadsheetViewer({ fileKey, fileUrl, fileName }: SpreadsheetViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState<string>('')
  const [rawData, setRawData] = useState<CellValue[][]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const loadWorkbook = async () => {
      try {
        let blob: Blob | null = null
        if (fileKey) {
          try {
            blob = await downloadHouseholdDocument(fileKey)
          } catch (e) {
            console.warn('Storage download failed, attempting fetch fallback:', e)
          }
        }

        if (!blob && fileUrl) {
          const res = await fetch(fileUrl)
          if (!res.ok) throw new Error(`HTTP error ${res.status}`)
          blob = await res.blob()
        }

        if (!blob) throw new Error('No se pudo descargar el archivo para previsualización.')

        const buffer = await blob.arrayBuffer()
        const XLSX = await import('xlsx')
        const wb = XLSX.read(buffer, { type: 'array' })

        if (!cancelled) {
          const names = wb.SheetNames || []
          if (names.length === 0) throw new Error('La planilla no contiene hojas de cálculo.')
          setSheetNames(names)
          const firstSheet = names[0]
          setActiveSheet(firstSheet)

          const ws = wb.Sheets[firstSheet]
          const parsed = XLSX.utils.sheet_to_json<CellValue[]>(ws, { header: 1, defval: '' })
          setRawData(parsed)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error('Error parsing spreadsheet:', err)
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudo interpretar el archivo de planilla.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadWorkbook()

    return () => {
      cancelled = true
    }
  }, [fileKey, fileUrl])

  const handleSelectSheet = async (sheetName: string) => {
    if (sheetName === activeSheet) return
    setActiveSheet(sheetName)
    try {
      setLoading(true)
      let blob: Blob | null = null
      if (fileKey) {
        try {
          blob = await downloadHouseholdDocument(fileKey)
        } catch {
          // fallback
        }
      }
      if (!blob && fileUrl) {
        const res = await fetch(fileUrl)
        if (res.ok) blob = await res.blob()
      }
      if (blob) {
        const buffer = await blob.arrayBuffer()
        const XLSX = await import('xlsx')
        const wb = XLSX.read(buffer, { type: 'array' })
        const ws = wb.Sheets[sheetName]
        if (ws) {
          const parsed = XLSX.utils.sheet_to_json<CellValue[]>(ws, { header: 1, defval: '' })
          setRawData(parsed)
        }
      }
    } catch (e) {
      console.error('Error switching sheet:', e)
    } finally {
      setLoading(false)
    }
  }

  // Filter and limit rows for snappy performance
  const filteredRows = useMemo(() => {
    if (!rawData || rawData.length === 0) return []
    if (!searchQuery.trim()) return rawData

    const q = searchQuery.toLowerCase().trim()
    return rawData.filter(row =>
      row.some(cell => String(cell ?? '').toLowerCase().includes(q))
    )
  }, [rawData, searchQuery])

  const displayRows = useMemo(() => {
    return filteredRows.slice(0, 150)
  }, [filteredRows])

  // Compute maximum columns for consistent grid
  const maxColumns = useMemo(() => {
    return displayRows.reduce((max, row) => Math.max(max, row.length), 0)
  }, [displayRows])

  if (loading) {
    return (
      <div className="w-full h-[75vh] flex flex-col items-center justify-center bg-bg dark:bg-dark-bg p-8">
        <Loader2 size={32} className="animate-spin text-olive mx-auto mb-3" />
        <p className="text-[13px] text-muted dark:text-dark-muted font-medium">Interpretando planilla de cálculo...</p>
        <p className="text-[11px] text-muted/60 dark:text-dark-muted/60 mt-1">{fileName}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[75vh] flex flex-col items-center justify-center bg-bg dark:bg-dark-bg p-8 text-center">
        <AlertCircle size={40} className="text-terracotta dark:text-dark-terracotta mx-auto mb-3" />
        <p className="text-[14px] font-medium text-ink dark:text-dark-ink mb-1">Error al abrir planilla</p>
        <p className="text-[12px] text-muted dark:text-dark-muted mb-4 max-w-md">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[75vh] flex flex-col bg-surface dark:bg-dark-surface overflow-hidden">
      {/* Sub-header: Sheet selector & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-line dark:border-dark-line bg-bg/50 dark:bg-dark-bg/50">
        {/* Sheet tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
          <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted mr-1">
            <FileSpreadsheet size={13} className="text-olive" />
            <span className="hidden sm:inline">Hojas:</span>
          </div>
          {sheetNames.map(name => (
            <button
              key={name}
              onClick={() => handleSelectSheet(name)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-[3px] transition-colors whitespace-nowrap ${
                activeSheet === name
                  ? 'bg-olive text-white dark:bg-dark-olive'
                  : 'bg-surface dark:bg-dark-surface border border-line dark:border-dark-line text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Search in spreadsheet */}
        <div className="relative w-full sm:w-48">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar en celdas..."
            className="w-full pl-7 pr-2.5 py-1 text-[11px] bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[3px] text-ink dark:text-dark-ink placeholder:text-muted/50 focus:outline-none focus:border-olive"
          />
        </div>
      </div>

      {/* Spreadsheet grid */}
      <div className="flex-1 overflow-auto bg-bg dark:bg-dark-bg">
        {displayRows.length === 0 ? (
          <div className="py-20 text-center text-muted dark:text-dark-muted text-[13px]">
            {searchQuery ? 'No se encontraron celdas con ese término.' : 'La hoja seleccionada está vacía.'}
          </div>
        ) : (
          <table className="border-collapse text-[12px] text-ink dark:text-dark-ink min-w-full font-mono">
            <tbody>
              {displayRows.map((row, rowIdx) => {
                const isHeader = rowIdx === 0
                return (
                  <tr
                    key={rowIdx}
                    className={`border-b border-line dark:border-dark-line ${
                      isHeader
                        ? 'bg-bg dark:bg-dark-bg font-semibold text-muted dark:text-dark-muted sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]'
                        : rowIdx % 2 === 0
                        ? 'bg-surface dark:bg-dark-surface'
                        : 'bg-bg/30 dark:bg-dark-bg/30'
                    } hover:bg-olive/5 dark:hover:bg-dark-olive/10 transition-colors`}
                  >
                    {/* Row Index */}
                    <td className="w-10 px-2 py-1.5 text-center text-[10px] text-muted/60 dark:text-dark-muted/60 border-r border-line dark:border-dark-line select-none bg-bg/60 dark:bg-dark-bg/60">
                      {rowIdx + 1}
                    </td>

                    {/* Columns */}
                    {Array.from({ length: maxColumns }).map((_, colIdx) => {
                      const val = row[colIdx]
                      return (
                        <td
                          key={colIdx}
                          className="px-3 py-1.5 border-r border-line dark:border-dark-line truncate max-w-[240px] whitespace-nowrap"
                          title={val != null ? String(val) : ''}
                        >
                          {val != null && val !== '' ? String(val) : '—'}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="px-4 py-2 border-t border-line dark:border-dark-line bg-surface dark:bg-dark-surface flex items-center justify-between text-[11px] text-muted dark:text-dark-muted">
        <div>
          <span>Hoja: </span>
          <strong className="text-ink dark:text-dark-ink font-medium">{activeSheet}</strong>
          <span className="mx-2">·</span>
          <span>{filteredRows.length} fila(s)</span>
          {maxColumns > 0 && <span> × {maxColumns} col(s)</span>}
        </div>
        {filteredRows.length > 150 && (
          <span className="text-[10px] text-muted/80">Mostrando las primeras 150 filas</span>
        )}
      </div>
    </div>
  )
}
