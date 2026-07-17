import { limpiarBadgeTitulo } from '../hooks/useNotificaciones'
import { IconUser, IconList, IconAlert, IconBolt, IconChevronUp, IconChevronDown, IconArrowRight, IconPdf, IconDot, IconCamera } from '../components/Icons'
import { useState } from 'react'
import StatsCards from '../components/StatsCards'
import { Usuario } from '../types/Usuario'
import { Tarea }   from '../types/Tarea'

type Filtro = 'TODOS' | 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA'

interface Props {
  guardias: Usuario[]; tareas: Tarea[]
  nuevaZona: string; setNuevaZona: (v: string) => void
  nuevaDesc: string; setNuevaDesc: (v: string) => void
  nuevaPrioridad: 'NORMAL' | 'URGENTE'; setNuevaPrioridad: (v: 'NORMAL' | 'URGENTE') => void
  guardiaAsignadoId: string; setGuardiaAsignadoId: (v: string) => void
  crearOrdenTrabajo: (e: React.FormEvent) => void
  obsSupervisor: Record<number, string>; setObsSupervisor: (v: Record<number, string>) => void
  dictaminarTarea: (id: number, estado: 'APROBADA' | 'RECHAZADA') => void
  clausurarTurnoOperativo: () => void
  onGestionGuardias: () => void
  onHistorial: () => void
  onCamaras: () => void
  onIncidencias: () => void
}

const BADGE: Record<string, { cls: string; label: string }> = {
  PENDIENTE:   { cls: 'badge-pending',  label: 'Pendiente'   },
  EN_REVISION: { cls: 'badge-review',   label: 'En revisión' },
  APROBADA:    { cls: 'badge-approved', label: 'Aprobada'    },
  RECHAZADA:   { cls: 'badge-rejected', label: 'Rechazada'   },
}

