/**
 * Client-Side PDF Report Generator for HomeOS
 * Dynamically loads jsPDF & jspdf-autotable from CDN to produce
 * crisp, vectorized, multi-page PDF reports without heavy server-side Chromium
 * or node_modules installation bottlenecks.
 */

export interface PDFExpenseItem {
  date: string
  category: string
  description: string
  paidBy: string
  amount: number
}

export interface PDFCategoryItem {
  name: string
  amount: number
  percentage: number
}

export interface PDFReportData {
  householdName: string
  periodLabel: string
  periodKey: string
  allocatedBudget: number
  totalSpent: number
  remainingBudget: number
  usedPercentage: number
  expenseCount: number
  generatedAt: string
  timeZone: string
  categoryBreakdown: PDFCategoryItem[]
  expenses: PDFExpenseItem[]
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window is not available'))
    }
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      return resolve()
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = (err) => reject(new Error(`Failed to load script ${src}: ${err}`))
    document.head.appendChild(script)
  })
}

async function getJsPDFInstance(): Promise<any> {
  if (typeof window === 'undefined') throw new Error('Client-only method')

  // Check if already available in window
  const win = window as any
  if (win.jspdf && win.jspdf.jsPDF) {
    return win.jspdf
  }

  // Load jsPDF first, then autotable
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js')

  if (!win.jspdf || !win.jspdf.jsPDF) {
    throw new Error('jsPDF could not be initialized from CDN')
  }

  return win.jspdf
}

export async function generateMonthlyExpensePDF(data: PDFReportData): Promise<void> {
  try {
    const jspdfModule = await getJsPDFInstance()
    const { jsPDF } = jspdfModule

    // Create A4 portrait document (210 x 297 mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = 210
    const margin = 14
    const contentWidth = pageWidth - margin * 2

    // Palette
    const cPrimary = [30, 41, 59] // Slate 800
    const cMuted = [100, 116, 139] // Slate 500
    const cLine = [226, 232, 240] // Slate 200
    const cCardBg = [248, 250, 252] // Slate 50

    // Header Background Accent Bar
    doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2])
    doc.rect(0, 0, pageWidth, 8, 'F')

    // Document Title & Branding
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2])
    doc.text('HomeOS', margin, 20)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(cMuted[0], cMuted[1], cMuted[2])
    doc.text('Reporte de Gastos y Presupuestos', margin + 30, 20)

    // Household and Period Tag
    doc.setFontSize(10)
    doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2])
    doc.text(`Hogar: ${data.householdName || 'Hogar'}`, margin, 28)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(59, 130, 246) // Blue accent
    doc.text(`Período: ${data.periodLabel}`, pageWidth - margin, 28, { align: 'right' })

    // Date & Timezone note
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(cMuted[0], cMuted[1], cMuted[2])
    doc.text(`Emitido: ${data.generatedAt} (${data.timeZone})`, pageWidth - margin, 33, { align: 'right' })

    // Divider
    doc.setDrawColor(cLine[0], cLine[1], cLine[2])
    doc.setLineWidth(0.4)
    doc.line(margin, 36, pageWidth - margin, 36)

    // KPI Cards Block (5 Cards)
    const kpiY = 40
    const cardWidth = (contentWidth - 8) / 5
    const cardHeight = 22

    const kpiItems = [
      { label: 'Presupuesto', value: `$${data.allocatedBudget.toLocaleString('es-AR')}` },
      { label: 'Total Gastado', value: `$${data.totalSpent.toLocaleString('es-AR')}` },
      { label: 'Restante', value: `$${data.remainingBudget.toLocaleString('es-AR')}` },
      { label: '% Utilizado', value: `${data.usedPercentage}%` },
      { label: 'N° Gastos', value: String(data.expenseCount) },
    ]

    kpiItems.forEach((kpi, idx) => {
      const x = margin + idx * (cardWidth + 2)
      doc.setFillColor(cCardBg[0], cCardBg[1], cCardBg[2])
      doc.setDrawColor(cLine[0], cLine[1], cLine[2])
      doc.roundedRect(x, kpiY, cardWidth, cardHeight, 2, 2, 'FD')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(cMuted[0], cMuted[1], cMuted[2])
      doc.text(kpi.label, x + 3, kpiY + 7)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      if (kpi.label === '% Utilizado' && data.usedPercentage > 100) {
        doc.setTextColor(220, 38, 38) // Red if exceeded
      } else if (kpi.label === 'Restante' && data.remainingBudget <= 0) {
        doc.setTextColor(220, 38, 38)
      } else {
        doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2])
      }
      doc.text(kpi.value, x + 3, kpiY + 16)
    })

    // Visual Budget Progress Bar
    const barY = kpiY + cardHeight + 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(cMuted[0], cMuted[1], cMuted[2])
    doc.text('Progreso del presupuesto mensual:', margin, barY + 3.5)

    const barX = margin + 50
    const barW = contentWidth - 50
    const barH = 4.5
    // Background bar
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(barX, barY, barW, barH, 2, 2, 'F')

    // Filled portion
    const fillRatio = data.allocatedBudget > 0 ? Math.min(1, data.totalSpent / data.allocatedBudget) : 0
    if (fillRatio > 0) {
      if (data.usedPercentage > 100) {
        doc.setFillColor(239, 68, 68) // Red
      } else if (data.usedPercentage > 80) {
        doc.setFillColor(245, 158, 11) // Amber
      } else {
        doc.setFillColor(16, 185, 129) // Emerald
      }
      doc.roundedRect(barX, barY, Math.max(3, barW * fillRatio), barH, 2, 2, 'F')
    }

    // Section 1: Categories Breakdown Table
    let currentY = barY + 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2])
    doc.text('Desglose por Categorías', margin, currentY)

    const categoryRows = data.categoryBreakdown.map((cat) => [
      cat.name,
      `$${cat.amount.toLocaleString('es-AR')}`,
      `${cat.percentage}%`,
    ])

    const autoTable = (doc as any).autoTable

    if (categoryRows.length > 0) {
      autoTable({
        startY: currentY + 3,
        head: [['Categoría', 'Total Gastado', '% del Total']],
        body: categoryRows,
        margin: { left: margin, right: margin },
        theme: 'striped',
        headStyles: {
          fillColor: [71, 85, 105],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 30, halign: 'right' },
        },
      })
      currentY = (doc as any).lastAutoTable.finalY + 8
    } else {
      currentY += 6
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8.5)
      doc.setTextColor(cMuted[0], cMuted[1], cMuted[2])
      doc.text('No hay gastos registrados en este período.', margin, currentY)
      currentY += 8
    }

    // Section 2: Itemized Transactions Table
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2])
    doc.text('Listado Detallado de Gastos', margin, currentY)

    const expenseRows = data.expenses.map((exp) => [
      exp.date,
      exp.category || 'General',
      exp.description || 'Sin descripción',
      exp.paidBy || '-',
      `$${exp.amount.toLocaleString('es-AR')}`,
    ])

    if (expenseRows.length > 0) {
      autoTable({
        startY: currentY + 3,
        head: [['Fecha', 'Categoría', 'Descripción', 'Pagado por', 'Monto']],
        body: expenseRows,
        margin: { left: margin, right: margin, bottom: 15 },
        theme: 'striped',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 32 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 30 },
          4: { cellWidth: 30, halign: 'right' },
        },
        didDrawPage: (hookData: any) => {
          // Page Numbering Footer on each page
          const str = `Página ${hookData.pageNumber} de ${doc.getNumberOfPages()}`
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7.5)
          doc.setTextColor(cMuted[0], cMuted[1], cMuted[2])
          doc.text(str, pageWidth - margin, 290, { align: 'right' })
          doc.text('HomeOS - Sistema de Gestión del Hogar', margin, 290)
        },
      })
    } else {
      currentY += 6
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8.5)
      doc.setTextColor(cMuted[0], cMuted[1], cMuted[2])
      doc.text('No hay transacciones registradas para este mes.', margin, currentY)
    }

    // Save PDF file
    doc.save(`reporte-gastos-${data.periodKey}.pdf`)
  } catch (err) {
    console.error('Error generating PDF with jsPDF, falling back to print window:', err)
    fallbackHTMLPrint(data)
  }
}

