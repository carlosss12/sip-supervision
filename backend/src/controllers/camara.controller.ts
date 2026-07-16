import { Request, Response } from 'express'
import axios from 'axios'
import { AuthRequest } from '../middlewares/auth.middleware'

const NVR_IP   = process.env.NVR_IP   || '200.54.84.35'
const NVR_PORT = process.env.NVR_PORT || '49201'
const NVR_USER = process.env.NVR_USER || 'admin'
const NVR_PASS = process.env.NVR_PASS || 'Securitas2397*'

// 32 canales del NVR - formato snapshot: /ISAPI/Streaming/channels/[ID*100+1]/picture
const CAMARAS = [
  { id: 1,  nombre: 'C01 Ingreso Vehiculos' },
  { id: 2,  nombre: 'C02 Salida Vehiculos' },
  { id: 3,  nombre: 'C03 Salida Personal' },
  { id: 4,  nombre: 'C04' },
  { id: 5,  nombre: 'C05' },
  { id: 6,  nombre: 'C06' },
  { id: 7,  nombre: 'C07' },
  { id: 8,  nombre: 'C08' },
  { id: 9,  nombre: 'C09' },
  { id: 10, nombre: 'C10' },
  { id: 11, nombre: 'C11' },
  { id: 12, nombre: 'C12' },
  { id: 13, nombre: 'C13' },
  { id: 14, nombre: 'C14' },
  { id: 15, nombre: 'C15' },
  { id: 16, nombre: 'C16' },
  { id: 17, nombre: 'C17' },
  { id: 18, nombre: 'C18' },
  { id: 19, nombre: 'C19' },
  { id: 20, nombre: 'C20' },
  { id: 21, nombre: 'C21' },
  { id: 22, nombre: 'C22' },
  { id: 23, nombre: 'C23' },
  { id: 24, nombre: 'C24' },
  { id: 25, nombre: 'C25' },
  { id: 26, nombre: 'C26' },
  { id: 27, nombre: 'C27' },
  { id: 28, nombre: 'C28' },
  { id: 29, nombre: 'C29' },
  { id: 30, nombre: 'C30' },
  { id: 31, nombre: 'C31' },
  { id: 32, nombre: 'C32' },
]

// GET /api/camaras
export const getCamaras = (_req: AuthRequest, res: Response): void => {
  res.json(CAMARAS.map(c => ({ id: c.id, nombre: c.nombre })))
}

// GET /api/camaras/:id/snapshot
export const getSnapshot = async (req: Request, res: Response): Promise<void> => {
  const camara = CAMARAS.find(c => c.id === Number(req.params.id))
  if (!camara) {
    res.status(404).json({ error: 'Camara no encontrada' })
    return
  }

  // Canal 1 = 101, Canal 2 = 201, etc.
  const canal = camara.id * 100 + 1

  try {
    const url = `http://${NVR_IP}:${NVR_PORT}/ISAPI/Streaming/channels/${canal}/picture`
    const response = await axios.get(url, {
      auth:         { username: NVR_USER, password: NVR_PASS },
      responseType: 'arraybuffer',
      timeout:      8000,
    })
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'no-cache, no-store')
    res.send(response.data)
  } catch (err: any) {
    const status = err.response?.status
    if (status === 401) {
      res.status(401).json({ error: 'Credenciales incorrectas.' })
    } else {
      res.status(502).json({ error: 'Canal no disponible.' })
    }
  }
}