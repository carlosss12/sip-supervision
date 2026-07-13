import { useState } from 'react'
import { Usuario } from '../types/Usuario'

interface Props {
  usuario: Usuario
  logout: () => void
  onPerfil?: () => void
}

export default function Header({ usuario, logout, onPerfil }: Props) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <header className="header">
      <div className="header-brand">
        <span className="header-icon">⬡</span>
        <span className="header-name">S.I. Protection</span>
        <span className="header-env">SUPERVISIÓN</span>
      </div>

      <div className="header-right">
        <div className="header-live">
          <span className="header-live-dot" />
          En turno
        </div>

        {/* Avatar con menú desplegable */}
        <div style={{ position: 'relative' }}>
          <div
            className="header-user"
            style={{ cursor: 'pointer' }}
            onClick={() => setMenuAbierto(m => !m)}
          >
            <div className="header-avatar">
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="header-username">{usuario.nombre}</div>
              <div className="header-rol">{usuario.rol}</div>
            </div>
            <span style={{ fontSize: 9, color: 'var(--muted)', marginLeft: 4 }}>▼</span>
          </div>

          {menuAbierto && (
            <>
              {/* Cierra al hacer clic afuera */}
              <div
                onClick={() => setMenuAbierto(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 49 }}
              />
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                zIndex: 50, minWidth: 180,
                background: 'var(--surface)',
                border: '1px solid var(--border-2)',
                borderRadius: 'var(--r-md)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}>
                {onPerfil && (
                  <button
                    onClick={() => { setMenuAbierto(false); onPerfil() }}
                    style={{
                      width: '100%', padding: '11px 16px',
                      background: 'transparent', border: 'none',
                      color: 'var(--text-2)', fontSize: 13,
                      textAlign: 'left', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    👤 Mi perfil
                  </button>
                )}
                <div style={{ height: 1, background: 'var(--border)' }} />
                <button
                  onClick={() => { setMenuAbierto(false); logout() }}
                  style={{
                    width: '100%', padding: '11px 16px',
                    background: 'transparent', border: 'none',
                    color: 'var(--red)', fontSize: 13,
                    textAlign: 'left', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-dim)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  ↩ Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}