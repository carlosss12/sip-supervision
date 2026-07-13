import { useState, ReactNode } from 'react'
import { Tarea } from '../types/Tarea'

interface Props { tarea: Tarea; children?: ReactNode; ocultarObservacion?: boolean }

const BADGE_MAP = {
  PENDIENTE:   { cls: 'badge-pending',  label: 'Pendiente'   },
  EN_REVISION: { cls: 'badge-review',   label: 'En revisión' },
  APROBADA:    { cls: 'badge-approved', label: 'Aprobada'    },
  RECHAZADA:   { cls: 'badge-rejected', label: 'Rechazada'   },
}

export default function TaskCard({ tarea, children, ocultarObservacion }: Props) {
  const [expandida, setExpandida] = useState(
    tarea.estado === 'EN_REVISION' || tarea.estado === 'PENDIENTE'
  )
  const badge      = BADGE_MAP[tarea.estado]
  const esUrgente  = tarea.prioridad === 'URGENTE'
  const esRevision = tarea.estado    === 'EN_REVISION'

  return (
    <div className={`task-card ${esUrgente ? 'urgente' : ''} ${esRevision ? 'revision' : ''}`}>

      {/* Header clickeable */}
      <div className="task-card-header" onClick={() => setExpandida(e => !e)}>
        <div className="task-card-meta">
          <span className="task-id">#{tarea.id}</span>
          {esUrgente && <span className="badge badge-urgente">⚡ URGENTE</span>}
          <span className={`badge ${badge.cls}`}>
            <span className="badge-dot" />{badge.label}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', userSelect: 'none' }}>
          {expandida ? '▲' : '▼'}
        </span>
      </div>

      {/* Cuerpo siempre visible */}
      <div className="task-card-body">
        <div className="task-zona">{tarea.zona}</div>
        <div className="task-desc">{tarea.descripcion}</div>
        {tarea.guardia && (
          <div className="task-guardia-row">
            <div className="task-guardia-avatar">{tarea.guardia.nombre.charAt(0)}</div>
            <span className="task-guardia-name">{tarea.guardia.nombre}</span>
          </div>
        )}
      </div>

      {/* Contenido expandible */}
      {expandida && (
        <div className="task-card-expanded">

          {/* Evidencia: texto a la izquierda, miniatura a la derecha */}
          {(tarea.evidencia || tarea.fotoUrl) && (
            <div style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--border-2)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '7px 12px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
                fontSize: 9, fontWeight: 700,
                letterSpacing: '.08em', color: 'var(--blue)',
                textTransform: 'uppercase',
              }}>
                Reporte del guardia
              </div>

              {/* Fila: texto + miniatura */}
              <div style={{ display: 'flex', gap: 12, padding: '10px 12px', alignItems: 'flex-start' }}>

                {/* Texto del reporte */}
                {tarea.evidencia && (
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{tarea.evidencia}"
                  </div>
                )}

                {/* Miniatura de la foto — fija 100x80px */}
                {tarea.fotoUrl && (
                  <div style={{ flexShrink: 0 }}>
                    <img
                      src={`http://localhost:4000${tarea.fotoUrl}`}
                      alt="Evidencia"
                      title="Clic para ver en tamaño completo"
                      onClick={() => window.open(`http://localhost:4000${tarea.fotoUrl}`, '_blank')}
                      style={{
                        width: 100, height: 80,
                        objectFit: 'cover',
                        borderRadius: 6,
                        border: '1px solid var(--border-2)',
                        cursor: 'pointer',
                        display: 'block',
                      }}
                    />
                    <div style={{
                      fontSize: 9, color: 'var(--blue)',
                      textAlign: 'center', marginTop: 4,
                      cursor: 'pointer', fontWeight: 600,
                    }}
                      onClick={() => window.open(`http://localhost:4000${tarea.fotoUrl}`, '_blank')}
                    >
                      Ver completa ↗
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observación de rechazo — solo visible para el supervisor */}
          {!ocultarObservacion && tarea.observacion && tarea.estado !== 'APROBADA' && (
            <div className="rechazo-box">
              <span className="rechazo-label">Observación del supervisor</span>
              <p className="rechazo-text">{tarea.observacion}</p>
            </div>
          )}

          {/* Botones de validación u otros slots */}
          {children}
        </div>
      )}
    </div>
  )
}