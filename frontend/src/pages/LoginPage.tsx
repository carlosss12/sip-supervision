import { useState } from 'react'

import { IconHexagon } from '../components/Icons'

interface Props {
  email: string; password: string
  setEmail: (v: string) => void; setPassword: (v: string) => void
  loginError: string; handleLogin: (e: React.FormEvent) => void
}

export default function LoginPage({ email, password, setEmail, setPassword, loginError, handleLogin }: Props) {

  // Oculta el error cuando el usuario empieza a modificar los campos
  const [errorVisible, setErrorVisible] = useState(true)

  const handleEmailChange = (v: string) => {
    setEmail(v)
    setErrorVisible(false)
  }

  const handlePasswordChange = (v: string) => {
    setPassword(v)
    setErrorVisible(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    setErrorVisible(true)
    handleLogin(e)
  }

  return (
    <div className="login-container">
      <div className="login-panel">
        <div className="login-panel-grid" />
        <div className="login-panel-icon"><IconHexagon size={28} color="var(--primary)" /></div>
        <h1 className="login-panel-title">Centro de<br />Supervisión</h1>
        <p className="login-panel-sub">Sistema unificado de asignación<br />y validación de tareas operativas.</p>
        <div className="login-panel-stats">
          {[
            { label: 'Operación',  value: '24 / 7' },
            { label: 'Cobertura', value: 'R. Biobío' },
            { label: 'Versión',   value: 'v1.0.0' },
          ].map(s => (
            <div className="login-panel-stat" key={s.label}>
              <div className="login-panel-stat-label">{s.label}</div>
              <div className="login-panel-stat-value">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="login-form-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-badge">S.I. PROTECTION</div>
          <h2 className="login-title">Acceso al sistema</h2>
          <p className="login-sub">Ingresa tus credenciales para continuar</p>

          <div className="field">
            <label className="field-label">Correo electrónico</label>
            <input
              type="email" required
              className="form-control-sip"
              placeholder="usuario@sip.cl"
              value={email}
              onChange={e => handleEmailChange(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label">Contraseña</label>
            <input
              type="password" required
              className="form-control-sip"
              placeholder="••••••••••"
              value={password}
              onChange={e => handlePasswordChange(e.target.value)}
            />
          </div>

          {/* Error permanente hasta que se modifique email o password */}
          {loginError && errorVisible && (
            <div className="login-error">
              {loginError}
            </div>
          )}

          <button type="submit" className="btn-primary-sip" style={{ width: '100%', padding: 12 }}>
            Ingresar
          </button>

          <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
            Uso exclusivo para personal autorizado de S.I. Protection.
          </p>
        </form>
      </div>
    </div>
  )
}