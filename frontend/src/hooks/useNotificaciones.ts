import { useEffect, useRef, useCallback } from 'react'
import { Tarea } from '../types/Tarea'

interface UseNotificacionesProps {
  tareas: Tarea[]
  usuarioId: number
  rol: 'SUPERVISOR' | 'GUARDIA'
}

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const permiso = await Notification.requestPermission()
  return permiso === 'granted'
}

function reproducirSonido() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch { /* sin soporte */ }
}

function mostrarNotificacionPush(titulo: string, cuerpo: string) {
  if (Notification.permission !== 'granted') return
  const n = new Notification(titulo, {
    body: cuerpo,
    icon: '/favicon.ico',
    tag: 'sip-notification',
  })
  setTimeout(() => n.close(), 6000)
}

let intervaloBadge: ReturnType<typeof setInterval> | null = null

function mostrarBadgeTitulo(cantidad: number) {
  if (intervaloBadge) { clearInterval(intervaloBadge); intervaloBadge = null }
  if (cantidad === 0) { document.title = 'S.I. Protection'; return }
  let visible = true
  intervaloBadge = setInterval(() => {
    document.title = visible
      ? `(${cantidad}) Nuevo aviso - S.I. Protection`
      : 'S.I. Protection'
    visible = !visible
  }, 1200)
}

export function limpiarBadgeTitulo() {
  if (intervaloBadge) { clearInterval(intervaloBadge); intervaloBadge = null }
  document.title = 'S.I. Protection'
}

export function useNotificaciones({ tareas, usuarioId, rol }: UseNotificacionesProps) {
  const mapaRef         = useRef<Map<number, string>>(new Map())
  const inicializadoRef = useRef(false)

  const notificar = useCallback((titulo: string, cuerpo: string, cantidad: number) => {
    reproducirSonido()
    mostrarNotificacionPush(titulo, cuerpo)
    mostrarBadgeTitulo(cantidad)
  }, [])

  useEffect(() => {
    if (tareas.length === 0) return

    if (!inicializadoRef.current) {
      tareas.forEach(t => mapaRef.current.set(t.id, t.estado))
      inicializadoRef.current = true
      return
    }

    const mapa = mapaRef.current
    let countGuardia = 0, countSupervisor = 0
    let msgGuardia = '', msgSupervisor = ''

    tareas.forEach(t => {
      const prev = mapa.get(t.id)

      if (rol === 'GUARDIA' && t.guardia?.id === usuarioId) {
        if (!prev && t.estado === 'PENDIENTE') {
          countGuardia++
          msgGuardia = `${t.zona}: ${t.descripcion}`
        }
        if (prev === 'EN_REVISION' && t.estado === 'PENDIENTE' && t.observacion) {
          countGuardia++
          msgGuardia = `Tarea devuelta: ${t.zona}`
        }
      }

      if (rol === 'SUPERVISOR') {
        if (prev === 'PENDIENTE' && t.estado === 'EN_REVISION') {
          countSupervisor++
          msgSupervisor = `${t.guardia?.nombre ?? 'Guardia'} subio evidencia en ${t.zona}`
        }
      }

      mapa.set(t.id, t.estado)
    })

    if (rol === 'GUARDIA' && countGuardia > 0)
      notificar(`Nueva tarea asignada (${countGuardia})`, msgGuardia, countGuardia)

    if (rol === 'SUPERVISOR' && countSupervisor > 0)
      notificar(`Evidencia recibida (${countSupervisor})`, msgSupervisor, countSupervisor)

  }, [tareas, usuarioId, rol, notificar])
}