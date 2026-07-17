import PDFDocument from 'pdfkit'
import { Response }  from 'express'

// Colores
const C = {
  negro:    '#000000',
  blanco:   '#ffffff',
  gris1:    '#f5f5f5',
  gris2:    '#e0e0e0',
  gris3:    '#888888',
  gris4:    '#444444',
  primario: '#f5a623',
  verde:    '#15803d',
  rojo:     '#b91c1c',
  azul:     '#1d4ed8',
  encab:    '#1a1f2e',
}

interface Tarea {
  id:          number
  zona:        string
  descripcion: string
  prioridad:   string
  estado:      string
  evidencia:   string | null
  observacion: string | null
  supervisor?: { nombre: string } | null
  guardia?:    { nombre: string; rut: string | null } | null
}

interface DatosTurno {
  id:     number
  inicio: Date
  fin:    Date
  tareas: Tarea[]
  supervisor: string
}

function linea(doc: PDFKit.PDFDocument, y: number) {
  doc.moveTo(50, y).lineTo(545, y).strokeColor(C.gris2).lineWidth(0.5).stroke()
}

function etiquetaEstado(estado: string): { texto: string; color: string; fondo: string } {
  switch (estado) {
    case 'APROBADA':    return { texto: 'APROBADA',    color: C.verde, fondo: '#dcfce7' }
    case 'RECHAZADA':   return { texto: 'RECHAZADA',   color: C.rojo,  fondo: '#fee2e2' }
    case 'EN_REVISION': return { texto: 'EN REVISION', color: C.azul,  fondo: '#dbeafe' }
    default:            return { texto: 'PENDIENTE',   color: C.gris3, fondo: C.gris1 }
  }
}

