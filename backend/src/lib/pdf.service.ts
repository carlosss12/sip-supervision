import PDFDocument from 'pdfkit'
import { Response } from 'express'

const C = {
  gris1:    '#f7f8fa',
  gris2:    '#e5e7eb',
  gris3:    '#9ca3af',
  gris4:    '#374151',
  gris5:    '#111827',
  primario: '#f5a623',
  verde:    '#16a34a',
  verdeBg:  '#dcfce7',
  rojo:     '#dc2626',
  rojoBg:   '#fee2e2',
  azul:     '#2563eb',
  azulBg:   '#dbeafe',
  amarillo: '#d97706',
  amarilloBg: '#fef3c7',
  encab:    '#0f172a',
  encab2:   '#1e293b',
}

interface Tarea {
  id:          number
  zona:        string
  descripcion: string
  prioridad:   string
  estado:      string
  evidencia:   string | null
  observacion: string | null
  guardia?:    { nombre: string; rut: string | null } | null
  supervisor?: { nombre: string } | null
}

interface Incidencia {
  id:          number
  titulo:      string
  descripcion: string
  zona:        string
  gravedad:    string
  estado:      string
  resolucion:  string | null
  creadaEn:    Date
}

interface DatosTurno {
  id:          number
  inicio:      Date
  fin:         Date
  tareas:      Tarea[]
  supervisor:  string
  incidencias: Incidencia[]
}

const L = 50, R = 545, W = 495
const opts: Intl.DateTimeFormatOptions = { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }

function sep(doc: PDFKit.PDFDocument) {
  doc.moveTo(L, doc.y).lineTo(R, doc.y).strokeColor(C.gris2).lineWidth(0.5).stroke()
  doc.y += 8
}

function seccion(doc: PDFKit.PDFDocument, titulo: string) {
  if (doc.y > 700) doc.addPage()
  doc.y += 10
  doc.rect(L, doc.y, W, 24).fill(C.gris1)
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.gris4)
    .text(titulo.toUpperCase(), L + 10, doc.y + 7, { width: W - 20, characterSpacing: 0.5 })
  doc.y += 30
}

function badge(doc: PDFKit.PDFDocument, x: number, y: number, texto: string, color: string, fondo: string, ancho = 70) {
  doc.roundedRect(x, y, ancho, 14, 3).fill(fondo)
  doc.fontSize(7).font('Helvetica-Bold').fillColor(color)
    .text(texto, x, y + 3, { width: ancho, align: 'center' })
}

function badgeEstado(t: Tarea): { texto: string; color: string; fondo: string } {
  const conRechazo = !!t.observacion
  if (t.estado === 'APROBADA' && conRechazo)
    return { texto: 'APROBADA*', color: C.amarillo, fondo: C.amarilloBg }
  switch (t.estado) {
    case 'APROBADA':    return { texto: 'APROBADA',    color: C.verde,   fondo: C.verdeBg   }
    case 'RECHAZADA':   return { texto: 'RECHAZADA',   color: C.rojo,    fondo: C.rojoBg    }
    case 'EN_REVISION': return { texto: 'EN REVISION', color: C.azul,    fondo: C.azulBg    }
    default:            return { texto: 'PENDIENTE',   color: C.gris3,   fondo: C.gris1     }
  }
}

