import React, {
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";

import apiClient from "./api/client";
import "./index.css";

import Header from "./components/Header";
import NotificationToast from "./components/NotificationToast";

import LoginPage from "./pages/LoginPage";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import GuardiaDashboard from "./pages/GuardiaDashboard";

import { Usuario } from "./types/Usuario";
import { Tarea } from "./types/Tarea";

export default function App() {

  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [guardias, setGuardias] =
    useState<Usuario[]>([]);

  const [tareas, setTareas] =
    useState<Tarea[]>([]);

  const [loginEmail, setLoginEmail] =
    useState("");

  const [loginPassword, setLoginPassword] =
    useState("");

  const [loginError, setLoginError] =
    useState("");

  const [nuevaZona, setNuevaZona] =
    useState("");

  const [nuevaDesc, setNuevaDesc] =
    useState("");

  const [nuevaPrioridad, setNuevaPrioridad] =
    useState<"NORMAL" | "URGENTE">(
      "NORMAL"
    );

  const [guardiaAsignadoId,
    setGuardiaAsignadoId] =
    useState("");

  const [obsSupervisor,
    setObsSupervisor] =
    useState<any>({});

  const [comentarioGuardia,
    setComentarioGuardia] =
    useState<any>({});

  const [imagenBase64,
    setImagenBase64] =
    useState<any>({});

  const fileInputRef =
    useRef<any>({});

  const [notificacion,
    setNotificacion] =
    useState<any>(null);

  const mostrarNotificacion = (
    mensaje: string,
    tipo:
      | "exito"
      | "error"
      | "alerta" = "exito"
  ) => {
    setNotificacion({
      mensaje,
      tipo
    });

    setTimeout(() => {
      setNotificacion(null);
    }, 4000);
  };

  const cargarDatosSistema =
    useCallback(async () => {
      try {
        const resTareas =
          await apiClient.get(
            "/tareas"
          );

        const resGuardias =
          await apiClient.get(
            "/guardias"
          );

        setTareas(
          resTareas.data
        );

        setGuardias(
          resGuardias.data
        );
      } catch (error) {
        console.error("Fallo en la sincronización automatizada de datos.", error);
      }
    }, []);

  useEffect(() => {
    if (!usuario) return;

    cargarDatosSistema();

    const intervalo =
      setInterval(
        cargarDatosSistema,
        4000
      );

    return () =>
      clearInterval(intervalo);
  }, [
    usuario,
    cargarDatosSistema
  ]);

  const handleLogin =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();
      setLoginError("");
      try {
        const res =
          await apiClient.post(
            "/login",
            {
              email:
                loginEmail,
              contrasena:
                loginPassword
            }
          );

        setUsuario({
          id: res.data.id,
          nombre:
            res.data.nombre,
          email:
            res.data.email,
          rol:
            res.data.role
        });
        mostrarNotificacion("Autenticación correcta. Inicializando terminal.");
      } catch {
        setLoginError(
          "Acceso denegado. Las credenciales no coinciden con los registros."
        );
      }
    };

  // FUNCIONES DE CONTROL OPERATIVO INTEGRADAS:

  const crearOrdenTrabajo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaZona || !nuevaDesc || !guardiaAsignadoId || !usuario) return;
    try {
      await apiClient.post("/tareas", {
        zona: nuevaZona,
        descripcion: nuevaDesc,
        prioridad: nuevaPrioridad,
        guardiaId: Number(guardiaAsignadoId),
        supervisorId: usuario.id
      });
      setNuevaZona("");
      setNuevaDesc("");
      mostrarNotificacion("Orden de inspección perimetral transmitida con éxito.");
      cargarDatosSistema();
    } catch {
      mostrarNotificacion("Error de red al intentar despachar la orden.", "error");
    }
  };

  const dictaminarTarea = async (tareaId: number, estado: "APROBADA" | "RECHAZADA") => {
    try {
      await apiClient.put(`/tareas/${tareaId}/validar`, {
        estado,
        observacion: obsSupervisor[tareaId] || (estado === "APROBADA" ? "Validación conforme efectuada por la central." : "Orden devuelta por inconsistencias técnicas.")
      });
      mostrarNotificacion(estado === "APROBADA" ? "Registro de operaciones archivado." : "Misión de inspección devuelta a terreno.");
      cargarDatosSistema();
    } catch {
      mostrarNotificacion("No se pudo registrar el dictamen en el servidor.", "error");
    }
  };

  const clausurarTurnoOperativo = async () => {
    if (!window.confirm("¿Desea proceder con el cierre de la jornada? Esta acción compilará los datos en un informe inmutable.")) return;
    try {
      await apiClient.post("/turnos/cerrar");
      mostrarNotificacion("Jornada finalizada de forma segura. Reporte consolidado.");
      cargarDatosSistema();
    } catch {
      mostrarNotificacion("Fallo crítico durante la secuencia de cierre del turno.", "error");
    }
  };

  const capturarFotoNativa = (e: React.ChangeEvent<HTMLInputElement>, tareaId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagenBase64((prev: any) => ({ ...prev, [tareaId]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const enviarEvidenciaDesdeWeb = async (tareaId: number) => {
    const comentario = comentarioGuardia[tareaId];
    const foto = imagenBase64[tareaId];
    if (!comentario) return mostrarNotificacion("Debe ingresar la bitácora escrita.", "alerta");
    if (!foto) return mostrarNotificacion("Debe adjuntar el registro fotográfico obligatorio.", "alerta");

    try {
      await apiClient.post("/evidencias", { tareaId, comentario, fotoBase64: foto });
      setComentarioGuardia((p: any) => ({ ...p, [tareaId]: "" }));
      setImagenBase64((p: any) => ({ ...p, [tareaId]: "" }));
      mostrarNotificacion("Información perimetral transmitida a la Central de Operaciones.");
      cargarDatosSistema();
    } catch {
      mostrarNotificacion("Error en el canal de transmisión de datos.", "error");
    }
  };

  if (!usuario) {
    return (
      <LoginPage
        email={loginEmail}
        password={loginPassword}
        setEmail={setLoginEmail}
        setPassword={setLoginPassword}
        loginError={loginError}
        handleLogin={handleLogin}
      />
    );
  }

  return (
    <div className="app-layout">
      <Header
        usuario={usuario}
        logout={() =>
          setUsuario(null)
        }
      />

      {notificacion && (
        <NotificationToast
          mensaje={
            notificacion.mensaje
          }
          tipo={
            notificacion.tipo
          }
        />
      )}

      <div className="main-content">
        {usuario.rol ===
          "SUPERVISOR" && (
          <SupervisorDashboard
            guardias={guardias}
            tareas={tareas}
            nuevaZona={
              nuevaZona
            }
            setNuevaZona={
              setNuevaZona
            }
            nuevaDesc={
              nuevaDesc
            }
            setNuevaDesc={
              setNuevaDesc
            }
            nuevaPrioridad={
              nuevaPrioridad
            }
            setNuevaPrioridad={
              setNuevaPrioridad
            }
            guardiaAsignadoId={
              guardiaAsignadoId
            }
            setGuardiaAsignadoId={
              setGuardiaAsignadoId
            }
            crearOrdenTrabajo={
              crearOrdenTrabajo
            }
            obsSupervisor={
              obsSupervisor
            }
            setObsSupervisor={
              setObsSupervisor
            }
            dictaminarTarea={
              dictaminarTarea
            }
            clausurarTurnoOperativo={
              clausurarTurnoOperativo
            }
          />
        )}

        {usuario.rol ===
          "GUARDIA" && (
          <GuardiaDashboard
            tareas={tareas}
            usuarioId={
              usuario.id
            }
            comentarioGuardia={
              comentarioGuardia
            }
            setComentarioGuardia={
              setComentarioGuardia
            }
            imagenBase64={
              imagenBase64
            }
            setImagenBase64={
              setImagenBase64
            }
            capturarFotoNativa={
              capturarFotoNativa
            }
            enviarEvidenciaDesdeWeb={
              enviarEvidenciaDesdeWeb
            }
            fileInputRef={
              fileInputRef
            }
          />
        )}
      </div>
    </div>
  );
}