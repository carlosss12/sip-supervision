import React from "react";
import { Tarea } from "../types/Tarea";

interface Props {
  tarea: Tarea;
  rolUsuario?: "SUPERVISOR" | "GUARDIA"; // Filtrado de contexto operativo
  children?: React.ReactNode;
}

export default function TaskCard({
  tarea,
  rolUsuario = "GUARDIA",
  children
}: Props) {

  // Mapeo nativo sobre tus clases CSS guardadas en el index.css
  const getEstadoClass = () => {
    switch (tarea.estado) {
      case "PENDIENTE":
        return "badge badge-pending";
      case "EN_REVISION":
        return "badge badge-review";
      case "APROBADA":
        return "badge badge-approved";
      case "RECHAZADA":
        return "badge badge-rejected";
      default:
        return "badge";
    }
  };

  // Traducción formal de enums técnicos para presentación de tesis
  const getEstadoTexto = () => {
    switch (tarea.estado) {
      case "PENDIENTE":
        return "PENDIENTE DE INSPECCIÓN";
      case "EN_REVISION":
        return "EN AUDITORÍA DE CENTRAL";
      case "APROBADA":
        return "CONFORME";
      case "RECHAZADA":
        return "NO CONFORME - REASIGNADA";
      default:
        return tarea.estado;
    }
  };

  return (
    <div className="task-card">

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h3 className="task-title" style={{ margin: 0 }}>
          {tarea.zona.toUpperCase()}
        </h3>

        <span className={getEstadoClass()}>
          {getEstadoTexto()}
        </span>
      </div>

      <div className="task-zone" style={{ margin: "6px 0 12px 0" }}>
        Guardia: <strong>{tarea.guardia?.nombre || "No asignado"}</strong>
      </div>

      <p style={{ fontSize: "13px", lineHeight: "1.5", color: "#e4e4e7", margin: "0 0 14px 0" }}>
        {tarea.descripcion}
      </p>

      {/* SOLUCIÓN AL FEEDBACK: Desplegar comentarios de rechazo del Supervisor en el celular del Guardia */}
      {rolUsuario === "GUARDIA" && tarea.observacion && tarea.estado === "PENDIENTE" && (
        <div style={{ margin: "14px 0", padding: "12px", background: "rgba(239, 68, 68, 0.04)", borderLeft: "3px solid #ef4444", borderRadius: "4px" }}>
          <strong style={{ color: "#ef4444", display: "block", fontSize: "10px", letterSpacing: "0.5px", marginBottom: "4px" }}>
            RECHAZADO POR CENTRAL DE OPERACIONES:
          </strong>
          <span style={{ color: "#f4f4f5", fontSize: "13px", fontStyle: "italic", lineHeight: "1.4" }}>
            {tarea.observacion}
          </span>
        </div>
      )}

      {/* Bloque de inspección multimedia de evidencias en la central */}
      {(tarea.evidencia || tarea.fotoUrl) && (
        <div style={{ marginTop: "14px", padding: "14px", background: "#09090b", border: "1px solid var(--border)", borderRadius: "4px" }}>
          <span style={{ fontSize: "10px", color: "var(--primary)", mountaineer: "700", display: "block", marginBottom: "6px", fontWeight: 700 }}>
            DECLARACIÓN ADJUNTADA DE TERRENO:
          </span>
          
          {tarea.evidencia && (
            <p style={{ margin: "0 0 10px 0", fontSize: "13px", fontStyle: "italic", color: "#d4d4d8" }}>
              "{tarea.evidencia}"
            </p>
          )}

          {tarea.fotoUrl && (
            <img 
              src={tarea.fotoUrl} 
              alt="Registro de Evidencia" 
              style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "4px", display: "block", border: "1px solid #27272a" }} 
            />
          )}
        </div>
      )}

      <div style={{ marginTop: "12px", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>
        Prioridad:{" "}
        <strong style={{ color: tarea.prioridad === "URGENTE" ? "#ef4444" : "var(--muted)" }}>
          {tarea.prioridad}
        </strong>
      </div>

      {/* Inyección dinámica de botonería (Patrón Composición) */}
      <div style={{ marginTop: "14px" }}>
        {children}
      </div>

    </div>
  );
}