import React, { useState, useEffect, useCallback, useRef } from 'react'
import apiClient from './api/client'
import './index.css'

import Header              from './components/Header'
import NotificationToast   from './components/NotificationToast'
import LoginPage           from './pages/LoginPage'
import SupervisorDashboard from './pages/SupervisorDashboard'
import GuardiaDashboard    from './pages/GuardiaDashboard'
import GestionGuardias     from './pages/GestionGuardias'

import { Usuario }                                      from './types/Usuario'
import { Tarea, EvidenciaPayload, ValidarTareaPayload } from './types/Tarea'

type TipoToast = 'exito' | 'error' | 'alerta'
type Vista      = 'dashboard' | 'guardias'
interface Toast { mensaje: string; tipo: TipoToast }

export default function App() {

  // ── Sesión ────────────────────────────────────────────────────────────────
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const s = localStorage.getItem('usuario')
    return s ? JSON.parse(s) : null
  })
  const [vista, setVista] = useState<Vista>('dashboard')

  // ── Datos del sistema ─────────────────────────────────────────────────────
  const [guardias, setGuardias] = useState<Usuario[]>([])
  const [tareas,   setTareas]   = useState<Tarea[]>([])

  // ── Form nueva tarea ──────────────────────────────────────────────────────
  const [nuevaZona,         setNuevaZona]         = useState('')
  const [nuevaDesc,         setNuevaDesc]         = useState('')
  const [nuevaPrioridad,    setNuevaPrioridad]    = useState<'NORMAL' | 'URGENTE'>('NORMAL')
  const [guardiaAsignadoId, setGuardiaAsignadoId] = useState('')

  // ── Form validación ───────────────────────────────────────────────────────
  const [obsSupervisor, setObsSupervisor] = useState<Record<number, string>>({})

  // ── Form evidencia ────────────────────────────────────────────────────────
  const [comentarioGuardia, setComentarioGuardia] = useState<Record<number, string>>({})
  const [imagenBase64,      setImagenBase64]      = useState<Record<number, string>>({})
  const fileInputRef = useRef<Record<number, HTMLInputElement | null>>({})

  // ── Login ─────────────────────────────────────────────────────────────────
  const [loginEmail,    setLoginEmail]    = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError,    setLoginError]    = useState('')

  // ── Notificaciones ────────────────────────────────────────────────────────
  const [toast, setToast] = useState<Toast | null>(null)
  const mostrar = (mensaje: string, tipo: TipoToast = 'exito') => {
    setToast({ mensaje, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Carga de datos ────────────────────────────────────────────────────────
  const cargarDatosSistema = useCallback(async () => {
    if (!usuario) return
    try {
      const rTareas = await apiClient.get<Tarea[]>('/tareas')
      setTareas(rTareas.data)

      // Solo el supervisor carga guardias del turno activo
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

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    try {
      const res = await apiClient.post<{
        token: string; id: number; nombre: string; email: string; role: string
      }>('/login', { email: loginEmail, contrasena: loginPassword })

      localStorage.setItem('token', res.data.token)
      const u: Usuario = {
        id:     res.data.id,
        nombre: res.data.nombre,
        email:  res.data.email,
        rol:    res.data.role as 'SUPERVISOR' | 'GUARDIA',
      }
      localStorage.setItem('usuario', JSON.stringify(u))
      setUsuario(u)
      mostrar('Sesión iniciada correctamente.')
    } catch {
      setLoginError('Credenciales incorrectas.')
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.clear()
    setUsuario(null)
    setTareas([])
    setGuardias([])
    setVista('dashboard')
  }

  // ── Crear tarea ───────────────────────────────────────────────────────────
  const crearOrdenTrabajo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaZona || !nuevaDesc || !guardiaAsignadoId || !usuario) return
    try {
      await apiClient.post('/tareas', {
        zona: nuevaZona, descripcion: nuevaDesc,
        prioridad: nuevaPrioridad,
        guardiaId: Number(guardiaAsignadoId),
        supervisorId: usuario.id,
      })
      setNuevaZona(''); setNuevaDesc('')
      setGuardiaAsignadoId(''); setNuevaPrioridad('NORMAL')
      mostrar('Tarea asignada correctamente.')
      cargarDatosSistema()
    } catch {
      mostrar('Error al crear la tarea.', 'error')
    }
  }

  // ── Validar tarea ─────────────────────────────────────────────────────────
  const dictaminarTarea = async (tareaId: number, estado: 'APROBADA' | 'RECHAZADA') => {
    if (estado === 'RECHAZADA' && !obsSupervisor[tareaId]?.trim()) {
      mostrar('Ingresa una observación para rechazar.', 'alerta'); return
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

  // ── Cerrar turno ──────────────────────────────────────────────────────────
  const clausurarTurnoOperativo = async () => {
    if (!window.confirm('¿Cerrar el turno y descargar el informe PDF?')) return
    try {
      const res = await apiClient.post('/turnos/cerrar', {}, { responseType: 'blob' })
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url; link.download = `informe_turno_${Date.now()}.pdf`; link.click()
      URL.revokeObjectURL(url)
      mostrar('Turno cerrado. Informe descargado.')
      cargarDatosSistema()
    } catch {
      mostrar('Error al cerrar el turno.', 'error')
    }
  }

  // ── Evidencia ─────────────────────────────────────────────────────────────
  const capturarFotoNativa = (e: React.ChangeEvent<HTMLInputElement>, tareaId: number) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onloadend = () =>
      setImagenBase64(prev => ({ ...prev, [tareaId]: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const enviarEvidenciaDesdeWeb = async (tareaId: number) => {
    const comentario = comentarioGuardia[tareaId]
    const foto       = imagenBase64[tareaId]
    if (!comentario?.trim()) { mostrar('Ingresa el informe escrito.', 'alerta'); return }
    if (!foto)               { mostrar('Adjunta una fotografía.', 'alerta');     return }
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

  // ── Render ────────────────────────────────────────────────────────────────
  if (!usuario) {
    return (
      <LoginPage
        email={loginEmail} password={loginPassword}
        setEmail={setLoginEmail} setPassword={setLoginPassword}
        loginError={loginError} handleLogin={handleLogin}
      />
    )
  }

  return (
    <div className="app-layout">
      <Header usuario={usuario} logout={logout} />
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
          />
        )}

        {usuario.rol === 'SUPERVISOR' && vista === 'guardias' && (
          <GestionGuardias onVolver={() => setVista('dashboard')} />
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