export function generarPDFTurno(datos: DatosTurno, res: Response) {
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="informe_turno_${datos.id}.pdf"`)
  doc.pipe(res)

  const L = 50   // margen izquierdo
  const R = 545  // margen derecho
  const W = R - L // ancho util

  // ── ENCABEZADO ────────────────────────────────────────────────────────────
  doc.rect(0, 0, 595, 90).fill(C.encab)

  doc.fontSize(22).font('Helvetica-Bold').fillColor(C.primario)
    .text('S.I. PROTECTION', L, 20)
  doc.fontSize(10).font('Helvetica').fillColor('#8b92a1')
    .text('Sistema de Supervision Operativa de Personal de Seguridad', L, 46)
  doc.fontSize(8).fillColor('#4a5060')
    .text(`Generado el ${datos.fin.toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`, L, 62)

  doc.fontSize(26).font('Helvetica-Bold').fillColor(C.primario)
    .text(`#${datos.id}`, 0, 20, { align: 'right', width: 540 })
  doc.fontSize(8).font('Helvetica').fillColor('#4a5060')
    .text('N° DE TURNO', 0, 52, { align: 'right', width: 540 })

  doc.y = 106

  // ── DATOS DEL TURNO ───────────────────────────────────────────────────────
  doc.roundedRect(L, doc.y, W, 60, 4).fill(C.gris1)
  const ty = doc.y + 10

  // Columna 1: Inicio
  doc.fontSize(7).font('Helvetica').fillColor(C.gris3).text('APERTURA DEL TURNO', L + 14, ty)
  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.gris4)
    .text(datos.inicio.toLocaleString('es-CL', { timeZone: 'America/Santiago' }), L + 14, ty + 12)

  // Columna 2: Cierre
  doc.fontSize(7).font('Helvetica').fillColor(C.gris3).text('CIERRE DEL TURNO', L + 185, ty)
  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.gris4)
    .text(datos.fin.toLocaleString('es-CL', { timeZone: 'America/Santiago' }), L + 185, ty + 12)

  // Columna 3: Supervisor
  doc.fontSize(7).font('Helvetica').fillColor(C.gris3).text('SUPERVISOR', L + 370, ty)
  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.gris4)
    .text(datos.supervisor, L + 370, ty + 12)

  doc.y = ty + 60 + 4

  // ── ESTADISTICAS ──────────────────────────────────────────────────────────
  doc.moveDown(0.6)
  doc.fontSize(11).font('Helvetica-Bold').fillColor(C.gris4).text('Resumen del turno')
  doc.moveDown(0.3)

  const total      = datos.tareas.length
  const aprobadas  = datos.tareas.filter(t => t.estado === 'APROBADA').length
  const rechazadas = datos.tareas.filter(t => t.estado === 'RECHAZADA').length
  const pendientes = datos.tareas.filter(t => t.estado === 'PENDIENTE').length
  const pct        = total > 0 ? Math.round((aprobadas / total) * 100) : 0
  const pctColor   = pct >= 80 ? C.verde : pct >= 50 ? '#b45309' : C.rojo

  const sy   = doc.y
  const sw   = (W - 12) / 4
  const stats = [
    { label: 'TOTAL TAREAS',  value: String(total),     color: C.gris4 },
    { label: 'APROBADAS',     value: String(aprobadas), color: C.verde },
    { label: 'RECHAZADAS',    value: String(rechazadas + pendientes), color: C.rojo },
    { label: '% APROBACION',  value: `${pct}%`,         color: pctColor },
  ]

  stats.forEach((s, i) => {
    const x = L + i * (sw + 4)
    doc.roundedRect(x, sy, sw, 48, 3).fill(C.gris1)
    doc.fontSize(7).font('Helvetica').fillColor(C.gris3)
      .text(s.label, x + 8, sy + 7, { width: sw - 16 })
    doc.fontSize(20).font('Helvetica-Bold').fillColor(s.color)
      .text(s.value, x + 8, sy + 18, { width: sw - 16 })
  })

  doc.y = sy + 56
  doc.moveDown(0.4)
  linea(doc, doc.y)
  doc.moveDown(0.6)

  // ── DETALLE POR GUARDIA ───────────────────────────────────────────────────
  doc.fontSize(11).font('Helvetica-Bold').fillColor(C.gris4).text('Detalle por guardia')
  doc.moveDown(0.4)

  // Agrupar tareas por guardia
  const porGuardia = new Map<number, { nombre: string; rut: string; tareas: Tarea[] }>()
  datos.tareas.forEach(t => {
    const gId   = t.guardia ? 0 : -1
    const gNom  = t.guardia?.nombre ?? 'Sin asignar'
    const gRut  = t.guardia?.rut    ?? '-'
    const key   = gNom // usamos nombre como clave
    if (!porGuardia.has(gId)) {
      // usamos index del map como id unico
    }
    // Agrupamos por nombre del guardia
    const existing = [...porGuardia.values()].find(g => g.nombre === gNom)
    if (existing) {
      existing.tareas.push(t)
    } else {
      porGuardia.set(porGuardia.size, { nombre: gNom, rut: gRut, tareas: [t] })
    }
  })

  porGuardia.forEach(({ nombre, rut, tareas: tareasGuardia }) => {
    if (doc.y > 680) doc.addPage()

    const aprobG = tareasGuardia.filter(t => t.estado === 'APROBADA').length

    // Cabecera del guardia
    doc.roundedRect(L, doc.y, W, 30, 3).fill(C.encab)
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.primario)
      .text(nombre, L + 12, doc.y + 9)
    doc.fontSize(8).font('Helvetica').fillColor('#8b92a1')
      .text(
        `RUT: ${rut}   ·   ${tareasGuardia.length} tarea${tareasGuardia.length !== 1 ? 's' : ''}   ·   ${aprobG} aprobada${aprobG !== 1 ? 's' : ''}`,
        L + 12, doc.y + 9, { align: 'right', width: W - 24 }
      )
    doc.y += 38

    // Tareas del guardia
    tareasGuardia.forEach((t, idx) => {
      if (doc.y > 720) doc.addPage()

      const est    = etiquetaEstado(t.estado)
      const esRec  = t.estado === 'RECHAZADA' || (t.estado === 'PENDIENTE' && t.observacion)
      const rowBg  = idx % 2 === 0 ? '#ffffff' : C.gris1

      // Fila de la tarea
      const rowY  = doc.y
      const rowH  = 14 + (t.evidencia ? 12 : 0) + (t.observacion ? 12 : 0) + 8

      doc.rect(L, rowY, W, rowH + 10).fill(rowBg)

      // Numero + estado
      doc.fontSize(8).font('Helvetica-Bold').fillColor(C.gris4)
        .text(`${idx + 1}.`, L + 8, rowY + 8)

      // Badge de estado
      const bw = 60
      doc.roundedRect(R - bw - 4, rowY + 5, bw, 14, 3).fill(est.fondo)
      doc.fontSize(7).font('Helvetica-Bold').fillColor(est.color)
        .text(est.texto, R - bw - 4, rowY + 8, { width: bw, align: 'center' })

      // Prioridad
      if (t.prioridad === 'URGENTE') {
        doc.roundedRect(R - bw - 70, rowY + 5, 60, 14, 3).fill('#fff7ed')
        doc.fontSize(7).font('Helvetica-Bold').fillColor(C.primario)
          .text('URGENTE', R - bw - 70, rowY + 8, { width: 60, align: 'center' })
      }

      // Zona
      doc.fontSize(9).font('Helvetica-Bold').fillColor(C.gris4)
        .text(t.zona, L + 20, rowY + 8, { width: 280 })

      // Instruccion del supervisor
      doc.fontSize(8).font('Helvetica').fillColor(C.gris3)
        .text('Instruccion: ', L + 20, rowY + 21, { continued: true, width: 460 })
      doc.fillColor(C.gris4)
        .text(t.descripcion, { width: 460 })

      let curY = doc.y + 3

      // Reporte del guardia (si existe)
      if (t.evidencia) {
        doc.fontSize(8).font('Helvetica').fillColor(C.gris3)
          .text('Reporte guardia: ', L + 20, curY, { continued: true, width: 460 })
        doc.fillColor(C.gris4)
          .text(t.evidencia, { width: 460 })
        curY = doc.y + 3
      }

      // Motivo de rechazo (si existe)
      if (t.observacion) {
        doc.roundedRect(L + 14, curY - 2, W - 28, 16, 2).fill('#fee2e2')
        doc.fontSize(8).font('Helvetica-Bold').fillColor(C.rojo)
          .text('Rechazo: ', L + 20, curY, { continued: true, width: 460 })
        doc.font('Helvetica').fillColor('#7f1d1d')
          .text(t.observacion, { width: 440 })
        curY = doc.y + 3
      }

      doc.y = curY + 4
      linea(doc, doc.y)
      doc.y += 4
    })

    doc.moveDown(0.6)
  })

  // ── PIE DE PAGINA ─────────────────────────────────────────────────────────
  const totalPages = (doc.bufferedPageRange().count)
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i)
    const py = 818
    doc.moveTo(L, py).lineTo(R, py).strokeColor(C.gris2).lineWidth(0.5).stroke()
    doc.fontSize(7).font('Helvetica').fillColor(C.gris3)
      .text(`S.I. Protection  ·  Informe de Turno #${datos.id}  ·  ${datos.fin.toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`,
        L, py + 6, { width: 300 })
    doc.text(`Pagina ${i + 1} de ${totalPages}`, L, py + 6, { width: W, align: 'right' })
  }

  doc.end()
}