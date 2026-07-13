import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import apiClient from '../api/client'

type Gravedad = 'LEVE' | 'MEDIA' | 'GRAVE'
type EstadoInc = 'ABIERTA' | 'EN_GESTION' | 'CERRADA'

interface Incidencia {
  id: number; titulo: string; descripcion: string
  zona: string; gravedad: Gravedad; estado: EstadoInc
  resolucion: string | null; creadaEn: string; cerradaEn: string | null
  supervisor: { nombre: string }
}

interface Props { onVolver: () => void; supervisorId: number }

const GRAVEDAD_CFG: Record<Gravedad, { label: string; color: string; bg: string; icon: string }> = {
  LEVE:  { label: 'Leve',  color: '#22c55e', bg: 'rgba(34,197,94,.1)',   icon: '🟢' },
  MEDIA: { label: 'Media', color: '#f5a623', bg: 'rgba(245,166,35,.1)',  icon: '🟡' },
  GRAVE: { label: 'Grave', color: '#ef4444', bg: 'rgba(239,68,68,.1)',   icon: '🔴' },
}

const ESTADO_CFG: Record<EstadoInc, { label: string; color: string }> = {
  ABIERTA:    { label: 'Abierta',     color: '#ef4444' },
  EN_GESTION: { label: 'En gestión',  color: '#f5a623' },
  CERRADA:    { label: 'Cerrada',     color: '#22c55e' },
}

