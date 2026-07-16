import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface TokenPayload {
  id:    number
  email: string
  rol:   'SUPERVISOR' | 'GUARDIA'
}

export interface AuthRequest extends Request {
  usuario?: TokenPayload
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido.' })
    return
  }
  try {
    const token   = header.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
    req.usuario   = payload
    next()
  } catch {
    res.status(401).json({ error: 'Token invalido o expirado.' })
  }
}

export const soloSupervisor = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.usuario?.rol !== 'SUPERVISOR') {
    res.status(403).json({ error: 'Acceso restringido a supervisores.' })
    return
  }
  next()
}

export const soloGuardia = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.usuario?.rol !== 'GUARDIA') {
    res.status(403).json({ error: 'Acceso restringido a guardias.' })
    return
  }
  next()
}