export default function SupervisorDashboard(props: Props) {
  const [filtro,         setFiltro]         = useState<Filtro>('TODOS')
  const [busqueda,       setBusqueda]       = useState('')
  const [tareaSeleccion, setTareaSeleccion] = useState<Tarea | null>(null)

  const enRevision = props.tareas.filter(t => t.estado === 'EN_REVISION').length
  const pendientes = props.tareas.filter(t => t.estado === 'PENDIENTE').length

  const FILTROS: { key: Filtro; label: string; count?: number }[] = [
    { key: 'TODOS',       label: 'Todas',       count: props.tareas.length },
    { key: 'EN_REVISION', label: 'En revisión', count: enRevision },
    { key: 'PENDIENTE',   label: 'Pendientes',  count: pendientes },
    { key: 'APROBADA',    label: 'Aprobadas' },
    { key: 'RECHAZADA',   label: 'Rechazadas' },
  ]

  const tareasFiltradas = props.tareas
    .filter(t => filtro === 'TODOS' || t.estado === filtro)
    .filter(t =>
      !busqueda ||
      t.zona.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.guardia?.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )
    .sort((a, b) => {
      if (a.prioridad === 'URGENTE' && b.prioridad !== 'URGENTE') return -1
      if (b.prioridad === 'URGENTE' && a.prioridad !== 'URGENTE') return 1
      if (a.estado === 'EN_REVISION' && b.estado !== 'EN_REVISION') return -1
      if (b.estado === 'EN_REVISION' && a.estado !== 'EN_REVISION') return 1
      return b.id - a.id
    })

  // Sincroniza la tarea seleccionada con la data actualizada del polling
  const tareaActual = tareaSeleccion
    ? props.tareas.find(t => t.id === tareaSeleccion.id) ?? null
    : null

  const validar = async (accion: 'APROBADA' | 'RECHAZADA') => {
    if (!tareaActual) return
    props.dictaminarTarea(tareaActual.id, accion)
    setTareaSeleccion(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Stats bar */}
      <div style={{ padding: '12px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <StatsCards tareas={props.tareas} guardias={props.guardias} />
      </div>

      {/* Contenido principal: sidebar + lista + panel detalle */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ── Sidebar izquierdo ── */}
        <aside style={{
          width: 320, flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          padding: '20px', overflowY: 'auto',
          gap: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
            Nueva tarea
          </span>

          {props.guardias.length === 0 ? (
            <div style={{ padding: '10px', background: 'var(--surface-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-2)', fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>
              No hay guardias en este turno.
            </div>
          ) : (
            <form style={{ display: 'flex', flexDirection: 'column', gap: 8 }} onSubmit={props.crearOrdenTrabajo}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Guardia <span style={{ color: 'var(--primary)' }}>*</span></label>
                <select className="form-control-sip" required style={{ padding: '8px 10px' }}
                  value={props.guardiaAsignadoId}
                  onChange={e => props.setGuardiaAsignadoId(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {props.guardias.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Zona <span style={{ color: 'var(--primary)' }}>*</span></label>
                <input className="form-control-sip" required style={{ padding: '8px 10px' }}
                  placeholder="Ej: Cámara 04 — Norte"
                  value={props.nuevaZona}
                  onChange={e => props.setNuevaZona(e.target.value)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Instrucción <span style={{ color: 'var(--primary)' }}>*</span></label>
                <textarea className="form-control-sip" required style={{ padding: '10px 12px', height: 80, resize: 'none' }}
                  placeholder="Describe la acción..."
                  value={props.nuevaDesc}
                  onChange={e => props.setNuevaDesc(e.target.value)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Prioridad</label>
                <div style={{ display: 'flex', gap: 5 }}>
                  {(['NORMAL', 'URGENTE'] as const).map(p => (
                    <button key={p} type="button"
                      onClick={() => props.setNuevaPrioridad(p)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 6,
                        border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        background:  props.nuevaPrioridad === p ? (p === 'URGENTE' ? 'var(--primary-dim)' : 'var(--surface-3)') : 'transparent',
                        borderColor: props.nuevaPrioridad === p ? (p === 'URGENTE' ? 'var(--primary-bd)'  : 'var(--border-2)')   : 'var(--border)',
                        color:       props.nuevaPrioridad === p ? (p === 'URGENTE' ? 'var(--primary)'     : 'var(--text)')        : 'var(--muted)',
                      }}>
                      {p === 'URGENTE' ? '' : '·'} {p === 'URGENTE' ? 'Urgente' : 'Normal'}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary-sip" style={{ width: '100%', padding: '12px', fontSize: 14 }}>
                Asignar tarea
              </button>
            </form>
          )}

          <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />

          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            Navegación
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { icon: 'cam',   label: 'Cámaras en vivo',     sub: 'Centro de Mando y Control', fn: props.onCamaras,          color: 'var(--green)' },
              { icon: 'user',  label: 'Gestionar guardias',   sub: 'Alta, edición y turnos',    fn: props.onGestionGuardias,  color: 'var(--blue)' },
              { icon: 'list',  label: 'Historial de turnos',  sub: 'Turnos cerrados anteriores', fn: props.onHistorial,       color: 'var(--primary)' },
              { icon: 'alert', label: 'Incidencias',           sub: 'Registro de eventos',       fn: props.onIncidencias,     color: 'var(--red)' },
            ].map(btn => (
              <button key={btn.label}
                onClick={btn.fn}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'border-color .15s, background .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = btn.color; e.currentTarget.style.background = 'var(--surface-3)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: `${btn.color}18`, border: `1px solid ${btn.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  { btn.icon === 'cam'   && <IconCamera size={16} color={btn.color} /> }
                  { btn.icon === 'user'  && <IconUser   size={16} color={btn.color} /> }
                  { btn.icon === 'list'  && <IconList   size={16} color={btn.color} /> }
                  { btn.icon === 'alert' && <IconAlert  size={16} color={btn.color} /> }
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{btn.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{btn.sub}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />

          <button className="btn-danger-sip" style={{ width: '100%', fontSize: 13, padding: '12px' }}
            onClick={props.clausurarTurnoOperativo}>
            Cerrar turno y generar informe
          </button>
        </aside>

        {/* ── Lista de tareas ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Topbar */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Bitácora operativa</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                {props.guardias.length} guardia{props.guardias.length !== 1 ? 's' : ''} activo{props.guardias.length !== 1 ? 's' : ''} · actualización automática
              </div>
            </div>
            <input
              style={{ padding: '6px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', outline: 'none', fontSize: 12, width: 200 }}
              placeholder="Buscar zona, guardia..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          {/* Filtros */}
          <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, display: 'flex', gap: 4 }}>
            {FILTROS.map(f => (
              <button key={f.key}
                className={`filter-chip ${filtro === f.key ? 'active' : ''}`}
                onClick={() => setFiltro(f.key)}>
                {f.label}
                {f.count !== undefined && (
                  <span style={{ marginLeft: 4, background: 'var(--border-2)', color: 'var(--text-2)', borderRadius: 99, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Lista scrolleable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tareasFiltradas.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', gap: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 28, color: 'var(--border-2)' }}>◎</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                  {props.tareas.length === 0 ? 'Sin tareas en el turno' : 'Sin resultados'}
                </div>
                <div style={{ fontSize: 11 }}>
                  {props.tareas.length === 0 ? 'Usa el formulario lateral para asignar tareas.' : 'Prueba otro filtro.'}
                </div>
              </div>
            ) : (
              tareasFiltradas.map(t => {
                const badge = BADGE[t.estado]
                const seleccionada = tareaActual?.id === t.id
                return (
                  <div key={t.id}
                    onClick={() => { setTareaSeleccion(t); limpiarBadgeTitulo() }}
                    style={{
                      padding: '12px 16px',
                      background: seleccionada ? 'var(--surface-3)' : 'var(--surface)',
                      border: `1px solid ${seleccionada ? 'var(--primary-bd)' : t.prioridad === 'URGENTE' ? 'var(--primary-bd)' : t.estado === 'EN_REVISION' ? 'rgba(59,130,246,.3)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-md)',
                      cursor: 'pointer',
                      transition: 'all .15s',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                    }}
                    onMouseEnter={e => !seleccionada && (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => !seleccionada && (e.currentTarget.style.background = 'var(--surface)')}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>#{t.id}</span>
                        {t.prioridad === 'URGENTE' && <span className="badge badge-urgente" style={{ fontSize: 9, display: 'inline-flex', alignItems: 'center', gap: 3 }}><IconBolt size={9} color="var(--primary)" /> URGENTE</span>}
                        <span className={`badge ${badge.cls}`} style={{ fontSize: 10 }}>
                          <span className="badge-dot" />{badge.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.zona}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.descripcion}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--surface-3)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>
                          {t.guardia?.nombre.charAt(0)}
                        </div>
                        {t.guardia?.nombre}
                      </div>
                    </div>
                    <IconArrowRight size={12} color="var(--muted)" />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Panel de detalle (derecha) ── */}
        {tareaActual && (
          <div style={{
            width: 340, flexShrink: 0,
            borderLeft: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Header del panel */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Detalle de tarea #{tareaActual.id}</div>
              <button onClick={() => setTareaSeleccion(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', padding: '2px 6px' }}>
                x
              </button>
            </div>

            {/* Contenido scrolleable del panel */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Info básica */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tareaActual.prioridad === 'URGENTE' && <span className="badge badge-urgente" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><IconBolt size={10} color="var(--primary)" /> URGENTE</span>}
                  <span className={`badge ${BADGE[tareaActual.estado].cls}`}>
                    <span className="badge-dot" />{BADGE[tareaActual.estado].label}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{tareaActual.zona}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{tareaActual.descripcion}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--surface-3)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                    {tareaActual.guardia?.nombre.charAt(0)}
                  </div>
                  {tareaActual.guardia?.nombre}
                </div>
              </div>

              {/* Evidencia del guardia */}
              {(tareaActual.evidencia || tareaActual.fotoUrl) && (
                <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                  <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 9, fontWeight: 700, letterSpacing: '.08em', color: 'var(--blue)', textTransform: 'uppercase' }}>
                    Reporte del guardia
                  </div>
                  {tareaActual.evidencia && (
                    <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic', lineHeight: 1.6 }}>
                      "{tareaActual.evidencia}"
                    </div>
                  )}
                  {tareaActual.fotoUrl && (
                    <img
                      src={`http://localhost:4000${tareaActual.fotoUrl}`}
                      alt="Evidencia"
                      onClick={() => window.open(`http://localhost:4000${tareaActual.fotoUrl}`, '_blank')}
                      style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block', cursor: 'pointer', borderTop: '1px solid var(--border)' }}
                      title="Clic para ver en tamaño completo"
                    />
                  )}
                  {tareaActual.fotoUrl && (
                    <div style={{ padding: '6px 12px', fontSize: 10, color: 'var(--blue)', cursor: 'pointer', textAlign: 'right' }}
                      onClick={() => window.open(`http://localhost:4000${tareaActual.fotoUrl}`, '_blank')}>
                      Ver foto completa
                    </div>
                  )}
                </div>
              )}

              {/* Observación previa */}
              {tareaActual.observacion && tareaActual.estado !== 'APROBADA' && (
                <div style={{ padding: '10px 12px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--red)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                    Observación anterior
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{tareaActual.observacion}</div>
                </div>
              )}

              {/* Tarea aprobada */}
              {tareaActual.estado === 'APROBADA' && (
                <div style={{ padding: '12px', background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
                  Tarea aprobada
                </div>
              )}
            </div>

            {/* Botones de validación — siempre visibles al fondo */}
            {tareaActual.estado === 'EN_REVISION' && (
              <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Observación del supervisor</label>
                  <input
                    className="form-control-sip"
                    style={{ padding: '8px 12px', fontSize: 12 }}
                    placeholder="Opcional para aprobar, requerida para rechazar..."
                    value={props.obsSupervisor[tareaActual.id] || ''}
                    onChange={e => props.setObsSupervisor({ ...props.obsSupervisor, [tareaActual.id]: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-danger-sip" style={{ flex: 1, fontSize: 12 }}
                    onClick={() => validar('RECHAZADA')}>
                    Rechazar
                  </button>
                  <button className="btn-green-sip" style={{ flex: 1, fontSize: 12 }}
                    onClick={() => validar('APROBADA')}>
                    Aprobar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}