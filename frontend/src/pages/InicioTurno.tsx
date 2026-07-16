import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import { IconHexagon, IconClock, IconUser, IconSun, IconCloud, IconMoon } from '../components/Icons'

interface Props {
  onTurnoIniciado: () => void
  nombreSupervisor: string
}

function turnoActualLabel() {
  const h = new Date().getHours()
  if (h >= 6  && h < 14) return { nombre: 'Manana', horario: '06:00 - 14:00', icon: 'sun',   color: '#f5a623' }
  if (h >= 14 && h < 22) return { nombre: 'Tarde',  horario: '14:00 - 22:00', icon: 'cloud', color: '#3b82f6' }
  return                         { nombre: 'Noche',  horario: '22:00 - 06:00', icon: 'moon',  color: '#a855f7' }
}

export default function InicioTurno({ onTurnoIniciado, nombreSupervisor }: Props) {
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [horaActual, setHoraActual] = useState(new Date())
  const turno = turnoActualLabel()

  // Reloj en tiempo real
  useEffect(() => {
    const iv = setInterval(() => setHoraActual(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  const iniciarTurno = async () => {
    setLoading(true)
    setError('')
    try {
      await apiClient.post('/turnos/iniciar')
      onTurnoIniciado()
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Ya hay turno activo, entrar directamente
        onTurnoIniciado()
      } else {
        setError('Error al iniciar el turno. Intenta nuevamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const TurnoIcon = () => {
    if (turno.icon === 'sun')   return <IconSun   size={32} color={turno.color} />
    if (turno.icon === 'cloud') return <IconCloud size={32} color={turno.color} />
    return <IconMoon size={32} color={turno.color} />
  }

  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', gap: 24,
        padding: 24,
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconHexagon size={24} color="var(--primary)" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>S.I. Protection</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Centro de Mando y Control</div>
          </div>
        </div>

        {/* Tarjeta principal */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden',
        }}>

          {/* Franja de turno */}
          <div style={{
            padding: '20px 28px',
            background: `${turno.color}12`,
            borderBottom: `1px solid ${turno.color}30`,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <TurnoIcon />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: turno.color, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 3 }}>
                Turno {turno.nombre}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--mono)' }}>
                {horaActual.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {horaActual.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Info supervisor y horario */}
          <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-dim)', border: '1px solid var(--primary-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                {nombreSupervisor.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{nombreSupervisor}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>Supervisor de turno</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                <IconUser size={12} color="var(--muted)" />
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>SUPERVISOR</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <IconClock size={14} color="var(--muted)" />
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Horario del turno</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{turno.horario}</div>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: 'var(--red)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              onClick={iniciarTurno}
              disabled={loading}
              className="btn-primary-sip"
              style={{ width: '100%', padding: '14px', fontSize: 14, fontWeight: 700, marginTop: 4 }}
            >
              {loading ? 'Iniciando turno...' : 'Iniciar turno'}
            </button>
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
          Al iniciar el turno se registrara la hora de inicio en el sistema.
        </p>
      </div>
    </div>
  )
}