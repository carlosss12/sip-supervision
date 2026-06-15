import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const login = async (req: Request, res: Response) => {
  const { email, contrasena } = req.body;
  if (!email || !contrasena) {
    return res.status(400).json({ error: 'Email y contraseña requeridos.' });
  }
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (!usuario || usuario.contrasena !== contrasena) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      role: usuario.rol
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getGuardias = async (req: Request, res: Response) => {
  try {
    const guardias = await prisma.usuario.findMany({ where: { rol: 'GUARDIA' } });
    res.json(guardias);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};