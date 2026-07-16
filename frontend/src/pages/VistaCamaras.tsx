import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import { IconArrowLeft } from '../components/Icons'

interface Camara { id: number; nombre: string }

interface Props { onVolver: () => void }

// Componente que refresca la imagen automaticamente
function RefreshImage({ src, intervalo, alt, style }: {
  src: string; intervalo: number; alt: string; style?: React.CSSProperties
}) {
  const [url, setUrl]     = useState(`${src}?t=${Date.now()}`)
  const [error, setError] = useState(false)

  useEffect(() => {
    setError(false)
    setUrl(`${src}?t=${Date.now()}`)
    const iv = setInterval(() => {
      setUrl(`${src}?t=${Date.now()}`)
      setError(false)
    }, intervalo)
    return () => clearInterval(iv)
  }, [src, intervalo])

  if (error) {
    return (
      <div style={{
        ...style,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0a0a0a', color: 'var(--muted)', fontSize: 11,
        flexDirection: 'column', gap: 6,
      }}>
        <span style={{ fontSize: 20, opacity: .4 }}>◎</span>
        <span>Sin senal</span>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      style={style}
      onError={() => setError(true)}
    />
  )
}

export default function VistaCamaras({ onVolver }: Props) {
  const [camaras,   setCamaras]   = useState<Camara[]>([])
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    apiClient.get<Camara[]>('/camaras')
      .then(r => {
        setCamaras(r.data)
        if (r.data.length > 0) setSeleccion(r.data[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const snapUrl = (id: number) =>
    `http://localhost:4000/api/camaras/${id}/snapshot`

  const camaraSeleccionada = camaras.find(c => c.id === seleccion)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '12px 24px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button onClick={onVolver} style={{
          background: 'none', border: 'none', color: 'var(--primary)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, padding: 0,
        }}>
          <IconArrowLeft size={14} color="var(--primary)" />
          Volver a bitacora
        </button>
        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
        <div>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Centro de Mando y Control</span>
          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 10 }}>
            {camaras.length} camara{camaras.length !== 1 ? 's' : ''} · actualizacion automatica
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>EN VIVO</span>
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
          Conectando con el NVR...
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Vista principal de la camara seleccionada */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#000' }}>
            {camaraSeleccionada && (
              <>
                <RefreshImage
                  src={snapUrl(camaraSeleccionada.id)}
                  intervalo={3000}
                  alt={camaraSeleccionada.nombre}
                  style={{ flex: 1, width: '100%', objectFit: 'contain', display: 'block' }}
                />
                <div style={{
                  padding: '8px 16px', background: 'rgba(0,0,0,0.8)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                    {camaraSeleccionada.nombre}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                    Refresh: 3s
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Panel lateral con miniaturas */}
          <div style={{
            width: 200, flexShrink: 0,
            background: 'var(--surface)',
            borderLeft: '1px solid var(--border)',
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 0,
          }}>
            <div style={{ padding: '10px 12px', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
              Canales
            </div>
            {camaras.map(cam => (
              <div
                key={cam.id}
                onClick={() => setSeleccion(cam.id)}
                style={{
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: seleccion === cam.id ? 'var(--surface-3)' : 'transparent',
                  borderLeft: seleccion === cam.id ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'all .15s',
                }}
              >
                <RefreshImage
                  src={snapUrl(cam.id)}
                  intervalo={8000}
                  alt={cam.nombre}
                  style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                />
                <div style={{ padding: '5px 10px', fontSize: 11, fontWeight: seleccion === cam.id ? 700 : 400, color: seleccion === cam.id ? 'var(--primary)' : 'var(--text-2)' }}>
                  {cam.nombre}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }
      `}</style>
    </div>
  )
}