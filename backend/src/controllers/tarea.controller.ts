import { Response } from 'express'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth.middleware'

const INCLUDE = {
  guardia:    { select: { id: true, nombre: true, email: true } },
  supervisor: { select: { id: true, nombre: true } },
} as const

const uploadsDir = path.join(__dirname, '../../uploads')
const ensureUploads = () => {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
}

// ── GET /api/tareas ─────────────────────────────────────────────────────────
export const getTareas = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const tareas = await prisma.tarea.findMany({
      include:  INCLUDE,
      orderBy:  [{ prioridad: 'desc' }, { id: 'desc' }],
    })
    res.json(tareas)
  } catch {
    res.status(500).json({ error: 'Error al obtener las tareas.' })
  }
}

// ── POST /api/tareas ────────────────────────────────────────────────────────
export const crearTarea = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { descripcion, zona, prioridad, guardiaId, supervisorId } = req.body

  if (!descripcion || !zona || !guardiaId || !supervisorId) {
    res.status(400).json({ error: 'Faltan campos requeridos.' })
    return
  }

  try {
    // Busca turno activo; si no existe, lo crea automáticamente
    let turno = await prisma.turno.findFirst({ where: { abierto: true } })
    if (!turno) {
      turno = await prisma.turno.create({ data: { abierto: true } })
    }

    const tarea = await prisma.tarea.create({
      data: {
        descripcion,
        zona,
        prioridad:    prioridad ?? 'NORMAL',
        estado:       'PENDIENTE',
        guardiaId:    Number(guardiaId),
        supervisorId: Number(supervisorId),
        turnoId:      turno.id,
      },
      include: INCLUDE,
    })

    res.status(201).json(tarea)
  } catch {
    res.status(500).json({ error: 'Error al crear la tarea.' })
  }
}

// ── POST /api/evidencias ────────────────────────────────────────────────────
export const subirEvidencia = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { tareaId, comentario, fotoBase64 } = req.body

  if (!tareaId || !comentario) {
    res.status(400).json({ error: 'tareaId y comentario son requeridos.' })
    return
  }

  try {
    const tarea = await prisma.tarea.findUnique({ where: { id: Number(tareaId) } })

    if (!tarea) {
      res.status(404).json({ error: 'Tarea no encontrada.' })
      return
    }

    if (tarea.guardiaId !== req.usuario!.id) {
      res.status(403).json({ error: 'No tienes permiso sobre esta tarea.' })
      return
    }

    if (tarea.estado !== 'PENDIENTE') {
      res.status(409).json({ error: 'Solo se puede subir evidencia en tareas PENDIENTES.' })
      return
    }

    let fotoUrl: string | null = tarea.fotoUrl ?? null

    if (fotoBase64) {
      ensureUploads()
      const nombre     = `evidencia_${tareaId}_${Date.now()}.jpg`
      const rutaFisica = path.join(uploadsDir, nombre)
      const datos      = fotoBase64.replace(/^data:image\/\w+;base64,/, '')
      fs.writeFileSync(rutaFisica, datos, 'base64')
      fotoUrl = `/uploads/${nombre}`
    }

    const actualizada = await prisma.tarea.update({
      where:   { id: Number(tareaId) },
      data:    { evidencia: comentario, fotoUrl, estado: 'EN_REVISION' },
      include: INCLUDE,
    })

    res.json(actualizada)
  } catch {
    res.status(500).json({ error: 'Error al registrar la evidencia.' })
  }
}

// ── PUT /api/tareas/:id/validar ─────────────────────────────────────────────
export const validarTarea = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const tareaId              = Number(req.params.id)
  const { estado, observacion } = req.body

  if (!['APROBADA', 'RECHAZADA'].includes(estado)) {
    res.status(400).json({ error: 'estado debe ser APROBADA o RECHAZADA.' })
    return
  }

  try {
    const tarea = await prisma.tarea.findUnique({ where: { id: tareaId } })

    if (!tarea) {
      res.status(404).json({ error: 'Tarea no encontrada.' })
      return
    }

    if (tarea.estado !== 'EN_REVISION') {
      res.status(409).json({ error: 'Solo se pueden validar tareas EN_REVISION.' })
      return
    }

    /*
     * APROBADA  → estado final, queda en el informe
     * RECHAZADA → vuelve a PENDIENTE para que el guardia corrija y reenvíe
     */
    const nuevoEstado = estado === 'APROBADA' ? 'APROBADA' : 'PENDIENTE'

    const actualizada = await prisma.tarea.update({
      where:   { id: tareaId },
      data:    { estado: nuevoEstado, observacion: observacion?.trim() || null },
      include: INCLUDE,
    })

    res.json(actualizada)
  } catch {
    res.status(500).json({ error: 'Error al validar la tarea.' })
  }
}

