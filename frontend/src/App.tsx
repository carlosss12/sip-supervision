import React, { useState, useEffect, useCallback, useRef } from 'react'
import apiClient from './api/client'
import './index.css'

import Header              from './components/Header'
import NotificationToast   from './components/NotificationToast'
import LoginPage           from './pages/LoginPage'
import SupervisorDashboard from './pages/SupervisorDashboard'
import GuardiaDashboard    from './pages/GuardiaDashboard'
import GestionGuardias     from './pages/GestionGuardias'
import HistorialTurnos     from './pages/HistorialTurnos'
import Incidencias         from './pages/Incidencias'
import PerfilSupervisor    from './pages/PerfilSupervisor'

import { Usuario }                                      from './types/Usuario'
import { Tarea, EvidenciaPayload, ValidarTareaPayload } from './types/Tarea'

type TipoToast = 'exito' | 'error' | 'alerta'
type Vista      = 'dashboard' | 'guardias' | 'historial' | 'incidencias' | 'perfil'
interface Toast  { mensaje: string; tipo: TipoToast }

export default function App() {

  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const s = localStorage.getItem('usuario')
    return s ? JSON.parse(s) : null
  })
  const [vista, setVista] = useState<Vista>('dashboard')

  const [guardias, setGuardias] = useState<Usuario[]>([])
  const [tareas,   setTareas]   = useState<Tarea[]>([])

  const [nuevaZona,         setNuevaZona]         = useState('')
  const [nuevaDesc,         setNuevaDesc]         = useState('')
  const [nuevaPrioridad,    setNuevaPrioridad]    = useState<'NORMAL' | 'URGENTE'>('NORMAL')
  const [guardiaAsignadoId, setGuardiaAsignadoId] = useState('')
  const [obsSupervisor,     setObsSupervisor]     = useState<Record<number, string>>({})

  const [comentarioGuardia, setComentarioGuardia] = useState<Record<number, string>>({})
  const [imagenBase64,      setImagenBase64]      = useState<Record<number, string>>({})
  const fileInputRef = useRef<Record<number, HTMLInputElement | null>>({})

  const [toast, setToast] = useState<Toast | null>(null)
  const mostrar = (mensaje: string, tipo: TipoToast = 'exito') => {
    setToast({ mensaje, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  const cargarDatosSistema = useCallback(async () => {
    if (!usuario) return
    try {
      const rTareas = await apiClient.get<Tarea[]>('/tareas')
      setTareas(rTareas.data)
      if (usuario.rol === 'SUPERVISOR') {
        const rGuardias = await apiClient.get<Usuario[]>('/guardias')
        setGuardias(rGuardias.data)
      }
    } catch { /* polling silencioso */ }
  }, [usuario])

  useEffect(() => {
    if (!usuario) return
    cargarDatosSistema()
    const iv = setInterval(cargarDatosSistema, 4000)
    return () => clearInterval(iv)
  }, [usuario, cargarDatosSistema])

  const handleLogin = (u: Usuario) => {
    setUsuario(u)
    mostrar('Sesion iniciada correctamente.')
  }

  const logout = () => {
    localStorage.clear()
    setUsuario(null)
    setTareas([])
    setGuardias([])
    setVista('dashboard')
  }

  const crearOrdenTrabajo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaZona || !nuevaDesc || !guardiaAsignadoId || !usuario) return
    try {
      await apiClient.post('/tareas', {
        zona: nuevaZona, descripcion: nuevaDesc, prioridad: nuevaPrioridad,
        guardiaId: Number(guardiaAsignadoId), supervisorId: usuario.id,
      })
      setNuevaZona('')
      setNuevaDesc('')
      setGuardiaAsignadoId('')
      setNuevaPrioridad('NORMAL')
      mostrar('Tarea asignada correctamente.')
      cargarDatosSistema()
    } catch {
      mostrar('Error al crear la tarea.', 'error')
    }
  }

  const dictaminarTarea = async (tareaId: number, estado: 'APROBADA' | 'RECHAZADA') => {
    if (estado === 'RECHAZADA' && !obsSupervisor[tareaId]?.trim()) {
      mostrar('Ingresa una observacion para rechazar.', 'alerta')
      return
    }
    try {
      const payload: ValidarTareaPayload = { estado, observacion: obsSupervisor[tareaId] }
      await apiClient.put(`/tareas/${tareaId}/validar`, payload)
      mostrar(estado === 'APROBADA' ? 'Tarea aprobada.' : 'Tarea devuelta al guardia.')
      setObsSupervisor(prev => { const s = { ...prev }; delete s[tareaId]; return s })
      cargarDatosSistema()
    } catch {
      mostrar('Error al validar la tarea.', 'error')
    }
  }

  const clausurarTurnoOperativo = async () => {
    if (!window.confirm('Cerrar el turno y descargar el informe PDF?')) return
    try {
      const res = await apiClient.post('/turnos/cerrar', {}, { responseType: 'blob' })
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'informe_turno_' + Date.now() + '.pdf'
      link.click()
      URL.revokeObjectURL(url)
      mostrar('Turno cerrado. Informe descargado.')
      cargarDatosSistema()
    } catch {
      mostrar('Error al cerrar el turno.', 'error')
    }
  }

  const capturarFotoNativa = (e: React.ChangeEvent<HTMLInputElement>, tareaId: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setImagenBase64(prev => ({ ...prev, [tareaId]: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const enviarEvidenciaDesdeWeb = async (tareaId: number) => {
    const comentario = comentarioGuardia[tareaId]
    const foto       = imagenBase64[tareaId]
    if (!comentario?.trim()) { mostrar('Ingresa el informe escrito.', 'alerta'); return }
    if (!foto)               { mostrar('Adjunta una fotografia.', 'alerta');     return }
    try {
      const payload: EvidenciaPayload = { tareaId, comentario, fotoBase64: foto }
      await apiClient.post('/evidencias', payload)
      setComentarioGuardia(prev => { const s = { ...prev }; delete s[tareaId]; return s })
      setImagenBase64(prev =>      { const s = { ...prev }; delete s[tareaId]; return s })
      mostrar('Evidencia enviada al supervisor.')
      cargarDatosSistema()
    } catch {
      mostrar('Error al enviar la evidencia.', 'error')
    }
  }

  if (!usuario) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="app-layout">
      <Header
        usuario={usuario}
        logout={logout}
        onPerfil={usuario.rol === 'SUPERVISOR' ? () => setVista('perfil') : undefined}
      />
      {toast && <NotificationToast mensaje={toast.mensaje} tipo={toast.tipo} />}

      <div className="main-content">

        {usuario.rol === 'SUPERVISOR' && vista === 'dashboard' && (
          <SupervisorDashboard
            guardias={guardias} tareas={tareas}
            nuevaZona={nuevaZona} setNuevaZona={setNuevaZona}
            nuevaDesc={nuevaDesc} setNuevaDesc={setNuevaDesc}
            nuevaPrioridad={nuevaPrioridad} setNuevaPrioridad={setNuevaPrioridad}
            guardiaAsignadoId={guardiaAsignadoId} setGuardiaAsignadoId={setGuardiaAsignadoId}
            crearOrdenTrabajo={crearOrdenTrabajo}
            obsSupervisor={obsSupervisor} setObsSupervisor={setObsSupervisor}
            dictaminarTarea={dictaminarTarea}
            clausurarTurnoOperativo={clausurarTurnoOperativo}
            onGestionGuardias={() => setVista('guardias')}
            onHistorial={() => setVista('historial')}
            onIncidencias={() => setVista('incidencias')}
          />
        )}

        {usuario.rol === 'SUPERVISOR' && vista === 'guardias' && (
          <GestionGuardias onVolver={() => setVista('dashboard')} />
        )}

        {usuario.rol === 'SUPERVISOR' && vista === 'historial' && (
          <HistorialTurnos onVolver={() => setVista('dashboard')} />
        )}

        {usuario.rol === 'SUPERVISOR' && vista === 'incidencias' && (
          <Incidencias
            onVolver={() => setVista('dashboard')}
            supervisorId={usuario.id}
          />
        )}

        {usuario.rol === 'SUPERVISOR' && vista === 'perfil' && (
          <PerfilSupervisor
            usuario={usuario}
            onVolver={() => setVista('dashboard')}
            onActualizado={u => setUsuario(u)}
          />
        )}

        {usuario.rol === 'GUARDIA' && (
          <GuardiaDashboard
            tareas={tareas} usuarioId={usuario.id}
            comentarioGuardia={comentarioGuardia} setComentarioGuardia={setComentarioGuardia}
            imagenBase64={imagenBase64} setImagenBase64={setImagenBase64}
            capturarFotoNativa={capturarFotoNativa}
            enviarEvidenciaDesdeWeb={enviarEvidenciaDesdeWeb}
            fileInputRef={fileInputRef}
          />
        )}
      </div>
    </div>
  )
}