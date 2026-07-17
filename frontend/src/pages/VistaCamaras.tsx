import { useState, useEffect, useRef, useCallback } from 'react'
import apiClient from '../api/client'
import { IconArrowLeft } from '../components/Icons'

interface Camara { id: number; nombre: string }
interface Props  { onVolver: () => void }

// Hook que carga la imagen con token JWT y la convierte a blob URL
function useImagen(camaraId: number, intervalo: number) {
  const [url,   setUrl]   = useState<string | null>(null)
  const [error, setError] = useState(false)
  const prevUrl           = useRef<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const res    = await apiClient.get(`/camaras/${camaraId}/snapshot`, { responseType: 'blob' })
      const nuevo  = URL.createObjectURL(res.data)
      if (prevUrl.current) URL.revokeObjectURL(prevUrl.current)
      prevUrl.current = nuevo
      setUrl(nuevo)
      setError(false)
    } catch {
      setError(true)
    }
  }, [camaraId])

  useEffect(() => {
    cargar()
    const iv = setInterval(cargar, intervalo)
    return () => {
      clearInterval(iv)
      if (prevUrl.current) URL.revokeObjectURL(prevUrl.current)
    }
  }, [cargar, intervalo])

  return { url, error }
}

function SinSenal({ small = false }: { small?: boolean }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', gap: 4 }}>
      <span style={{ fontSize: small ? 16 : 36, opacity: .25 }}>◎</span>
      <span style={{ fontSize: small ? 10 : 12 }}>Sin senal</span>
    </div>
  )
}

function Miniatura({ camara, seleccionada, onClick }: { camara: Camara; seleccionada: boolean; onClick: () => void }) {
  const { url, error } = useImagen(camara.id, 8000)
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)', borderLeft: seleccionada ? '3px solid var(--primary)' : '3px solid transparent', background: seleccionada ? 'var(--surface-3)' : 'transparent', transition: 'all .15s' }}>
      <div style={{ width: '100%', height: 110, background: '#000', overflow: 'hidden' }}>
        {url && !error
          ? <img src={url} alt={camara.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <SinSenal small />
        }
      </div>
      <div style={{ padding: '5px 10px', fontSize: 11, fontWeight: seleccionada ? 700 : 400, color: seleccionada ? 'var(--primary)' : 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {camara.nombre}
      </div>
    </div>
  )
}

function VistaGrande({ camara }: { camara: Camara }) {
  const { url, error } = useImagen(camara.id, 3000)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {url && !error
          ? <img src={url} alt={camara.nombre} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          : <SinSenal />
        }
      </div>
      <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,.85)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{camara.nombre}</span>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Refresh: 3s</span>
      </div>
    </div>
  )
}

export default function VistaCamaras({ onVolver }: Props) {
  const [camaras,   setCamaras]   = useState<Camara[]>([])
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    apiClient.get<Camara[]>('/camaras')
      .then(r => { setCamaras(r.data); if (r.data.length > 0) setSeleccion(r.data[0].id) })
      .finally(() => setLoading(false))
  }, [])

  const seleccionada = camaras.find(c => c.id === seleccion) ?? null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div style={{ padding: '10px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onVolver} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <IconArrowLeft size={14} color="var(--primary)" />
          Volver a bitacora
        </button>
        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
        <span style={{ fontSize: 15, fontWeight: 700 }}>Centro de Mando y Control</span>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{camaras.length} camaras · actualizacion automatica</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'blink 2s infinite' }} />
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>EN VIVO</span>
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
          Conectando con el NVR...
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {seleccionada && <VistaGrande camara={seleccionada} />}
          <div style={{ width: 200, flexShrink: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)', overflowY: 'auto' }}>
            <div style={{ padding: '8px 12px', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
              Canales
            </div>
            {camaras.map(cam => (
              <Miniatura key={cam.id} camara={cam} seleccionada={seleccion === cam.id} onClick={() => setSeleccion(cam.id)} />
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}