// ── POST /api/turnos/cerrar ─────────────────────────────────────────────────
export const cerrarTurno = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const turno = await prisma.turno.findFirst({
      where:   { abierto: true },
      include: { tareas: { include: INCLUDE, orderBy: { creadaEn: 'asc' } } },
    })

    if (!turno) {
      res.status(400).json({ error: 'No hay un turno activo.' })
      return
    }

    // Cierra el turno actual y abre el siguiente de forma atómica
    await prisma.$transaction([
      prisma.turno.update({
        where: { id: turno.id },
        data:  { abierto: false, fin: new Date() },
      }),
      prisma.turno.create({ data: { abierto: true } }),
    ])

    // ── Genera el PDF en memoria y lo envía como descarga ─────────────────
    const aprobadas  = turno.tareas.filter(t => t.estado === 'APROBADA')
    const noAprobadas = turno.tareas.filter(t => t.estado !== 'APROBADA')

    const doc = new PDFDocument({ margin: 55, size: 'A4' })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="informe_turno_${turno.id}.pdf"`
    )
    doc.pipe(res)

    // Encabezado
    doc
      .fontSize(20).font('Helvetica-Bold')
      .text('S.I. PROTECTION', { align: 'center' })
    doc
      .fontSize(11).font('Helvetica').fillColor('#555')
      .text('Informe de Cierre de Turno Operativo', { align: 'center' })
    doc.moveDown(0.5)
    doc.moveTo(55, doc.y).lineTo(540, doc.y).strokeColor('#ccc').stroke()
    doc.moveDown(0.8)

    // Datos del turno
    doc.fontSize(10).fillColor('#333')
    doc.text(`Turno N°  : ${turno.id}`)
    doc.text(`Apertura  : ${turno.inicio.toLocaleString('es-CL')}`)
    doc.text(`Cierre    : ${new Date().toLocaleString('es-CL')}`)
    doc.moveDown(1)

    // Resumen
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Resumen')
    doc.moveDown(0.4)
    doc.fontSize(10).font('Helvetica').fillColor('#333')
    doc.text(`Total de tareas  : ${turno.tareas.length}`)
    doc.text(`Aprobadas        : ${aprobadas.length}`)
    doc.text(`Con observaciones: ${noAprobadas.length}`)
    doc.moveDown(1)

    // Detalle
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Detalle de tareas')
    doc.moveDown(0.6)

    turno.tareas.forEach((t, i) => {
      const ok    = t.estado === 'APROBADA'
      const color = ok ? '#15803d' : '#b91c1c'
      const label = ok ? '[APROBADA]' : '[PENDIENTE / RECHAZADA]'

      doc.fontSize(11).font('Helvetica-Bold').fillColor(color)
        .text(`${i + 1}. ${label}  —  Zona: ${t.zona}`)
      doc.fontSize(10).font('Helvetica').fillColor('#333')
      doc.text(`   Guardia    : ${t.guardia?.nombre ?? '—'}`)
      doc.text(`   Prioridad  : ${t.prioridad}`)
      doc.text(`   Instrucción: ${t.descripcion}`)
      if (t.evidencia)   doc.text(`   Reporte    : ${t.evidencia}`)
      if (t.observacion) {
        doc.fillColor('#b91c1c').text(`   Observación: ${t.observacion}`)
        doc.fillColor('#333')
      }
      doc.moveDown(0.7)
    })

    // Pie
    doc.moveDown(1)
    doc.moveTo(55, doc.y).lineTo(540, doc.y).strokeColor('#ccc').stroke()
    doc.moveDown(0.5)
    doc.fontSize(9).fillColor('#999')
      .text(
        `Generado el ${new Date().toLocaleString('es-CL')} — Sistema de Supervisión S.I. Protection`,
        { align: 'center' }
      )

    doc.end()
  } catch {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar el informe.' })
    }
  }
}