/**
 * Fallback printer in case CDN is unreachable or offline
 */
function fallbackHTMLPrint(data: PDFReportData) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Habilitá los popups para este sitio.')
    return
  }

  const categoryRowsHTML = data.categoryBreakdown
    .map(
      (c) =>
        `<tr><td>${c.name}</td><td style="text-align:right">$${c.amount.toLocaleString(
          'es-AR'
        )}</td><td style="text-align:right">${c.percentage}%</td></tr>`
    )
    .join('')

  const expenseRowsHTML = data.expenses
    .map(
      (e) =>
        `<tr><td>${e.date}</td><td>${e.category}</td><td>${e.description}</td><td>${
          e.paidBy
        }</td><td style="text-align:right">$${e.amount.toLocaleString('es-AR')}</td></tr>`
    )
    .join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reporte de Gastos - ${data.periodLabel}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; color: #1e293b; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
          .kpis { display: flex; gap: 10px; margin-bottom: 20px; }
          .kpi-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #f8fafc; }
          .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
          .kpi-value { font-size: 18px; font-weight: bold; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          th { background: #334155; color: white; text-align: left; padding: 8px 10px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; }
          @media print {
            body { margin: 0; }
            @page { size: A4; margin: 15mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>HomeOS - Reporte de Gastos y Presupuestos</h2>
          <p><strong>Hogar:</strong> ${data.householdName} | <strong>Período:</strong> ${data.periodLabel}</p>
          <p style="font-size:11px;color:#64748b;">Emitido: ${data.generatedAt} (${data.timeZone})</p>
        </div>
        <div class="kpis">
          <div class="kpi-card"><div class="kpi-label">Presupuesto</div><div class="kpi-value">$${data.allocatedBudget.toLocaleString(
            'es-AR'
          )}</div></div>
          <div class="kpi-card"><div class="kpi-label">Total Gastado</div><div class="kpi-value">$${data.totalSpent.toLocaleString(
            'es-AR'
          )}</div></div>
          <div class="kpi-card"><div class="kpi-label">Restante</div><div class="kpi-value">$${data.remainingBudget.toLocaleString(
            'es-AR'
          )}</div></div>
          <div class="kpi-card"><div class="kpi-label">% Utilizado</div><div class="kpi-value">${
            data.usedPercentage
          }%</div></div>
        </div>
        <h3>Desglose por Categorías</h3>
        <table>
          <thead><tr><th>Categoría</th><th style="text-align:right">Total Gastado</th><th style="text-align:right">% del Total</th></tr></thead>
          <tbody>${categoryRowsHTML || '<tr><td colspan="3">Sin gastos</td></tr>'}</tbody>
        </table>
        <h3>Listado Detallado de Gastos</h3>
        <table>
          <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Pagado por</th><th style="text-align:right">Monto</th></tr></thead>
          <tbody>${expenseRowsHTML || '<tr><td colspan="5">Sin gastos</td></tr>'}</tbody>
        </table>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
