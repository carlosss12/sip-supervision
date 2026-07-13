import { useState } from 'react'
import { IconHexagon } from '../components/Icons'
import apiClient from '../api/client'
import { Usuario } from '../types/Usuario'

interface Props {
  onLogin: (u: Usuario) => void
}

export default function LoginPage({ onLogin }: Props) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiClient.post<{
        token: string
        id: number
        nombre: string
        email: string
        role: string
      }>('/login', { email, contrasena: password })

      localStorage.setItem('token', res.data.token)
      const u: Usuario = {
        id:     res.data.id,
        nombre: res.data.nombre,
        email:  res.data.email,
        rol:    res.data.role as 'SUPERVISOR' | 'GUARDIA',
      }
      localStorage.setItem('usuario', JSON.stringify(u))
      onLogin(u)
    } catch {
      setError('Credenciales incorrectas. Verifica tu email y contrasena.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 28 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconHexagon size={28} color="var(--primary)" />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>S.I. Protection</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Sistema de Supervision Operativa</div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Acceso al sistema</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0' }}>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '.04em' }}>
                Correo electronico
              </label>
              <input
                type="email"
                required
                className="form-control-sip"
                placeholder="usuario@sip.cl"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '.04em' }}>
                Contrasena
              </label>
              <input
                type="password"
                required
                className="form-control-sip"
                placeholder="••••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--red-dim)',
                border: '1px solid rgba(239,68,68,.2)',
                borderRadius: 8,
                color: 'var(--red)',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-sip"
              style={{ width: '100%', padding: 12, marginTop: 4 }}
            >
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
          Uso exclusivo para personal autorizado de S.I. Protection.
        </p>
      </div>
    </div>
  )
}