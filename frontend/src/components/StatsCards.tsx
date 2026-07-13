import { Tarea } from '../types/Tarea'
import { Usuario } from '../types/Usuario'

interface Props { tareas: Tarea[]; guardias: Usuario[] }

export default function StatsCards({ tareas, guardias }: Props) {
  const stats = [
    { label: 'Total tareas',    value: tareas.length,                                          sub: 'en el turno',        color: 'var(--text)' },
    { label: 'En revisión',     value: tareas.filter(t => t.estado === 'EN_REVISION').length,  sub: 'esperando validación',color: 'var(--blue)' },
    { label: 'Aprobadas',       value: tareas.filter(t => t.estado === 'APROBADA').length,     sub: 'confirmadas',         color: 'var(--green)' },
    { label: 'Guardias activos',value: guardias.length,                                        sub: 'en turno',            color: 'var(--primary)' },
  ]
  return (
    <div className="stats-grid">
      {stats.map(s => (
        <div className="stat-card" key={s.label}>
          <div className="stat-label">{s.label}</div>
          <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          <div className="stat-sub">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}