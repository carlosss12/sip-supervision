import { enviarPushAUsuario } from './push.controller'
import { Response } from 'express'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth.middleware'

const INCLUDE = {
  guardia:    { select: { id: true, nombre: true, email: true, rut: true, telefono: true } },
  supervisor: { select: { id: true, nombre: true } },
} as const

const uploadsDir = path.join(__dirname, '../../uploads')
const ensureUploads = () => {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
}

export const getTareas = async (_req: AuthRequest, res: Response): Promise<void> => {
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

export const crearTarea = async (req: AuthRequest, res: Response): Promise<void> => {
  const { descripcion, zona, prioridad, guardiaId, supervisorId } = req.body

  if (!descripcion || !zona || !guardiaId || !supervisorId) {
    res.status(400).json({ error: 'Faltan campos requeridos.' })
    return
  }

  try {
    let turno = await prisma.turno.findFirst({ where: { abierto: true } })
    if (!turno) turno = await prisma.turno.create({ data: { abierto: true } })

    const tarea = await prisma.tarea.create({
      data: {
        descripcion, zona,
        prioridad:    prioridad ?? 'NORMAL',
        estado:       'PENDIENTE',
        guardiaId:    Number(guardiaId),
        supervisorId: Number(supervisorId),
        turnoId:      turno.id,
      },
      include: INCLUDE,
    })

    await enviarPushAUsuario(
      Number(guardiaId),
      'Nueva tarea asignada',
      `${zona}: ${descripcion}`
    ).catch(() => {})

    res.status(201).json(tarea)
  } catch {
    res.status(500).json({ error: 'Error al crear la tarea.' })
  }
}

export const subirEvidencia = async (req: AuthRequest, res: Response): Promise<void> => {
  const { tareaId, comentario, fotoBase64 } = req.body

  if (!tareaId || !comentario) {
    res.status(400).json({ error: 'tareaId y comentario son requeridos.' })
    return
  }

  try {
    const tarea = await prisma.tarea.findUnique({ where: { id: Number(tareaId) } })

    if (!tarea) { res.status(404).json({ error: 'Tarea no encontrada.' }); return }
    if (tarea.guardiaId !== req.usuario!.id) {
      res.status(403).json({ error: 'No tienes permiso sobre esta tarea.' }); return
    }
    if (tarea.estado !== 'PENDIENTE') {
      res.status(409).json({ error: 'Solo se puede subir evidencia en tareas PENDIENTES.' }); return
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
      data:    { evidencia: comentario, fotoUrl, estado: 'EN_REVISION', observacion: null },
      include: INCLUDE,
    })
    res.json(actualizada)
  } catch {
    res.status(500).json({ error: 'Error al registrar la evidencia.' })
  }
}

export const validarTarea = async (req: AuthRequest, res: Response): Promise<void> => {
  const tareaId              = Number(req.params.id)
  const { estado, observacion } = req.body

  if (!['APROBADA', 'RECHAZADA'].includes(estado)) {
    res.status(400).json({ error: 'estado debe ser APROBADA o RECHAZADA.' }); return
  }

  try {
    const tarea = await prisma.tarea.findUnique({ where: { id: tareaId } })
    if (!tarea) { res.status(404).json({ error: 'Tarea no encontrada.' }); return }
    if (tarea.estado !== 'EN_REVISION') {
      res.status(409).json({ error: 'Solo se pueden validar tareas EN_REVISION.' }); return
    }

    const nuevoEstado = estado === 'APROBADA' ? 'APROBADA' : 'PENDIENTE'

    const actualizada = await prisma.tarea.update({
      where:   { id: tareaId },
      data:    { estado: nuevoEstado, observacion: observacion?.trim() || null },
      include: INCLUDE,
    })

    if (estado === 'RECHAZADA') {
      await enviarPushAUsuario(
        tarea.guardiaId,
        'Tarea devuelta por el supervisor',
        `${tarea.zona}: ${observacion?.trim() || 'Revisa la observacion en el sistema.'}`
      ).catch(() => {})
    }

    res.json(actualizada)
  } catch {
    res.status(500).json({ error: 'Error al validar la tarea.' })
  }
}

export const getHistorialTurnos = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const turnos = await prisma.turno.findMany({
      where:   { abierto: false },
      orderBy: { inicio: 'desc' },
      take:    20,
      include: {
        tareas: {
          include: INCLUDE,
          orderBy: { creadaEn: 'asc' },
        },
      },
    })
    res.json(turnos)
  } catch {
    res.status(500).json({ error: 'Error al obtener historial.' })
  }
}