export function generarPDFTurno(datos: DatosTurno, res: Response) {
  const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="informe_turno_${datos.id}.pdf"`)
  doc.pipe(res)

  // ── ENCABEZADO ────────────────────────────────────────────────────────
  doc.rect(0, 0, 595, 100).fill(C.encab)
  doc.rect(0, 100, 595, 4).fill(C.primario)

  doc.fontSize(24).font('Helvetica-Bold').fillColor(C.primario)
    .text('S.I. PROTECTION', L, 22)
  doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
    .text('Sistema de Supervision Operativa de Personal de Seguridad', L, 50)
  doc.fontSize(8).fillColor('#64748b')
    .text(`Generado el ${datos.fin.toLocaleString('es-CL', opts)}`, L, 66)

  doc.fontSize(32).font('Helvetica-Bold').fillColor(C.primario)
    .text(`#${datos.id}`, 0, 18, { align: 'right', width: 540 })
  doc.fontSize(8).font('Helvetica').fillColor('#64748b')
    .text('N° DE TURNO', 0, 58, { align: 'right', width: 540 })

  doc.y = 118

  // ── DATOS DEL TURNO ───────────────────────────────────────────────────
  doc.rect(L, doc.y, W, 54).fill(C.gris1)
  doc.rect(L, doc.y, 3, 54).fill(C.primario)
  const ty = doc.y + 10

  ;[
    { label: 'APERTURA DEL TURNO', valor: datos.inicio.toLocaleString('es-CL', opts), x: L + 12 },
    { label: 'CIERRE DEL TURNO',   valor: datos.fin.toLocaleString('es-CL', opts),    x: L + 190 },
    { label: 'SUPERVISOR',         valor: datos.supervisor,                             x: L + 368 },
  ].forEach(({ label, valor, x }) => {
    doc.fontSize(7).font('Helvetica').fillColor(C.gris3).text(label, x, ty, { characterSpacing: 0.3 })
    doc.fontSize(10).font('Helvetica-Bold').fillColor(C.gris5).text(valor, x, ty + 13)
  })
  doc.y = ty + 56

  // ── RESUMEN ───────────────────────────────────────────────────────────
  seccion(doc, 'Resumen del turno')

  const total      = datos.tareas.length
  const aprobadas  = datos.tareas.filter(t => t.estado === 'APROBADA').length
  const conRechazo = datos.tareas.filter(t => !!t.observacion).length
  const sinRes     = datos.tareas.filter(t => ['PENDIENTE','EN_REVISION'].includes(t.estado)).length
  const pct        = total > 0 ? Math.round((aprobadas / total) * 100) : 0
  const pctColor   = pct >= 80 ? C.verde : pct >= 50 ? C.amarillo : C.rojo

  const sy  = doc.y
  const sw  = (W - 20) / 5
  ;[
    { label: 'TOTAL TAREAS',    valor: String(total),       color: C.gris5,   fondo: '#ffffff' },
    { label: 'APROBADAS',       valor: String(aprobadas),   color: C.verde,   fondo: C.verdeBg },
    { label: 'CON RECHAZO',     valor: String(conRechazo),  color: C.amarillo,fondo: C.amarilloBg },
    { label: 'SIN RESOLVER',    valor: String(sinRes),      color: C.rojo,    fondo: C.rojoBg },
    { label: '% APROBACION',    valor: `${pct}%`,           color: pctColor,  fondo: '#ffffff' },
  ].forEach((s, i) => {
    const x = L + i * (sw + 5)
    doc.rect(x, sy, sw, 50).fill(s.fondo)
    doc.rect(x, sy, sw, 2).fill(s.color)
    doc.fontSize(7).font('Helvetica').fillColor(C.gris3)
      .text(s.label, x + 6, sy + 8, { width: sw - 12, characterSpacing: 0.2 })
    doc.fontSize(20).font('Helvetica-Bold').fillColor(s.color)
      .text(s.valor, x + 6, sy + 20, { width: sw - 12 })
  })
  doc.y = sy + 58

  if (datos.tareas.filter(t => !!t.observacion).length > 0) {
    doc.fontSize(7).font('Helvetica').fillColor(C.amarillo)
      .text('* APROBADA con rechazo previo registrado', L, doc.y + 4)
    doc.y += 14
  }

  // ── DETALLE POR GUARDIA ───────────────────────────────────────────────
  seccion(doc, 'Detalle de tareas por guardia')

  const porGuardia = new Map<string, { nombre: string; rut: string; tareas: Tarea[] }>()
  datos.tareas.forEach(t => {
    const n = t.guardia?.nombre ?? 'Sin asignar'
    const r = t.guardia?.rut    ?? '-'
    const ex = porGuardia.get(n)
    if (ex) ex.tareas.push(t)
    else    porGuardia.set(n, { nombre: n, rut: r, tareas: [t] })
  })

  porGuardia.forEach(({ nombre, rut, tareas: tg }) => {
    if (doc.y > 680) doc.addPage()

    // Cabecera guardia
    doc.rect(L, doc.y, W, 28).fill(C.encab2)
    doc.rect(L, doc.y, 4, 28).fill(C.primario)
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.primario)
      .text(nombre, L + 14, doc.y + 8, { width: 280 })
    const aprobG = tg.filter(t => t.estado === 'APROBADA').length
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
      .text(`RUT ${rut}  ·  ${tg.length} tarea${tg.length !== 1 ? 's' : ''}  ·  ${aprobG} aprobada${aprobG !== 1 ? 's' : ''}`,
        L + 14, doc.y + 8, { align: 'right', width: W - 28 })
    doc.y += 34

    tg.forEach((t, idx) => {
      if (doc.y > 700) doc.addPage()

      const est    = badgeEstado(t)
      const isOdd  = idx % 2 !== 0
      const startY = doc.y

      // Fondo de fila
      if (isOdd) doc.rect(L, startY, W, 120).fill('#fafafa')

      // Borde izquierdo de color segun estado
      doc.rect(L, startY, 3, 120).fill(est.color)

      // Numero y zona
      doc.fontSize(8).font('Helvetica-Bold').fillColor(C.gris4)
        .text(`${idx + 1}.`, L + 10, startY + 8)
      doc.fontSize(10).font('Helvetica-Bold').fillColor(C.gris5)
        .text(t.zona, L + 26, startY + 7, { width: 300 })

      // Badges
      const est2 = badgeEstado(t)
      const bw   = est2.texto.length > 8 ? 88 : 70
      badge(doc, R - bw - 2, startY + 5, est2.texto, est2.color, est2.fondo, bw)
      if (t.prioridad === 'URGENTE')
        badge(doc, R - bw - 68, startY + 5, 'URGENTE', C.primario, C.amarilloBg, 62)

      // Instruccion
      let cy = startY + 22
      doc.fontSize(8).font('Helvetica').fillColor(C.gris3)
        .text('Instruccion del supervisor:', L + 26, cy)
      cy += 11
      doc.fontSize(8).font('Helvetica').fillColor(C.gris4)
        .text(t.descripcion, L + 26, cy, { width: W - 40 })
      cy = doc.y + 5

      // Reporte del guardia
      if (t.evidencia) {
        doc.fontSize(8).font('Helvetica').fillColor(C.gris3)
          .text('Reporte del guardia:', L + 26, cy)
        cy += 11
        doc.fontSize(8).font('Helvetica').fillColor(C.gris4)
          .text(t.evidencia, L + 26, cy, { width: W - 40 })
        cy = doc.y + 5
      }

      // Motivo de rechazo
      if (t.observacion) {
        doc.rect(L + 20, cy, W - 24, 16).fill(C.rojoBg)
        doc.rect(L + 20, cy, 3, 16).fill(C.rojo)
        doc.fontSize(8).font('Helvetica-Bold').fillColor(C.rojo)
          .text('Motivo de rechazo: ', L + 28, cy + 4, { continued: true, width: W - 40 })
        doc.font('Helvetica').fillColor('#7f1d1d')
          .text(t.observacion, { width: W - 100 })
        cy = doc.y + 5
      }

      doc.y = cy + 4
      doc.moveTo(L + 4, doc.y).lineTo(R, doc.y).strokeColor(C.gris2).lineWidth(0.4).stroke()
      doc.y += 4
    })
    doc.y += 8
  })

  // ── INCIDENCIAS ───────────────────────────────────────────────────────
  if (datos.incidencias?.length > 0) {
    seccion(doc, `Incidencias del turno (${datos.incidencias.length})`)

    datos.incidencias.forEach((inc, idx) => {
      if (doc.y > 700) doc.addPage()

      const colorG = inc.gravedad === 'GRAVE' ? C.rojo : inc.gravedad === 'MEDIA' ? C.amarillo : C.azul
      const fondoG = inc.gravedad === 'GRAVE' ? C.rojoBg : inc.gravedad === 'MEDIA' ? C.amarilloBg : C.azulBg
      const isOdd  = idx % 2 !== 0
      const startY = doc.y

      if (isOdd) doc.rect(L, startY, W, 80).fill('#fafafa')
      doc.rect(L, startY, 3, 80).fill(colorG)

      doc.fontSize(10).font('Helvetica-Bold').fillColor(C.gris5)
        .text(`${idx + 1}. ${inc.titulo}`, L + 10, startY + 8, { width: 320 })

      badge(doc, R - 68, startY + 5, inc.gravedad, colorG, fondoG, 64)
      if (inc.estado === 'CERRADA')
        badge(doc, R - 138, startY + 5, 'CERRADA', C.verde, C.verdeBg, 64)

      let cy = startY + 22
      doc.fontSize(8).font('Helvetica').fillColor(C.gris3)
        .text(`Zona: `, L + 10, cy, { continued: true })
      doc.fillColor(C.gris4).text(inc.zona)
      cy = doc.y + 3

      doc.fontSize(8).font('Helvetica').fillColor(C.gris3)
        .text('Descripcion: ', L + 10, cy, { continued: true })
      doc.fillColor(C.gris4).text(inc.descripcion, { width: W - 20 })
      cy = doc.y + 4

      if (inc.resolucion) {
        doc.rect(L + 6, cy, W - 10, 16).fill(C.verdeBg)
        doc.rect(L + 6, cy, 3, 16).fill(C.verde)
        doc.fontSize(8).font('Helvetica-Bold').fillColor(C.verde)
          .text('Resolucion: ', L + 14, cy + 4, { continued: true })
        doc.font('Helvetica').fillColor('#14532d').text(inc.resolucion, { width: W - 40 })
        cy = doc.y + 4
      }

      doc.y = cy + 4
      doc.moveTo(L + 4, doc.y).lineTo(R, doc.y).strokeColor(C.gris2).lineWidth(0.4).stroke()
      doc.y += 4
    })
  }

  // ── PIE DE PAGINA ─────────────────────────────────────────────────────
  const total2 = doc.bufferedPageRange().count
  for (let i = 0; i < total2; i++) {
    doc.switchToPage(i)
    doc.rect(0, 820, 595, 22).fill(C.encab)
    doc.fontSize(7).font('Helvetica').fillColor('#64748b')
      .text(`S.I. Protection  ·  Informe de Turno #${datos.id}  ·  ${datos.fin.toLocaleString('es-CL', opts)}`,
        L, 826, { width: 350 })
    doc.text(`Pagina ${i + 1} de ${total2}`, L, 826, { width: W, align: 'right' })
  }

  doc.end()
}