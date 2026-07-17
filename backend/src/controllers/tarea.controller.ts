import { generarPDFTurno } from '../lib/pdf.service'
import { enviarPushAUsuario } from './push.controller'
import { Response } from 'express'
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

    const turnoActivo = await prisma.turno.findFirst({ where: { abierto: true } })
    if (!turnoActivo) { res.json([]); return }

    const tareas = await prisma.tarea.findMany({
      where:   { turnoId: turnoActivo.id },
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

    const incidencias = await prisma.incidencia.findMany({
      where:   { creadaEn: { gte: turno?.inicio ?? new Date() } },
      orderBy: { creadaEn: 'asc' },
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

    generarPDFTurno({
      id:          turno.id,
      inicio:      turno.inicio,
      fin:         ahora,
      tareas:      turno.tareas as any,
      supervisor:  turno.tareas[0]?.supervisor?.nombre ?? 'Supervisor',
      incidencias: incidencias as any,
    }, res)
    return
  } catch {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar el informe.' })
    }
  }
}