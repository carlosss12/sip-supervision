import { useEffect } from 'react'
import apiClient from '../api/client'

// Convierte base64url a Uint8Array para las VAPID keys
function base64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
}

async function registrarServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    return reg
  } catch { return null }
}

async function suscribirPush(reg: ServiceWorkerRegistration) {
  try {
    const res = await apiClient.get<{ publicKey: string }>('/push/vapid-public-key')
    const publicKey = base64ToUint8Array(res.data.publicKey)

    const suscripcion = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey.buffer as ArrayBuffer,
    })

    await apiClient.post('/push/suscribir', suscripcion.toJSON())
  } catch { /* silencioso */ }
}

export function useWebPush(autenticado: boolean) {
  useEffect(() => {
    if (!autenticado) return

    const init = async () => {
      if (Notification.permission === 'denied') return

      // Solicitar permiso si no se ha dado
      if (Notification.permission !== 'granted') {
        const permiso = await Notification.requestPermission()
        if (permiso !== 'granted') return
      }

      const reg = await registrarServiceWorker()
      if (!reg) return
      await suscribirPush(reg)
    }

    init()
  }, [autenticado])
}