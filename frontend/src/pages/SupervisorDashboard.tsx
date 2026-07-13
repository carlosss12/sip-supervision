import { useState } from 'react'
import StatsCards from '../components/StatsCards'
import TaskCard   from '../components/TaskCard'
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
}

export default function SupervisorDashboard(props: Props) {
  const [filtro,   setFiltro]   = useState<Filtro>('TODOS')
  const [busqueda, setBusqueda] = useState('')

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

  return (
    <>
      {/* Stats */}
      <div style={{ padding: '16px 24px 0', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <StatsCards tareas={props.tareas} guardias={props.guardias} />
      </div>

      <div className="sup-layout">
        {/* ── Sidebar ── */}
        <aside className="sup-sidebar">
          <span className="sup-sidebar-label">Nueva tarea</span>

          {props.guardias.length === 0 ? (
            <div style={{ padding: '12px', background: 'var(--surface-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-2)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
              No hay guardias disponibles en este turno. Crea guardias o espera el cambio de turno.
            </div>
          ) : (
            <form className="sidebar-form" onSubmit={props.crearOrdenTrabajo}>
              <div className="field">
                <label className="field-label">Guardia <span className="field-required">*</span></label>
                <select className="form-control-sip" required
                  value={props.guardiaAsignadoId}
                  onChange={e => props.setGuardiaAsignadoId(e.target.value)}>
                  <option value="">Seleccionar guardia...</option>
                  {props.guardias.map(g => (
                    <option key={g.id} value={g.id}>{g.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label">Zona / instalación <span className="field-required">*</span></label>
                <input className="form-control-sip" required
                  placeholder="Ej: Acceso norte — Cámara 04"
                  value={props.nuevaZona}
                  onChange={e => props.setNuevaZona(e.target.value)} />
              </div>

              <div className="field">
                <label className="field-label">Instrucción <span className="field-required">*</span></label>
                <textarea className="form-control-sip" required
                  placeholder="Describe la acción requerida..."
                  value={props.nuevaDesc}
                  onChange={e => props.setNuevaDesc(e.target.value)} />
              </div>

              <div className="field">
                <label className="field-label">Prioridad</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['NORMAL', 'URGENTE'] as const).map(p => (
                    <button key={p} type="button"
                      onClick={() => props.setNuevaPrioridad(p)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 'var(--r-md)',
                        border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background:  props.nuevaPrioridad === p ? (p === 'URGENTE' ? 'var(--primary-dim)' : 'var(--surface-3)') : 'transparent',
                        borderColor: props.nuevaPrioridad === p ? (p === 'URGENTE' ? 'var(--primary-bd)'  : 'var(--border-2)')   : 'var(--border)',
                        color:       props.nuevaPrioridad === p ? (p === 'URGENTE' ? 'var(--primary)'     : 'var(--text)')        : 'var(--muted)',
                      }}>
                      {p === 'URGENTE' ? '⚡ Urgente' : '· Normal'}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary-sip" style={{ width: '100%' }}>
                Asignar tarea
              </button>
            </form>
          )}

          <div className="sidebar-divider" />

          <button className="btn-secondary-sip" style={{ width: '100%', fontSize: 12, marginBottom: 8 }}
            onClick={props.onGestionGuardias}>
            👤 Gestionar guardias
          </button>

          <button className="btn-danger-sip" style={{ width: '100%', fontSize: 12 }}
            onClick={props.clausurarTurnoOperativo}>
            Cerrar turno y generar PDF
          </button>
        </aside>

        {/* ── Panel principal ── */}
        <div className="sup-main">
          <div className="sup-topbar">
            <div>
              <div className="sup-page-title">Bitácora operativa</div>
              <div className="sup-page-sub">
                Turno en curso · {props.guardias.length} guardia{props.guardias.length !== 1 ? 's' : ''} activo{props.guardias.length !== 1 ? 's' : ''} en este turno
              </div>
            </div>
          </div>

          <div className="sup-filter-bar">
            {FILTROS.map(f => (
              <button key={f.key}
                className={`filter-chip ${filtro === f.key ? 'active' : ''}`}
                onClick={() => setFiltro(f.key)}>
                {f.label}
                {f.count !== undefined && (
                  <span style={{ marginLeft: 5, background: 'var(--border-2)', color: 'var(--text-2)', borderRadius: 99, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
            <div style={{ marginLeft: 'auto' }}>
              <input className="search-input" placeholder="Buscar zona, guardia..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
          </div>

          <div className="sup-list">
            {tareasFiltradas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◎</div>
                <div className="empty-title">
                  {props.tareas.length === 0 ? 'Sin tareas en el turno' : 'Sin resultados'}
                </div>
                <div className="empty-sub">
                  {props.tareas.length === 0
                    ? 'Asigna la primera tarea del turno usando el formulario lateral.'
                    : 'Prueba cambiando el filtro o la búsqueda.'}
                </div>
              </div>
            ) : (
              tareasFiltradas.map(t => (
                <TaskCard key={t.id} tarea={t}>
                  {t.estado === 'EN_REVISION' && (
                    <>
                      <div className="field">
                        <label className="field-label">Observación del supervisor</label>
                        <input className="form-control-sip"
                          placeholder="Opcional para aprobar, requerida para rechazar..."
                          value={props.obsSupervisor[t.id] || ''}
                          onChange={e => props.setObsSupervisor({ ...props.obsSupervisor, [t.id]: e.target.value })} />
                      </div>
                      <div className="validacion-row">
                        <button className="btn-danger-sip"
                          onClick={() => props.dictaminarTarea(t.id, 'RECHAZADA')}>
                          Rechazar
                        </button>
                        <button className="btn-green-sip"
                          onClick={() => props.dictaminarTarea(t.id, 'APROBADA')}>
                          Aprobar tarea
                        </button>
                      </div>
                    </>
                  )}
                </TaskCard>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}