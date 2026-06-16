import StatsCards from "../components/StatsCards";
import TaskCard from "../components/TaskCard";
import { Usuario } from "../types/Usuario";
import { Tarea } from "../types/Tarea";

interface Props {

  guardias: Usuario[];
  tareas: Tarea[];

  nuevaZona: string;
  setNuevaZona: any;

  nuevaDesc: string;
  setNuevaDesc: any;

  nuevaPrioridad: any;
  setNuevaPrioridad: any;

  guardiaAsignadoId: string;
  setGuardiaAsignadoId: any;

  crearOrdenTrabajo: any;

  obsSupervisor: any;
  setObsSupervisor: any;

  dictaminarTarea: any;
  clausurarTurnoOperativo: any;
}

export default function SupervisorDashboard(props: Props) {

  return (
    <>
      <StatsCards
        tareas={props.tareas}
        guardias={props.guardias}
      />

      <div className="dashboard-grid">

        <div>

          <div className="section">

            <div className="section-title">
              Nueva Tarea
            </div>

            <form onSubmit={props.crearOrdenTrabajo}>

              <input
                className="form-control-sip"
                placeholder="Zona"
                value={props.nuevaZona}
                onChange={(e) =>
                  props.setNuevaZona(e.target.value)
                }
              />

              <br /><br />

              <textarea
                className="form-control-sip"
                placeholder="Descripción"
                value={props.nuevaDesc}
                onChange={(e) =>
                  props.setNuevaDesc(e.target.value)
                }
              />

              <br /><br />

              <select
                className="form-control-sip"
                value={props.nuevaPrioridad}
                onChange={(e) =>
                  props.setNuevaPrioridad(
                    e.target.value
                  )
                }
              >
                <option value="NORMAL">
                  Normal
                </option>

                <option value="URGENTE">
                  Urgente
                </option>
              </select>

              <br /><br />

              <select
                className="form-control-sip"
                value={props.guardiaAsignadoId}
                onChange={(e) =>
                  props.setGuardiaAsignadoId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar Guardia
                </option>

                {
                  props.guardias.map(g => (
                    <option
                      key={g.id}
                      value={g.id}
                    >
                      {g.nombre}
                    </option>
                  ))
                }
              </select>

              <br /><br />

              <button
                className="btn-primary-sip"
              >
                Asignar Tarea
              </button>

            </form>

          </div>

          <button
            className="btn-primary-sip"
            onClick={
              props.clausurarTurnoOperativo
            }
          >
            Generar PDF
          </button>

        </div>

        <div>

          <div className="tasks-grid">

            {
              props.tareas.map(t => (

                <TaskCard
                  key={t.id}
                  tarea={t}
                >

                  {
                    t.estado === "EN_REVISION" && (

                      <>
                        <br />

                        <input
                          className="form-control-sip"
                          placeholder="Observación"
                          value={
                            props.obsSupervisor[t.id] || ""
                          }
                          onChange={(e) =>
                            props.setObsSupervisor({
                              ...props.obsSupervisor,
                              [t.id]: e.target.value
                            })
                          }
                        />

                        <br />

                        <button
                          className="btn-primary-sip"
                          onClick={() =>
                            props.dictaminarTarea(
                              t.id,
                              "APROBADA"
                            )
                          }
                        >
                          Aprobar
                        </button>

                        <br /><br />

                        <button
                          className="btn-primary-sip"
                          onClick={() =>
                            props.dictaminarTarea(
                              t.id,
                              "RECHAZADA"
                            )
                          }
                        >
                          Rechazar
                        </button>

                      </>
                    )
                  }

                </TaskCard>

              ))
            }

          </div>

        </div>

      </div>
    </>
  );
}