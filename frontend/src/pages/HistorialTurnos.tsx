import { useState, useEffect } from 'react'
import apiClient from '../api/client'

interface TareaHistorial {
  id: number; descripcion: string; zona: string
  prioridad: string; estado: string
  evidencia: string | null; observacion: string | null; fotoUrl: string | null
  guardia: { nombre: string; rut?: string } | null
}

interface TurnoHistorial {
  id: number; inicio: string; fin: string | null
  tareas: TareaHistorial[]
}

interface Props { onVolver: () => void }

export default function HistorialTurnos({ onVolver }: Props) {
  const [turnos,   setTurnos]   = useState<TurnoHistorial[]>([])
  const [expandido, setExpandido] = useState<number | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    apiClient.get<TurnoHistorial[]>('/turnos/historial')
      .then(r => setTurnos(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const descargarPDF = async (turnoId: number) => {
    try {
      const res = await apiClient.get(`/turnos/${turnoId}/pdf`, { responseType: 'blob' })
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url; link.download = `informe_turno_${turnoId}.pdf`; link.click()
      URL.revokeObjectURL(url)
    } catch { alert('No se pudo descargar el informe.') }
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '20px 28px' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={onVolver} style={{
            background: 'none', border: 'none', color: 'var(--primary)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 6,
          }}>
            ← Volver a bitácora
          </button>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Historial de turnos</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            Registro de los últimos 20 turnos cerrados
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Cargando historial...</p>
      ) : turnos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">Sin turnos anteriores</div>
          <div className="empty-sub">Los turnos cerrados aparecerán aquí.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {turnos.map(t => {
            const aprobadas  = t.tareas.filter(ta => ta.estado === 'APROBADA').length
            const total      = t.tareas.length
            const pct        = total > 0 ? Math.round((aprobadas / total) * 100) : 0
            const colorPct   = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--primary)' : 'var(--red)'
            const abierto    = expandido === t.id

            return (
              <div key={t.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)', overflow: 'hidden',
              }}>
                {/* Header del turno */}
                <div
                  onClick={() => setExpandido(abierto ? null : t.id)}
                  style={{
                    padding: '14px 18px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--surface-2)',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Turno #{t.id}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {new Date(t.inicio).toLocaleString('es-CL')}
                        {t.fin ? ` → ${new Date(t.fin).toLocaleString('es-CL')}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 99,
                        fontSize: 11, fontWeight: 700,
                        background: 'var(--surface-3)', color: 'var(--text-2)',
                      }}>
                        {total} tarea{total !== 1 ? 's' : ''}
                      </span>
                      <span style={{
                        padding: '3px 10px', borderRadius: 99,
                        fontSize: 11, fontWeight: 700,
                        color: colorPct,
                        background: `${colorPct}18`,
                        border: `1px solid ${colorPct}33`,
                      }}>
                        {pct}% aprobación
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{abierto ? '▲' : '▼'}</span>
                </div>

                {/* Detalle expandido */}
                {abierto && (
                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {t.tareas.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--muted)' }}>Sin tareas registradas en este turno.</p>
                    ) : (
                      t.tareas.map((ta, i) => (
                        <div key={ta.id} style={{
                          padding: '12px 14px',
                          background: 'var(--surface-2)',
                          border: `1px solid ${ta.estado === 'APROBADA' ? 'rgba(34,197,94,.2)' : 'var(--border)'}`,
                          borderRadius: 'var(--r-sm)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>
                              {i + 1}. {ta.zona}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                              color: ta.estado === 'APROBADA' ? 'var(--green)' : 'var(--red)',
                              background: ta.estado === 'APROBADA' ? 'var(--green-dim)' : 'var(--red-dim)',
                            }}>
                              {ta.estado}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                            👤 {ta.guardia?.nombre ?? '—'}
                            {ta.guardia?.rut ? ` | RUT: ${ta.guardia.rut}` : ''}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                            {ta.descripcion}
                          </div>
                          {ta.evidencia && (
                            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, fontStyle: 'italic' }}>
                              Reporte: "{ta.evidencia}"
                            </div>
                          )}
                          {ta.observacion && (
                            <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>
                              Obs: {ta.observacion}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}