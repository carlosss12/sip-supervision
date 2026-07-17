import { useState, useEffect } from 'react'
import { Tarea } from '../types/Tarea'
import { Usuario } from '../types/Usuario'

interface Props {
  tareas: Tarea[]
  guardias: Usuario[]
}

export default function StatsCards({ tareas, guardias }: Props) {
  const [hora, setHora] = useState(new Date())

  useEffect(() => {
    const iv = setInterval(() => setHora(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  const total      = tareas.length
  const revision   = tareas.filter(t => t.estado === 'EN_REVISION').length
  const aprobadas  = tareas.filter(t => t.estado === 'APROBADA').length
  const activos    = guardias.length

  const horaStr = hora.toLocaleTimeString('es-CL', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const fechaStr = hora.toLocaleDateString('es-CL', {
    weekday: 'short', day: '2-digit', month: 'short',
  })

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-label">Total Tareas</div>
        <div className="stat-value" style={{ color: 'var(--text)' }}>{total}</div>
        <div className="stat-sub">en el turno</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">En Revision</div>
        <div className="stat-value" style={{ color: 'var(--blue)' }}>{revision}</div>
        <div className="stat-sub">esperando validacion</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Aprobadas</div>
        <div className="stat-value" style={{ color: 'var(--green)' }}>{aprobadas}</div>
        <div className="stat-sub">confirmadas</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Guardias Activos</div>
        <div className="stat-value" style={{ color: 'var(--primary)' }}>{activos}</div>
        <div className="stat-sub">en turno</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Hora Actual</div>
        <div className="stat-value stat-clock" style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>
          {horaStr}
        </div>
        <div className="stat-sub">{fechaStr}</div>
      </div>
    </div>
  )
}