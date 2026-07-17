import { Request, Response } from 'express'
import axios from 'axios'
import * as crypto from 'crypto'
import { AuthRequest } from '../middlewares/auth.middleware'

const NVR_IP   = process.env.NVR_IP   || '200.54.84.35'
const NVR_PORT = process.env.NVR_PORT || '49201'
const NVR_USER = process.env.NVR_USER || 'admin'
const NVR_PASS = process.env.NVR_PASS || 'Securitas2397*'

// Canales del NVR — canal 1 = 101, canal 2 = 201, etc.
const CAMARAS = [
  { id: 1,  canal: 101, nombre: 'C01 Ingreso Vehiculos' },
  { id: 2,  canal: 201, nombre: 'C02 Salida Vehiculos' },
  { id: 3,  canal: 301, nombre: 'C03 Salida Personal' },
  { id: 4,  canal: 401, nombre: 'C04 Salida Personal 2' },
  { id: 5,  canal: 501, nombre: 'C05 Entrada Personal' },
  { id: 6,  canal: 601, nombre: 'C06 Entrada Personal 2' },
  { id: 7,  canal: 701, nombre: 'C07 Costado Porteria' },
  { id: 8,  canal: 801, nombre: 'C08 Administracion' },
  { id: 9,  canal: 901, nombre: 'C09 Perim. Linea Ferrea 2' },
  { id: 10, canal: 1001, nombre: 'C10 Perim. Linea Ferrea 1' },
  { id: 11, canal: 1101, nombre: 'C11 Perim. Linea Ferrea 3' },
  { id: 12, canal: 1201, nombre: 'C12 Perim. Gran Bretana 1' },
  { id: 13, canal: 1301, nombre: 'C13 PTZ Gran Bretana' },
  { id: 14, canal: 1401, nombre: 'C14 Despacho' },
  { id: 15, canal: 1501, nombre: 'C15 Casilleros 2' },
  { id: 16, canal: 1601, nombre: 'C16 Entrada Casino' },
  { id: 17, canal: 1701, nombre: 'C17 PTZ Los Canelos' },
  { id: 18, canal: 1801, nombre: 'C18 Los Canelos 4' },
  { id: 19, canal: 1901, nombre: 'C19 Acceso Vehiculos Edyce 2' },
  { id: 20, canal: 2001, nombre: 'C20 Acceso Personal Edyce 2' },
  { id: 21, canal: 2101, nombre: 'C21 Salida Vehicular Edyce 2' },
  { id: 22, canal: 2201, nombre: 'C22 Salida Peatonal Edyce 2' },
  { id: 23, canal: 2301, nombre: 'C23 Patio Despacho 2' },
  { id: 24, canal: 2401, nombre: 'C24 PTZ Linea Ferrea' },
  { id: 25, canal: 2501, nombre: 'C25 Perim. Linea Ferrea 4' },
  { id: 26, canal: 2601, nombre: 'C26 PTZ Linea Ferrea 2' },
  { id: 27, canal: 2701, nombre: 'C27 Pintura Edyce 2' },
  { id: 28, canal: 2801, nombre: 'C28 T Perim. Linea Ferrea' },
  { id: 29, canal: 2901, nombre: 'C29 PTZ Linea Ferrea 1' },
  { id: 30, canal: 3001, nombre: 'C30 Perim. Gran Bretana' },
  { id: 31, canal: 3101, nombre: 'C31 Perim. Gran Bretana 2' },
  { id: 32, canal: 3201, nombre: 'C32 Perim. Algarrobo' },
]

// Autenticacion Digest para Hikvision
function parseDigestChallenge(wwwAuth: string) {
  const realm   = (wwwAuth.match(/realm="([^"]+)"/)   || [])[1] || ''
  const nonce   = (wwwAuth.match(/nonce="([^"]+)"/)   || [])[1] || ''
  const qop     = (wwwAuth.match(/qop="([^"]+)"/)     || [])[1] || ''
  const opaque  = (wwwAuth.match(/opaque="([^"]+)"/)  || [])[1] || ''
  return { realm, nonce, qop, opaque }
}

function buildDigestAuth(method: string, uri: string, challenge: ReturnType<typeof parseDigestChallenge>) {
  const { realm, nonce, qop, opaque } = challenge
  const nc     = '00000001'
  const cnonce = crypto.randomBytes(8).toString('hex')

  const ha1 = crypto.createHash('md5').update(`${NVR_USER}:${realm}:${NVR_PASS}`).digest('hex')
  const ha2 = crypto.createHash('md5').update(`${method}:${uri}`).digest('hex')
  const response = qop
    ? crypto.createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex')
    : crypto.createHash('md5').update(`${ha1}:${nonce}:${ha2}`).digest('hex')

  let header = `Digest username="${NVR_USER}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`
  if (qop)    header += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`
  if (opaque) header += `, opaque="${opaque}"`
  return header
}

async function fetchSnapshot(canal: number): Promise<Buffer> {
  const uri    = `/ISAPI/Streaming/channels/${canal}/picture`
  const base   = `http://${NVR_IP}:${NVR_PORT}`
  const url    = `${base}${uri}`
  const config = { timeout: 8000, validateStatus: () => true, responseType: 'arraybuffer' as const }

  // Primer intento — sin autenticacion
  let res = await axios.get(url, config)

  // Si pide autenticacion Digest (401)
  if (res.status === 401) {
    const wwwAuth = res.headers['www-authenticate'] || ''
    if (wwwAuth.toLowerCase().includes('digest')) {
      const challenge = parseDigestChallenge(wwwAuth)
      const authHeader = buildDigestAuth('GET', uri, challenge)
      res = await axios.get(url, {
        ...config,
        headers: { Authorization: authHeader },
      })
    } else {
      // Basic auth como fallback
      res = await axios.get(url, {
        ...config,
        auth: { username: NVR_USER, password: NVR_PASS },
      })
    }
  }

  if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(res.data as ArrayBuffer)
}

// GET /api/camaras
export const getCamaras = (_req: AuthRequest, res: Response): void => {
  res.json(CAMARAS.map(c => ({ id: c.id, nombre: c.nombre })))
}

// GET /api/camaras/:id/snapshot
export const getSnapshot = async (req: Request, res: Response): Promise<void> => {
  const camara = CAMARAS.find(c => c.id === Number(req.params.id))
  if (!camara) { res.status(404).json({ error: 'Camara no encontrada' }); return }

  try {
    const buffer = await fetchSnapshot(camara.canal)
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'no-cache, no-store')
    res.send(buffer)
  } catch (err: any) {
    res.status(502).json({ error: 'No se pudo obtener imagen del NVR.' })
  }
}