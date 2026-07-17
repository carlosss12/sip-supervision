import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth.middleware'

function turnoActualHora(): 'MANANA' | 'TARDE' | 'NOCHE' {
  const hora = new Date().getHours()
  if (hora >= 6  && hora < 14) return 'MANANA'
  if (hora >= 14 && hora < 22) return 'TARDE'
  return 'NOCHE'
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, contrasena } = req.body

  if (!email || !contrasena) {
    res.status(400).json({ error: 'Email y contraseña son requeridos.' })
    return
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    })

    const passwordValida =
      usuario && (await bcrypt.compare(String(contrasena), usuario.password))

    if (!usuario || !passwordValida) {
      res.status(401).json({ error: 'Credenciales incorrectas.' })
      return
    }

    if (!usuario.activo) {
      res.status(403).json({ error: 'Cuenta desactivada.' })
      return
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET!,
      { expiresIn: '12h' }
    )

    res.json({
      token,
      id:     usuario.id,
      nombre: usuario.nombre,
      email:  usuario.email,
      role:   usuario.rol,
    })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
}

export const getGuardias = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const turnoHora = turnoActualHora()
    const guardias  = await prisma.usuario.findMany({
      where:   { rol: 'GUARDIA', activo: true, turno: turnoHora },
      select:  { id: true, nombre: true, email: true, rut: true, telefono: true, turno: true },
      orderBy: { nombre: 'asc' },
    })
    res.json(guardias)
  } catch {
    res.status(500).json({ error: 'Error al obtener guardias.' })
  }
}

export const getTodosGuardias = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guardias = await prisma.usuario.findMany({
      where:   { rol: 'GUARDIA' },
      select:  { id: true, nombre: true, email: true, rut: true, telefono: true, turno: true, activo: true },
      orderBy: { nombre: 'asc' },
    })
    res.json(guardias)
  } catch {
    res.status(500).json({ error: 'Error al obtener guardias.' })
  }
}

export const crearGuardia = async (req: AuthRequest, res: Response): Promise<void> => {
  const { nombre, email, password, rut, telefono, turno } = req.body

  if (!nombre || !email || !password || !turno) {
    res.status(400).json({ error: 'Nombre, email, password y turno son requeridos.' })
    return
  }

  if (!['MANANA', 'TARDE', 'NOCHE'].includes(turno)) {
    res.status(400).json({ error: 'Turno debe ser MANANA, TARDE o NOCHE.' })
    return
  }

  try {
    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) {
      res.status(409).json({ error: 'Ya existe un usuario con ese email.' })
      return
    }

    if (rut) {
      const rutExiste = await prisma.usuario.findUnique({ where: { rut } })
      if (rutExiste) {
        res.status(409).json({ error: 'Ya existe un guardia con ese RUT.' })
        return
      }
    }

    const hash    = await bcrypt.hash(String(password), 10)
    const guardia = await prisma.usuario.create({
      data: {
        nombre, email: email.trim().toLowerCase(),
        password: hash, rol: 'GUARDIA',
        rut: rut || null,
        telefono: telefono || null,
        turno,
      },
      select: { id: true, nombre: true, email: true, rut: true, telefono: true, turno: true, activo: true },
    })

    res.status(201).json(guardia)
  } catch {
    res.status(500).json({ error: 'Error al crear el guardia.' })
  }
}

export const actualizarGuardia = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id)
  const { nombre, email, password, rut, telefono, turno, activo } = req.body

  try {
    const data: any = {}
    if (nombre)   data.nombre   = nombre
    if (email)    data.email    = email.trim().toLowerCase()
    if (password) data.password = await bcrypt.hash(String(password), 10)
    if (rut)      data.rut      = rut
    if (telefono) data.telefono = telefono
    if (turno)    data.turno    = turno
    if (activo !== undefined) data.activo = activo

    const guardia = await prisma.usuario.update({
      where:  { id },
      data,
      select: { id: true, nombre: true, email: true, rut: true, telefono: true, turno: true, activo: true },
    })

    res.json(guardia)
  } catch {
    res.status(500).json({ error: 'Error al actualizar el guardia.' })
  }
}

export const eliminarGuardia = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id)
  try {
    await prisma.usuario.update({
      where: { id },
      data:  { activo: false },
    })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Error al eliminar el guardia.' })
  }
}