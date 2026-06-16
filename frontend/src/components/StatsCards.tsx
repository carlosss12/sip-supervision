import { Tarea } from '../types/Tarea';
import { Usuario } from '../types/Usuario';

interface Props{
  tareas:Tarea[];
  guardias:Usuario[];
}

export default function StatsCards({
  tareas,
  guardias
}:Props){

  return(
    <div className="stats-grid">

      <div className="stat-card">
        <div className="stat-label">
          Guardias
        </div>
        <div className="stat-value">
          {guardias.length}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">
          Pendientes
        </div>
        <div className="stat-value">
          {
            tareas.filter(
              t => t.estado === 'PENDIENTE'
            ).length
          }
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">
          En revisión
        </div>
        <div className="stat-value">
          {
            tareas.filter(
              t => t.estado === 'EN_REVISION'
            ).length
          }
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">
          Aprobadas
        </div>
        <div className="stat-value">
          {
            tareas.filter(
              t => t.estado === 'APROBADA'
            ).length
          }
        </div>
      </div>

    </div>
  );
}