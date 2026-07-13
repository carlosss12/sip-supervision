import { IconCamera, IconCheck, IconX, IconAlert } from '../components/Icons'
import { Tarea } from '../types/Tarea'
import TaskCard from '../components/TaskCard'

interface Props {
  tareas: Tarea[]
  usuarioId: number
  comentarioGuardia: Record<number, string>
  setComentarioGuardia: (v: Record<number, string>) => void
  imagenBase64: Record<number, string>
  setImagenBase64: (v: Record<number, string>) => void
  capturarFotoNativa: (e: React.ChangeEvent<HTMLInputElement>, id: number) => void
  enviarEvidenciaDesdeWeb: (id: number) => void
  fileInputRef: React.MutableRefObject<Record<number, HTMLInputElement | null>>
}


function turnoActualLabel(): string {
  const h = new Date().getHours()
  if (h >= 6  && h < 14) return 'Mañana  06:00 – 14:00'
  if (h >= 14 && h < 22) return 'Tarde  14:00 – 22:00'
  return 'Noche  22:00 – 06:00'
}

function turnoActualColor(): string {
  const h = new Date().getHours()
  if (h >= 6  && h < 14) return '#f5a623'
  if (h >= 14 && h < 22) return '#3b82f6'
  return '#a855f7'
}

