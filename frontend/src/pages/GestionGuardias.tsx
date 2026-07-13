import { useState, useEffect, useCallback } from 'react'
import apiClient from '../api/client'
import { Guardia, TURNO_LABEL, TurnoGuardia } from '../types/Usuario'
import ModalGuardia from '../components/ModalGuardia'

interface Props { onVolver: () => void }

const TURNO_COLOR: Record<TurnoGuardia, string> = {
  MANANA: 'var(--primary)',
  TARDE:  'var(--blue)',
  NOCHE:  '#a855f7',
}

export default function GestionGuardias({ onVolver }: Props) {
  const [guardias, setGuardias] = useState<Guardia[]>([])
  const [modal,    setModal]    = useState<'crear' | Guardia | null>(null)
  const [loading,  setLoading]  = useState(true)

  const cargar = useCallback(async () => {
    try {
      const res = await apiClient.get<Guardia[]>('/guardias/todos')
      setGuardias(res.data)
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const desactivar = async (id: number) => {
    if (!window.confirm('¿Desactivar este guardia? No podrá iniciar sesión.')) return
    await apiClient.delete(`/guardias/${id}`)
    cargar()
  }

  const turnoActual = (() => {
    const h = new Date().getHours()
    if (h >= 6  && h < 14) return 'MANANA'
    if (h >= 14 && h < 22) return 'TARDE'
    return 'NOCHE'
  })()

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '20px 28px' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={onVolver}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 6 }}>
            ← Volver a bitácora
          </button>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Gestión de guardias</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            Turno activo ahora: <span style={{ color: TURNO_COLOR[turnoActual as TurnoGuardia], fontWeight: 700 }}>
              {TURNO_LABEL[turnoActual as TurnoGuardia]}
            </span>
          </div>
        </div>
        <button className="btn-primary-sip" onClick={() => setModal('crear')}>
          + Nuevo guardia
        </button>
      </div>

      {/* Tabla de guardias */}
      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Cargando...</p>
      ) : guardias.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <div className="empty-title">Sin guardias registrados</div>
          <div className="empty-sub">Crea el primer guardia usando el botón de arriba.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Header tabla */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 100px',
            padding: '8px 16px', fontSize: 10, fontWeight: 700,
            color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase',
          }}>
            <span>Nombre</span>
            <span>Email</span>
            <span>RUT</span>
            <span>Teléfono</span>
            <span>Turno</span>
            <span>Acciones</span>
          </div>

          {guardias.map(g => (
            <div key={g.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 100px',
              padding: '12px 16px', alignItems: 'center',
              background: 'var(--surface)',
              border: `1px solid ${g.activo ? 'var(--border)' : 'var(--red-dim)'}`,
              borderRadius: 'var(--r-md)',
              opacity: g.activo ? 1 : 0.55,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{g.nombre}</div>
                {!g.activo && (
                  <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700 }}>INACTIVO</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{g.email}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{g.rut ?? '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{g.telefono ?? '—'}</div>
              <div>
                {g.turno && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px',
                    borderRadius: 99, fontFamily: 'var(--mono)',
                    color: TURNO_COLOR[g.turno],
                    background: `${TURNO_COLOR[g.turno]}18`,
                    border: `1px solid ${TURNO_COLOR[g.turno]}40`,
                  }}>
                    {g.turno}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setModal(g)}
                  style={{ padding: '5px 10px', background: 'var(--surface-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', color: 'var(--text-2)', fontSize: 11, cursor: 'pointer' }}>
                  Editar
                </button>
                {g.activo && (
                  <button
                    onClick={() => desactivar(g.id)}
                    style={{ padding: '5px 10px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 'var(--r-sm)', color: 'var(--red)', fontSize: 11, cursor: 'pointer' }}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <ModalGuardia
          guardia={modal === 'crear' ? undefined : modal}
          onCerrar={() => setModal(null)}
          onGuardado={() => { setModal(null); cargar() }}
        />
      )}
    </div>
  )
}