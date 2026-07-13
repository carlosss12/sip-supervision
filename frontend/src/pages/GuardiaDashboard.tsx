import { Tarea } from '../types/Tarea'
import TaskCard from '../components/TaskCard'

interface Props {
  tareas: Tarea[]; usuarioId: number
  comentarioGuardia: Record<number, string>; setComentarioGuardia: (v: Record<number, string>) => void
  imagenBase64: Record<number, string>;      setImagenBase64:      (v: Record<number, string>) => void
  capturarFotoNativa: (e: React.ChangeEvent<HTMLInputElement>, id: number) => void
  enviarEvidenciaDesdeWeb: (id: number) => void
  fileInputRef: React.MutableRefObject<Record<number, HTMLInputElement | null>>
}

export default function GuardiaDashboard(props: Props) {
  const tareasGuardia = props.tareas.filter(t => t.guardia?.id === props.usuarioId)
  const activas       = tareasGuardia.filter(t => t.estado === 'PENDIENTE' || t.estado === 'EN_REVISION')
  const archivadas    = tareasGuardia.filter(t => t.estado === 'APROBADA'  || t.estado === 'RECHAZADA')

  return (
    <div className="guardia-layout">
      <div className="guardia-header-bar">
        <div className="guardia-header-dot" />
        <span className="guardia-header-text">Terminal móvil — Órdenes de trabajo asignadas</span>
      </div>

      {tareasGuardia.length === 0 ? (
        <div className="guardia-empty">
          <div className="guardia-empty-icon">◎</div>
          <div className="guardia-empty-title">Sin tareas asignadas</div>
          <div className="guardia-empty-sub">El supervisor enviará instrucciones cuando sea necesario.</div>
        </div>
      ) : (
        <>
          {activas.length > 0 && (
            <div>
              <span className="guardia-section-label">Tareas activas ({activas.length})</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activas.map(t => (
                  <TaskCard key={t.id} tarea={t}>
                    {t.estado === 'PENDIENTE' && (
                      <div className="evidencia-form">
                        {t.observacion && (
                          <div className="rechazo-box">
                            <span className="rechazo-label">Motivo del rechazo</span>
                            <p className="rechazo-text">{t.observacion}</p>
                          </div>
                        )}

                        <div className="field">
                          <label className="field-label">Informe de campo <span className="field-required">*</span></label>
                          <textarea className="form-control-sip"
                            placeholder="Describe la condición del área inspeccionada..."
                            value={props.comentarioGuardia[t.id] || ''}
                            onChange={e => props.setComentarioGuardia({ ...props.comentarioGuardia, [t.id]: e.target.value })}
                            style={{ height: 72, resize: 'none', lineHeight: 1.5 }} />
                        </div>

                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          ref={el => { props.fileInputRef.current[t.id] = el }}
                          onChange={e => props.capturarFotoNativa(e, t.id)} />

                        <button type="button"
                          className={`foto-btn ${props.imagenBase64[t.id] ? 'foto-cargada' : ''}`}
                          onClick={() => props.fileInputRef.current[t.id]?.click()}>
                          <span className="foto-icon">{props.imagenBase64[t.id] ? '✓' : '📷'}</span>
                          <span>{props.imagenBase64[t.id] ? 'Fotografía adjuntada — toca para cambiar' : 'Adjuntar fotografía de evidencia'}</span>
                        </button>

                        {props.imagenBase64[t.id] && (
                          <img src={props.imagenBase64[t.id]} alt="Preview"
                            style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 'var(--r-md)', border: '1px solid var(--border-2)' }} />
                        )}

                        <button className="btn-primary-sip" style={{ width: '100%', padding: 13 }}
                          onClick={() => props.enviarEvidenciaDesdeWeb(t.id)}>
                          Enviar evidencia al supervisor
                        </button>
                      </div>
                    )}

                    {t.estado === 'EN_REVISION' && (
                      <div className="estado-bloque estado-revision">
                        <span style={{ fontSize: 16 }}>⏳</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>Evidencia enviada</div>
                          <div style={{ fontSize: 11, opacity: .75, marginTop: 2 }}>Esperando validación del supervisor.</div>
                        </div>
                      </div>
                    )}
                  </TaskCard>
                ))}
              </div>
            </div>
          )}

          {archivadas.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <span className="guardia-section-label">Historial del turno ({archivadas.length})</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {archivadas.map(t => (
                  <TaskCard key={t.id} tarea={t}>
                    <div className={`estado-bloque ${t.estado === 'APROBADA' ? 'estado-archivado' : ''}`}
                      style={t.estado !== 'APROBADA' ? { background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 500 } : undefined}>
                      <span>{t.estado === 'APROBADA' ? '✓' : '✕'}</span>
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