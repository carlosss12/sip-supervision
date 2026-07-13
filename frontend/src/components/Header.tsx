import { Usuario } from '../types/Usuario'

interface Props { usuario: Usuario; logout: () => void }

export default function Header({ usuario, logout }: Props) {
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
        <div className="header-user">
          <div className="header-avatar">{usuario.nombre.charAt(0).toUpperCase()}</div>
          <div>
            <div className="header-username">{usuario.nombre}</div>
            <div className="header-rol">{usuario.rol}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={logout}>Salir</button>
      </div>
    </header>
  )
}