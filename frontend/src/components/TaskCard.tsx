import { useState, ReactNode } from 'react'
import { Tarea } from '../types/Tarea'

interface Props { tarea: Tarea; children?: ReactNode }

const BADGE_MAP = {
  PENDIENTE:   { cls: 'badge-pending',  label: 'Pendiente'   },
  EN_REVISION: { cls: 'badge-review',   label: 'En revisión' },
  APROBADA:    { cls: 'badge-approved', label: 'Aprobada'    },
  RECHAZADA:   { cls: 'badge-rejected', label: 'Rechazada'   },
}

export default function TaskCard({ tarea, children }: Props) {
  const [expandida, setExpandida] = useState(
    tarea.estado === 'EN_REVISION' || tarea.estado === 'PENDIENTE'
  )
  const badge      = BADGE_MAP[tarea.estado]
  const esUrgente  = tarea.prioridad === 'URGENTE'
  const esRevision = tarea.estado    === 'EN_REVISION'

  return (
    <div className={`task-card ${esUrgente ? 'urgente' : ''} ${esRevision ? 'revision' : ''}`}>

      {/* Header clickeable para colapsar */}
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

          {/* Evidencia del guardia */}
          {(tarea.evidencia || tarea.fotoUrl) && (
            <div className="evidencia-box">
              <div className="evidencia-box-header">
                Reporte del guardia
                {tarea.fotoUrl && (
                  <a
                    href={`http://localhost:4000${tarea.fotoUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      float: 'right', color: 'var(--blue)',
                      fontSize: 10, fontWeight: 600, textDecoration: 'none',
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    Ver foto completa ↗
                  </a>
                )}
              </div>

              {tarea.evidencia && (
                <div className="evidencia-texto">"{tarea.evidencia}"</div>
              )}

              {/* Foto acotada — clic abre en pestaña nueva */}
              {tarea.fotoUrl && (
                <img
                  src={`http://localhost:4000${tarea.fotoUrl}`}
                  alt="Evidencia fotográfica"
                  title="Clic para ver en tamaño completo"
                  style={{
                    width: '100%',
                    height: 160,
                    objectFit: 'cover',
                    display: 'block',
                    cursor: 'pointer',
                    borderTop: '1px solid var(--border)',
                  }}
                  onClick={() =>
                    window.open(`http://localhost:4000${tarea.fotoUrl}`, '_blank')
                  }
                />
              )}
            </div>
          )}

          {/* Observación de rechazo */}
          {tarea.observacion && tarea.estado !== 'APROBADA' && (
            <div className="rechazo-box">
              <span className="rechazo-label">Observación del supervisor</span>
              <p className="rechazo-text">{tarea.observacion}</p>
            </div>
          )}

          {/* Slot para botones de validación o formulario de evidencia */}
          {children}
        </div>
      )}
    </div>
  )
}