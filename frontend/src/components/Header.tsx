import { useState, useEffect } from 'react'
import { IconHexagon, IconUser, IconLogout, IconSun, IconMoon } from './Icons'
import { Usuario } from '../types/Usuario'

interface Props {
  usuario: Usuario
  logout: () => void
  onPerfil?: () => void
}

export default function Header({ usuario, logout, onPerfil }: Props) {
  const [tema, setTema] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('tema') as 'dark' | 'light') || 'dark'
  })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem('tema', tema)
  }, [tema])

  const toggleTema = () => setTema(t => t === 'dark' ? 'light' : 'dark')

  return (
    <header className="header">
      <div className="header-brand">
        <IconHexagon size={18} color="var(--primary)" />
        <span className="header-name">S.I. Protection</span>
        <span className="header-env">
          {usuario.rol === 'SUPERVISOR' ? 'SUPERVISION' : 'GUARDIA'}
        </span>
      </div>

      <div className="header-right">
        {/* Indicador en turno */}
        <div className="header-live">
          <div className="header-live-dot" />
          En turno
        </div>

        {/* Toggle modo claro/oscuro */}
        <button
          className="btn-theme"
          onClick={toggleTema}
          title={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {tema === 'dark'
            ? <IconSun  size={15} color="var(--text-2)" />
            : <IconMoon size={15} color="var(--text-2)" />
          }
        </button>

        {/* Usuario */}
        <div style={{ position: 'relative' }}>
          <div
            className="header-user"
            style={{ cursor: 'pointer' }}
            onClick={() => setMenuOpen(o => !o)}
          >
            <div className="header-avatar">
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="header-username">{usuario.nombre}</div>
              <div className="header-rol">{usuario.rol}</div>
            </div>
          </div>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8,
              background: 'var(--surface)', border: '1px solid var(--border-2)',
              borderRadius: 'var(--r-md)', overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,.3)', zIndex: 100, minWidth: 160,
            }}>
              {onPerfil && (
                <button
                  onClick={() => { onPerfil(); setMenuOpen(false) }}
                  style={{
                    width: '100%', padding: '10px 16px', background: 'none',
                    border: 'none', color: 'var(--text-2)', fontSize: 13,
                    textAlign: 'left', display: 'flex', alignItems: 'center',
                    gap: 10, cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <IconUser size={14} color="var(--text-2)" />
                  Mi perfil
                </button>
              )}
              <button
                onClick={() => { logout(); setMenuOpen(false) }}
                style={{
                  width: '100%', padding: '10px 16px', background: 'none',
                  border: 'none', color: 'var(--red)', fontSize: 13,
                  textAlign: 'left', display: 'flex', alignItems: 'center',
                  gap: 10, cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-dim)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <IconLogout size={14} color="var(--red)" />
                Cerrar sesion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}