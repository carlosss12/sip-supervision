import React from "react";
import TaskCard from "../components/TaskCard";
import { Tarea } from "../types/Tarea";

interface Props {
  tareas: Tarea[];
  usuarioId: number;
  comentarioGuardia: any;
  setComentarioGuardia: any;
  imagenBase64: any;
  setImagenBase64: any;
  capturarFotoNativa: any;
  enviarEvidenciaDesdeWeb: any;
  fileInputRef: any;
}

export default function GuardiaDashboard(props: Props) {
  // Filtrado síncrono de misiones asignadas al operador móvil
  const tareasGuardia = props.tareas.filter(
    t => t.guardia?.id === props.usuarioId
  );

  return (
    <div className="guardia-mobile-container" style={{ maxWidth: "480px", margin: "0 auto" }}>
      {/* Sub-cabecera técnica institucional de la aplicación */}
      <div style={{ paddingBottom: "16px", marginBottom: "20px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 700, letterSpacing: "1px" }}>
          SISTEMA MÓVIL — ÓRDENES DE TRABAJO ASIGNADAS
        </span>
      </div>

      <div className="tasks-grid" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {tareasGuardia.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", fontSize: "13px" }}>
            SIN REGISTROS DE INSPECCIÓN PENDIENTES
          </div>
        ) : (
          tareasGuardia.map(t => (
            /* Inyectamos tu componente modular pasándole explícitamente el rol GUARDIA */
            <TaskCard key={t.id} tarea={t} rolUsuario="GUARDIA">
              
              {/* Solo si la orden requiere captura, abrimos el formulario mediante composición */}
              {t.estado === "PENDIENTE" ? (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                  <label style={{ display: "block", fontSize: "10px", color: "var(--muted)", marginBottom: "6px", fontWeight: 600, letterSpacing: "0.5px" }}>
                    REPORTE TÉCNICO DE CAMPO
                  </label>
                  
                  <textarea
                    className="form-control-sip"
                    placeholder="Describa la condición del perímetro evaluado según protocolo..."
                    value={props.comentarioGuardia[t.id] || ""}
                    onChange={(e) =>
                      props.setComentarioGuardia({
                        ...props.comentarioGuardia,
                        [t.id]: e.target.value
                      })
                    }
                    style={{ height: "80px", resize: "none", marginBottom: "14px", fontFamily: "inherit" }}
                  />

                  {/* Input de archivo oculto nativo */}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    ref={(el) => {
                      if (props.fileInputRef.current) {
                        props.fileInputRef.current[t.id] = el;
                      }
                    }}
                    onChange={(e) => props.capturarFotoNativa(e, t.id)}
                  />

                  {/* Botón activador estético para la cámara del smartphone */}
                  <button
                    type="button"
                    className="form-control-sip"
                    onClick={() => props.fileInputRef.current[t.id]?.click()}
                    style={{
                      marginBottom: "14px",
                      cursor: "pointer",
                      fontWeight: 600,
                      textAlign: "center",
                      backgroundColor: props.imagenBase64[t.id] ? "rgba(34,197,94,0.06)" : "var(--surface-2)",
                      borderColor: props.imagenBase64[t.id] ? "#22c55e" : "var(--border)",
                      color: props.imagenBase64[t.id] ? "#22c55e" : "var(--text)"
                    }}
                  >
                    {props.imagenBase64[t.id] ? "✓ REGISTRO FOTOGRÁFICO CAPTURADO" : "📸 ADJUNTAR REGISTRO FOTOGRÁFICO"}
                  </button>

                  <button
                    className="btn-primary-sip"
                    style={{ width: "100%" }}
                    onClick={() => props.enviarEvidenciaDesdeWeb(t.id)}
                  >
                    Transmitir Reporte
                  </button>
                </div>
              ) : (
                /* Bloque de bloqueo síncrono mientras central evalúa los datos */
                <div style={{ textAlign: "center", padding: "10px", background: "var(--surface-2)", borderRadius: "4px", fontSize: "11px", color: "var(--muted)", fontWeight: 600, border: "1px solid var(--border)", letterSpacing: "0.5px" }}>
                  {t.estado === "EN_REVISION" ? "EVALUACIÓN EN CURSO EN CENTRAL" : "REGISTRO CONFIRMADO Y ARCHIVADO"}
                </div>
              )}

            </TaskCard>
          ))
        )}
      </div>
    </div>
  );
}