export default function GuardiaDashboard(props: Props) {
  const tareasGuardia = props.tareas.filter(t => t.guardia?.id === props.usuarioId)
  const activas       = tareasGuardia.filter(t => t.estado === 'PENDIENTE' || t.estado === 'EN_REVISION')
  const archivadas    = tareasGuardia.filter(t => t.estado === 'APROBADA'  || t.estado === 'RECHAZADA')
  const rechazadas    = activas.filter(t => t.estado === 'PENDIENTE' && t.observacion)

  return (
    <div className="guardia-layout">

      {/* Header con info de turno */}
      <div style={{ paddingBottom: 14, marginBottom: 4, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div className="guardia-header-dot" />
          <span className="guardia-header-text">Terminal móvil — Órdenes de trabajo</span>
        </div>

        {/* Tarjeta de turno activo */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        }}>
          <div style={{
            padding: '10px 14px',
            background: 'var(--surface)',
            border: `1px solid ${turnoActualColor()}33`,
            borderRadius: 'var(--r-md)',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>
              Turno activo
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: turnoActualColor() }}>
              {turnoActualLabel().split('  ')[0]}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2, fontFamily: 'var(--mono)' }}>
              {turnoActualLabel().split('  ')[1]}
            </div>
          </div>

          <div style={{
            padding: '10px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>
              Supervisor
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {tareasGuardia[0]?.supervisor?.nombre ?? '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>
              {tareasGuardia.length} tarea{tareasGuardia.length !== 1 ? 's' : ''} asignada{tareasGuardia.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de tareas rechazadas */}
      {rechazadas.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239,68,68,.08)',
          border: '1px solid rgba(239,68,68,.3)',
          borderRadius: 'var(--r-md)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <IconAlert size={18} color="var(--red)" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>
              {rechazadas.length} tarea{rechazadas.length > 1 ? 's' : ''} devuelta{rechazadas.length > 1 ? 's' : ''} por el supervisor
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
              Revisa el motivo y envía nuevamente la evidencia corregida.
            </div>
          </div>
        </div>
      )}

      {tareasGuardia.length === 0 ? (
        <div className="guardia-empty">
          <div className="guardia-empty-icon">◎</div>
          <div className="guardia-empty-title">Sin tareas asignadas</div>
          <div className="guardia-empty-sub">
            El supervisor enviará instrucciones cuando sea necesario.
          </div>
        </div>
      ) : (
        <>
          {/* Tareas activas */}
          {activas.length > 0 && (
            <div>
              <span className="guardia-section-label">
                Tareas activas ({activas.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activas.map(t => {
                  const fueRechazada = t.estado === 'PENDIENTE' && !!t.observacion
                  return (
                    <TaskCard key={t.id} tarea={t} ocultarObservacion>

                      {/* Banner de rechazo previo */}
                      {fueRechazada && (
                        <div style={{
                          padding: '10px 14px',
                          background: 'rgba(239,68,68,.08)',
                          border: '1px solid rgba(239,68,68,.25)',
                          borderRadius: 'var(--r-sm)',
                          marginBottom: 4,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                            Tarea devuelta — corrección requerida
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                            <strong style={{ color: 'var(--red)' }}>Motivo:</strong> {t.observacion}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                            Corrige la evidencia y vuelve a enviar.
                          </div>
                        </div>
                      )}

                      {/* Formulario de evidencia */}
                      {t.estado === 'PENDIENTE' && (
                        <div className="evidencia-form">
                          <div className="field">
                            <label className="field-label">
                              {fueRechazada ? 'Nueva evidencia corregida' : 'Informe de campo'}
                              <span className="field-required"> *</span>
                            </label>
                            <textarea className="form-control-sip"
                              placeholder="Describe la condición del área inspeccionada..."
                              value={props.comentarioGuardia[t.id] || ''}
                              onChange={e => props.setComentarioGuardia({
                                ...props.comentarioGuardia, [t.id]: e.target.value
                              })}
                              style={{ height: 72, resize: 'none', lineHeight: 1.5 }} />
                          </div>

                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            ref={el => { props.fileInputRef.current[t.id] = el }}
                            onChange={e => props.capturarFotoNativa(e, t.id)} />

                          <button type="button"
                            className={`foto-btn ${props.imagenBase64[t.id] ? 'foto-cargada' : ''}`}
                            onClick={() => props.fileInputRef.current[t.id]?.click()}>
                            <span className="foto-icon">
                              {props.imagenBase64[t.id] ? 'ok' : '📷'}
                            </span>
                            <span>
                              {props.imagenBase64[t.id]
                                ? 'Fotografia adjuntada — toca para cambiar'
                                : 'Adjuntar fotografía de evidencia'}
                            </span>
                          </button>

                          {props.imagenBase64[t.id] && (
                            <img src={props.imagenBase64[t.id]} alt="Preview"
                              style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 'var(--r-md)', border: '1px solid var(--border-2)' }} />
                          )}

                          <button className="btn-primary-sip"
                            style={{ width: '100%', padding: 13 }}
                            onClick={() => props.enviarEvidenciaDesdeWeb(t.id)}>
                            {fueRechazada ? 'Reenviar evidencia corregida' : 'Enviar evidencia al supervisor'}
                          </button>
                        </div>
                      )}

                      {t.estado === 'EN_REVISION' && (
                        <div className="estado-bloque estado-revision">
                          <IconX size={14} color="var(--blue)" style={{ opacity: 0.6 }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>Evidencia enviada</div>
                            <div style={{ fontSize: 11, opacity: .75, marginTop: 2 }}>
                              Esperando validación del supervisor.
                            </div>
                          </div>
                        </div>
                      )}
                    </TaskCard>
                  )
                })}
              </div>
            </div>
          )}

          {/* Historial del turno */}
          {archivadas.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <span className="guardia-section-label">
                Historial del turno ({archivadas.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {archivadas.map(t => (
                  <TaskCard key={t.id} tarea={t} ocultarObservacion>
                    <div className={`estado-bloque ${t.estado === 'APROBADA' ? 'estado-archivado' : ''}`}
                      style={t.estado !== 'APROBADA' ? {
                        background: 'var(--red-dim)',
                        border: '1px solid rgba(239,68,68,.2)',
                        color: 'var(--red)',
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 14px', borderRadius: 'var(--r-md)',
                        fontSize: 12, fontWeight: 500,
                      } : undefined}>
                      <span>{t.estado === 'APROBADA' ? <IconCheck size={13} color="var(--green)" /> : <IconX size={13} color="var(--red)" />}</span>
                      <span>{t.estado === 'APROBADA' ? 'Tarea aprobada por central' : 'Tarea rechazada'}</span>
                    </div>
                  </TaskCard>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}