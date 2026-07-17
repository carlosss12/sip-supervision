import { useEffect, useState } from 'react'
import { IconHexagon, IconClock } from '../components/Icons'

interface Props {
  nombreGuardia: string
  onTurnoDisponible: () => void
}

function turnoActualLabel() {
  const h = new Date().getHours()
  if (h >= 6  && h < 14) return { nombre: 'Manana', horario: '06:00 - 14:00' }
  if (h >= 14 && h < 22) return { nombre: 'Tarde',  horario: '14:00 - 22:00' }
  return                         { nombre: 'Noche',  horario: '22:00 - 06:00' }
}

export default function EsperaTurno({ nombreGuardia, onTurnoDisponible }: Props) {
  const [horaActual, setHoraActual] = useState(new Date())
  const turno = turnoActualLabel()

  useEffect(() => {
    const iv = setInterval(() => setHoraActual(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/turnos/activo', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        const data = await res.json()
        if (data.turno) onTurnoDisponible()
      } catch { /* silencioso */ }
    }
    check()
    const iv = setInterval(check, 10000)
    return () => clearInterval(iv)
  }, [onTurnoDisponible])

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconHexagon size={24} color="var(--primary)" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>S.I. Protection</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Terminal de guardia</div>
          </div>
        </div>

        {/* Tarjeta de espera */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden',
        }}>
          {/* Header tarjeta */}
          <div style={{
            padding: '20px 28px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Bienvenido
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              {nombreGuardia}
            </div>
          </div>

          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>

            {/* Reloj */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconClock size={18} color="var(--muted)" />
              <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                {horaActual.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {horaActual.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Mensaje de espera */}
            <div style={{
              padding: '16px 20px',
              background: 'var(--surface-3)',
              border: '1px solid var(--border-2)',
              borderRadius: 'var(--r-md)',
              width: '100%',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Turno {turno.nombre} — {turno.horario}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
                El supervisor aun no ha iniciado el turno. Esta pantalla se actualizara automaticamente cuando el turno este disponible.
              </div>
            </div>

            {/* Indicador de espera */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 11 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--primary)',
                animation: 'pulse 2s infinite',
              }} />
              Verificando disponibilidad del turno...
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .3; }
          }
        `}</style>
      </div>
    </div>
  )
}