export default function Incidencias({ onVolver }: Props) {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [modal,       setModal]       = useState(false)
  const [gestion,     setGestion]     = useState<Incidencia | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [filtro,      setFiltro]      = useState<EstadoInc | 'TODAS'>('TODAS')

  const [form, setForm] = useState({
    titulo: '', descripcion: '', zona: '', gravedad: 'LEVE' as Gravedad,
  })
  const [resolucion, setResolucion] = useState('')

  const cargar = useCallback(async () => {
    try {
      const r = await apiClient.get<Incidencia[]>('/incidencias')
      setIncidencias(r.data)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const crearIncidencia = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.post('/incidencias', form)
      setModal(false)
      setForm({ titulo: '', descripcion: '', zona: '', gravedad: 'LEVE' })
      cargar()
    } catch { alert('Error al registrar la incidencia.') }
  }

  const actualizarEstado = async (id: number, estado: EstadoInc) => {
    try {
      await apiClient.put(`/incidencias/${id}`, { estado, resolucion: resolucion || undefined })
      setGestion(null); setResolucion(''); cargar()
    } catch { alert('Error al actualizar.') }
  }

  const filtradas = incidencias.filter(i => filtro === 'TODAS' || i.estado === filtro)
  const abiertas  = incidencias.filter(i => i.estado === 'ABIERTA').length
  const graves    = incidencias.filter(i => i.gravedad === 'GRAVE' && i.estado !== 'CERRADA').length

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '20px 28px' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={onVolver} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 6 }}>
            ← Volver a bitácora
          </button>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Registro de Incidencias</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {abiertas} abiertas
            {graves > 0 && <span style={{ color: 'var(--red)', marginLeft: 8, fontWeight: 700 }}>· {graves} GRAVE{graves > 1 ? 'S' : ''}</span>}
          </div>
        </div>
        <button className="btn-primary-sip" onClick={() => setModal(true)}>
          + Nueva incidencia
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['TODAS', 'ABIERTA', 'EN_GESTION', 'CERRADA'] as const).map(f => (
          <button key={f}
            className={`filter-chip ${filtro === f ? 'active' : ''}`}
            onClick={() => setFiltro(f)}>
            {f === 'TODAS' ? `Todas (${incidencias.length})` : ESTADO_CFG[f as EstadoInc]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Cargando...</p>
      ) : filtradas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛡️</div>
          <div className="empty-title">Sin incidencias registradas</div>
          <div className="empty-sub">Las incidencias del turno aparecerán aquí.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtradas.map(inc => {
            const gcfg = GRAVEDAD_CFG[inc.gravedad]
            const ecfg = ESTADO_CFG[inc.estado]
            return (
              <div key={inc.id} style={{
                background: 'var(--surface)', border: `1px solid ${inc.gravedad === 'GRAVE' && inc.estado !== 'CERRADA' ? 'rgba(239,68,68,.3)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)', overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14 }}>{gcfg.icon}</span>
                    <div>
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>#{inc.id}</span>
                      <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, color: gcfg.color, background: gcfg.bg }}>{gcfg.label}</span>
                      <span style={{ marginLeft: 6, padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, color: ecfg.color, background: `${ecfg.color}18` }}>{ecfg.label}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(inc.creadaEn).toLocaleString('es-CL')}</span>
                </div>

                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{inc.titulo}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>📍 {inc.zona}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>{inc.descripcion}</div>
                  {inc.resolucion && (
                    <div style={{ fontSize: 12, color: 'var(--green)', fontStyle: 'italic', marginTop: 4 }}>
                      ✓ Resolución: {inc.resolucion}
                    </div>
                  )}
                  {inc.estado !== 'CERRADA' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      {inc.estado === 'ABIERTA' && (
                        <button className="btn-secondary-sip" style={{ fontSize: 12 }}
                          onClick={() => actualizarEstado(inc.id, 'EN_GESTION')}>
                          Tomar gestión
                        </button>
                      )}
                      <button className="btn-secondary-sip" style={{ fontSize: 12 }}
                        onClick={() => { setGestion(inc); setResolucion('') }}>
                        Cerrar incidencia
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nueva incidencia */}
      {modal && createPortal(
        <>
          <div onClick={() => setModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201, width: '100%', maxWidth: 500, background: '#0d0f12', border: '1px solid #252b35', borderRadius: 16, boxShadow: '0 32px 80px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1c2028', background: '#131619', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: '#ef4444', textTransform: 'uppercase', fontFamily: 'var(--mono)', marginBottom: 6 }}>Nueva incidencia</div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>Registrar incidencia operativa</div>
              </div>
              <button onClick={() => setModal(false)} style={{ background: 'transparent', border: 'none', color: '#4a5060', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={crearIncidencia}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label className="field-label">Título <span className="field-required">*</span></label>
                  <input required className="form-control-sip" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ej: Intrusión detectada en sector norte" />
                </div>
                <div className="field">
                  <label className="field-label">Zona <span className="field-required">*</span></label>
                  <input required className="form-control-sip" value={form.zona} onChange={e => setForm(p => ({ ...p, zona: e.target.value }))} placeholder="Ej: Acceso norte — Cámara 03" />
                </div>
                <div className="field">
                  <label className="field-label">Descripción <span className="field-required">*</span></label>
                  <textarea required className="form-control-sip" value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Describe en detalle lo ocurrido..." style={{ height: 80, resize: 'none' }} />
                </div>
                <div className="field">
                  <label className="field-label">Nivel de gravedad <span className="field-required">*</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {(['LEVE','MEDIA','GRAVE'] as Gravedad[]).map(g => {
                      const cfg = GRAVEDAD_CFG[g]
                      return (
                        <button key={g} type="button" onClick={() => setForm(p => ({ ...p, gravedad: g }))}
                          style={{ padding: '10px', borderRadius: 10, border: `1px solid ${form.gravedad === g ? cfg.color + '55' : '#252b35'}`, background: form.gravedad === g ? cfg.bg : '#131619', color: form.gravedad === g ? cfg.color : '#4a5060', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                          <span>{cfg.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div style={{ padding: '14px 24px', borderTop: '1px solid #1c2028', background: '#131619', display: 'flex', gap: 10 }}>
                <button type="button" className="btn-secondary-sip" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary-sip" style={{ flex: 2, background: '#ef4444', color: 'white' }}>Registrar incidencia</button>
              </div>
            </form>
          </div>
        </>,
        document.body
      )}

      {/* Modal cerrar incidencia */}
      {gestion && createPortal(
        <>
          <div onClick={() => setGestion(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201, width: '100%', maxWidth: 420, background: '#0d0f12', border: '1px solid #252b35', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1c2028', background: '#131619' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Cerrar incidencia #{gestion.id}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{gestion.titulo}</div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div className="field">
                <label className="field-label">Resolución / acciones tomadas</label>
                <textarea className="form-control-sip" value={resolucion} onChange={e => setResolucion(e.target.value)} placeholder="Describe cómo se resolvió la incidencia..." style={{ height: 80, resize: 'none' }} />
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid #1c2028', background: '#131619', display: 'flex', gap: 10 }}>
              <button className="btn-secondary-sip" style={{ flex: 1 }} onClick={() => setGestion(null)}>Cancelar</button>
              <button className="btn-green-sip" style={{ flex: 2 }} onClick={() => actualizarEstado(gestion.id, 'CERRADA')}>Confirmar cierre</button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}