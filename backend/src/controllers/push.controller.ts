import { Response } from 'express'
import webpush from 'web-push'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth.middleware'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL    || 'mailto:admin@sip.cl',
  process.env.VAPID_PUBLIC_KEY  || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export const getVapidPublicKey = (_req: AuthRequest, res: Response): void => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
}

export const suscribir = async (req: AuthRequest, res: Response): Promise<void> => {
  const { endpoint, keys } = req.body
  const usuarioId = req.usuario!.id

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: 'Suscripcion invalida.' })
    return
  }

  try {
    await prisma.pushSuscripcion.upsert({
      where:  { usuarioId_endpoint: { usuarioId, endpoint } },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: { usuarioId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Error al guardar suscripcion.' })
  }
}

export async function enviarPushAUsuario(usuarioId: number, titulo: string, cuerpo: string, datos?: object) {
  const suscripciones = await prisma.pushSuscripcion.findMany({ where: { usuarioId } })
  const payload = JSON.stringify({ titulo, cuerpo, datos })

  for (const s of suscripciones) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    } catch (err: any) {
      if (err.statusCode === 410) {
        await prisma.pushSuscripcion.delete({ where: { id: s.id } }).catch(() => {})
      }
    }
  }
}