export const iniciarTurno = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const turnoActivo = await prisma.turno.findFirst({ where: { abierto: true } })
    if (turnoActivo) {
      res.status(409).json({ error: 'Ya existe un turno activo.', turno: turnoActivo })
      return
    }
    const turno = await prisma.turno.create({ data: { abierto: true } })
    res.status(201).json(turno)
  } catch {
    res.status(500).json({ error: 'Error al iniciar el turno.' })
  }
}

export const getTurnoActivo = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const turno = await prisma.turno.findFirst({ where: { abierto: true } })
    res.json({ turno: turno ?? null })
  } catch {
    res.status(500).json({ error: 'Error al consultar el turno activo.' })
  }
}

export const cerrarTurno = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const turno = await prisma.turno.findFirst({
      where:   { abierto: true },
      include: {
        tareas: {
          include:  INCLUDE,
          orderBy:  { creadaEn: 'asc' },
        },
      },
    })

    if (!turno) { res.status(400).json({ error: 'No hay un turno activo.' }); return }

    await prisma.$transaction([
      prisma.turno.update({ where: { id: turno.id }, data: { abierto: false, fin: new Date() } }),
      prisma.turno.create({ data: { abierto: true } }),
    ])

    const ahora      = new Date()
    const aprobadas  = turno.tareas.filter(t => t.estado === 'APROBADA')
    const noAprobadas = turno.tareas.filter(t => t.estado !== 'APROBADA')
    const pct        = turno.tareas.length > 0 ? Math.round((aprobadas.length / turno.tareas.length) * 100) : 0

    // Agrupa por guardia
    const porGuardia = new Map<number, { nombre: string; rut: string; tareas: typeof turno.tareas }>()
    turno.tareas.forEach(t => {
      if (!porGuardia.has(t.guardiaId)) {
        porGuardia.set(t.guardiaId, {
          nombre: t.guardia?.nombre ?? '?',
          rut:    (t.guardia as any)?.rut ?? '?',
          tareas: [],
        })
      }
      porGuardia.get(t.guardiaId)!.tareas.push(t)
    })

    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="informe_turno_${turno.id}.pdf"`)
    doc.pipe(res)

    // Encabezado 
    doc.rect(0, 0, 595, 80).fill('#0d0f12')
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#f5a623')
      .text('S.I. PROTECTION', 50, 22)
    doc.fontSize(10).font('Helvetica').fillColor('#8b92a1')
      .text('Sistema de Supervision Operativa', 50, 48)
    doc.fontSize(9).fillColor('#4a5060')
      .text(`Generado: ${ahora.toLocaleString('es-CL')}`, 50, 62)

    // Numero de informe arriba a la derecha
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#f5a623')
      .text(`#${turno.id}`, 0, 22, { align: 'right' })
    doc.fontSize(8).font('Helvetica').fillColor('#4a5060')
      .text('N? DE TURNO', 0, 48, { align: 'right' })

    doc.fillColor('#000')
    doc.y = 95

    // Datos del turno 
    doc.roundedRect(50, doc.y, 495, 52, 4).fill('#f8f9fa')
    const iy = doc.y + 10
    doc.fontSize(8).font('Helvetica').fillColor('#888')
      .text('APERTURA DEL TURNO', 65, iy)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#222')
      .text(turno.inicio.toLocaleString('es-CL'), 65, iy + 12)

    doc.fontSize(8).font('Helvetica').fillColor('#888')
      .text('CIERRE DEL TURNO', 260, iy)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#222')
      .text(ahora.toLocaleString('es-CL'), 260, iy + 12)

    doc.fontSize(8).font('Helvetica').fillColor('#888')
      .text('SUPERVISOR', 430, iy)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#222')
      .text(turno.tareas[0]?.supervisor?.nombre ?? '?', 430, iy + 12)

    doc.y = iy + 52

    // Resumen estadistico 
    doc.moveDown(0.8)
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#222').text('Resumen del turno')
    doc.moveDown(0.4)

    // 4 cajas de stats
    const statY  = doc.y
    const statW  = 114
    const statGap = 9
    const stats  = [
      { label: 'TOTAL TAREAS',  value: String(turno.tareas.length),  color: '#222' },
      { label: 'APROBADAS',     value: String(aprobadas.length),      color: '#15803d' },
      { label: 'OBSERVACIONES', value: String(noAprobadas.length),    color: '#b91c1c' },
      { label: '% APROBACION',  value: `${pct}%`,
        color: pct >= 80 ? '#15803d' : pct >= 50 ? '#b45309' : '#b91c1c' },
    ]

    stats.forEach((s, i) => {
      const x = 50 + i * (statW + statGap)
      doc.roundedRect(x, statY, statW, 52, 4).fill('#f8f9fa')
      doc.fontSize(7).font('Helvetica').fillColor('#888')
        .text(s.label, x + 10, statY + 8, { width: statW - 20 })
      doc.fontSize(22).font('Helvetica-Bold').fillColor(s.color)
        .text(s.value, x + 10, statY + 20, { width: statW - 20 })
    })

    doc.y = statY + 62

    // Separador 
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').lineWidth(0.5).stroke()
    doc.moveDown(0.8)

    // Detalle por guardia 
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#222').text('Detalle por guardia')
    doc.moveDown(0.5)

    porGuardia.forEach(({ nombre, rut, tareas }) => {
      const aprobG = tareas.filter(t => t.estado === 'APROBADA').length

      // Verifica espacio ? salto de pagina si es necesario
      if (doc.y > 700) doc.addPage()

      // Cabecera del guardia
      doc.roundedRect(50, doc.y, 495, 28, 4).fill('#1a1a2e')
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#f5a623')
        .text(nombre, 62, doc.y + 8)
      doc.fontSize(9).font('Helvetica').fillColor('#8b92a1')
        .text(`RUT: ${rut}   ?   ${tareas.length} tarea${tareas.length !== 1 ? 's' : ''}   ?   ${aprobG} aprobada${aprobG !== 1 ? 's' : ''}`,
          62, doc.y + 8, { align: 'right', width: 470 })
      doc.y += 36

      // Tareas del guardia
      tareas.forEach((t, i) => {
        if (doc.y > 720) doc.addPage()

        const ok    = t.estado === 'APROBADA'
        const color = ok ? '#15803d' : '#b91c1c'
        const etiq  = ok ? '? APROBADA' : '? PENDIENTE'

        doc.roundedRect(50, doc.y, 495, 1, 0).fill('#eee')
        doc.y += 6

        doc.fontSize(9).font('Helvetica-Bold').fillColor(color)
          .text(`${i + 1}.  [${etiq}]`, 55, doc.y, { continued: true })
        doc.fillColor('#333')
          .font('Helvetica').text(`  Zona: ${t.zona}   |   Prioridad: ${t.prioridad}`)
        doc.fontSize(8).font('Helvetica').fillColor('#555')
          .text(`        Instruccion: ${t.descripcion}`, 55)

        if (t.evidencia) {
          doc.fillColor('#444')
            .text(`        Reporte: ${t.evidencia}`, 55)
        }

        if (t.observacion) {
          doc.fillColor('#b91c1c')
            .text(`        Observacion: ${t.observacion}`, 55)
        }

        // Foto en el PDF
        if (t.fotoUrl) {
          const rutaFoto = path.join(__dirname, '../..', t.fotoUrl)
          if (fs.existsSync(rutaFoto)) {
            try {
              if (doc.y > 650) doc.addPage()
              doc.image(rutaFoto, 55, doc.y + 4, { width: 120, height: 80 })
              doc.y += 92
            } catch { /* foto invalida, se omite */ }
          }
        }

        doc.moveDown(0.5)
      })

      doc.moveDown(0.4)
    })

    // Pie de pagina 
    const pY = 780
    doc.moveTo(50, pY).lineTo(545, pY).strokeColor('#ddd').lineWidth(0.5).stroke()

    // Linea de firma
    doc.moveTo(330, pY + 30).lineTo(540, pY + 30).strokeColor('#999').lineWidth(0.5).stroke()
    doc.fontSize(8).font('Helvetica').fillColor('#777')
      .text('Firma del Supervisor', 330, pY + 34, { width: 210, align: 'center' })

    doc.fontSize(7).fillColor('#bbb')
      .text(`S.I. Protection ? Informe Turno #${turno.id} ? ${ahora.toLocaleString('es-CL')}`, 50, pY + 10, { width: 270 })

    doc.end()
  } catch {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar el informe.' })
    }
  }
}