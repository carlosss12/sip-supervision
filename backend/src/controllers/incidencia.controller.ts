import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth.middleware'

// -- GET /api/incidencias ----------------------------------------------------
export const getIncidencias = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incidencias = await prisma.incidencia.findMany({
      include:  { supervisor: { select: { nombre: true } } },
      orderBy:  [{ gravedad: 'desc' }, { creadaEn: 'desc' }],
    })
    res.json(incidencias)
  } catch {
    res.status(500).json({ error: 'Error al obtener incidencias.' })
  }
}

// -- POST /api/incidencias ---------------------------------------------------
export const crearIncidencia = async (req: AuthRequest, res: Response): Promise<void> => {
  const { titulo, descripcion, zona, gravedad } = req.body

  if (!titulo || !descripcion || !zona || !gravedad) {
    res.status(400).json({ error: 'Todos los campos son requeridos.' })
    return
  }

  try {
    const incidencia = await prisma.incidencia.create({
      data: {
        titulo, descripcion, zona,
        gravedad:    gravedad ?? 'LEVE',
        supervisorId: req.usuario!.id,
      },
      include: { supervisor: { select: { nombre: true } } },
    })
    res.status(201).json(incidencia)
  } catch {
    res.status(500).json({ error: 'Error al crear la incidencia.' })
  }
}

// -- PUT /api/incidencias/:id ------------------------------------------------
export const actualizarIncidencia = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id)
  const { estado, resolucion } = req.body

  try {
    const data: any = { estado }
    if (resolucion) data.resolucion = resolucion
    if (estado === 'CERRADA') data.cerradaEn = new Date()

    const incidencia = await prisma.incidencia.update({
      where:   { id },
      data,
      include: { supervisor: { select: { nombre: true } } },
    })
    res.json(incidencia)
  } catch {
    res.status(500).json({ error: 'Error al actualizar la incidencia.' })
  }
}