import { Usuario } from "../types/Usuario";

interface Props {
  guardias: Usuario[];

  nuevaZona: string;
  setNuevaZona: (v: string) => void;

  nuevaDesc: string;
  setNuevaDesc: (v: string) => void;

  nuevaPrioridad: "NORMAL" | "URGENTE";
  setNuevaPrioridad: (v: "NORMAL" | "URGENTE") => void;

  guardiaAsignadoId: string;
  setGuardiaAsignadoId: (v: string) => void;

  crearOrdenTrabajo: (e: React.FormEvent) => void;
}

export default function CreateTaskForm({
  guardias,
  nuevaZona,
  setNuevaZona,
  nuevaDesc,
  setNuevaDesc,
  nuevaPrioridad,
  setNuevaPrioridad,
  guardiaAsignadoId,
  setGuardiaAsignadoId,
  crearOrdenTrabajo
}: Props) {
  return (
    <div className="section">

      <div className="section-title">
        Nueva Tarea
      </div>

      <form onSubmit={crearOrdenTrabajo}>

        <input
          className="form-control-sip"
          placeholder="Zona"
          value={nuevaZona}
          onChange={(e) =>
            setNuevaZona(e.target.value)
          }
        />

        <br />
        <br />

        <textarea
          className="form-control-sip"
          placeholder="Descripción de la tarea"
          value={nuevaDesc}
          onChange={(e) =>
            setNuevaDesc(e.target.value)
          }
          style={{
            minHeight: "100px",
            resize: "vertical"
          }}
        />

        <br />
        <br />

        <select
          className="form-control-sip"
          value={nuevaPrioridad}
          onChange={(e) =>
            setNuevaPrioridad(
              e.target.value as
                "NORMAL" | "URGENTE"
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

        <br />
        <br />

        <select
          className="form-control-sip"
          value={guardiaAsignadoId}
          onChange={(e) =>
            setGuardiaAsignadoId(
              e.target.value
            )
          }
        >
          <option value="">
            Seleccionar guardia
          </option>

          {guardias.map(g => (
            <option
              key={g.id}
              value={g.id}
            >
              {g.nombre}
            </option>
          ))}
        </select>

        <br />
        <br />

        <button
          className="btn-primary-sip"
          type="submit"
        >
          Asignar Tarea
        </button>

      </form>

    </div>
  );
}