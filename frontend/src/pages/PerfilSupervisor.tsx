import { useState } from 'react'
import { createPortal } from 'react-dom'
import apiClient from '../api/client'
import { Usuario } from '../types/Usuario'

interface Props {
  usuario: Usuario
  onVolver: () => void
  onActualizado: (u: Usuario) => void
}

export default function PerfilSupervisor({ usuario, onVolver, onActualizado }: Props) {
  const [form, setForm]       = useState({ nombre: usuario.nombre, email: usuario.email })
  const [pwForm, setPwForm]   = useState({ actual: '', nueva: '', confirmar: '' })
  const [modalPw, setModalPw] = useState(false)
  const [msgPerfil, setMsgPerfil] = useState('')
  const [msgPw,     setMsgPw]     = useState('')
  const [errPw,     setErrPw]     = useState('')

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.put(`/guardias/${usuario.id}`, { nombre: form.nombre, email: form.email })
      const u = { ...usuario, nombre: form.nombre, email: form.email }
      localStorage.setItem('usuario', JSON.stringify(u))
      onActualizado(u)
      setMsgPerfil('Perfil actualizado correctamente.')
      setTimeout(() => setMsgPerfil(''), 3000)
    } catch { setMsgPerfil('Error al actualizar.') }
  }

  const cambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrPw('')
    if (pwForm.nueva !== pwForm.confirmar) { setErrPw('Las contraseñas no coinciden.'); return }
    if (pwForm.nueva.length < 6) { setErrPw('La contraseña debe tener al menos 6 caracteres.'); return }
    try {
      await apiClient.put(`/guardias/${usuario.id}`, { password: pwForm.nueva })
      setModalPw(false)
      setPwForm({ actual: '', nueva: '', confirmar: '' })
      setMsgPw('Contraseña actualizada correctamente.')
      setTimeout(() => setMsgPw(''), 3000)
    } catch { setErrPw('Error al cambiar la contraseña.') }
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '20px 28px', maxWidth: 560 }}>
      <button onClick={onVolver} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 20 }}>
        Volver a bitácora
      </button>

      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Mi perfil</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 28 }}>Supervisor — S.I. Protection</div>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-dim)', border: '2px solid var(--primary-bd)', color: 'var(--primary)', fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {usuario.nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{usuario.nombre}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{usuario.email}</div>
          <div style={{ fontSize: 10, color: 'var(--primary)', fontFamily: 'var(--mono)', marginTop: 3, fontWeight: 700 }}>SUPERVISOR</div>
        </div>
      </div>

      {/* Form perfil */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>
          Datos personales
        </div>
        <form onSubmit={guardarPerfil} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label className="field-label">Nombre completo</label>
            <input className="form-control-sip" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="field">
            <label className="field-label">Email</label>
            <input className="form-control-sip" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          {msgPerfil && <div style={{ fontSize: 12, color: 'var(--green)' }}> {msgPerfil}</div>}
          <button type="submit" className="btn-primary-sip" style={{ alignSelf: 'flex-start' }}>
            Guardar cambios
          </button>
        </form>
      </div>

      {/* Seguridad */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>
          Seguridad
        </div>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Contraseña</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Cambia tu contraseña de acceso al sistema</div>
          </div>
          <button className="btn-secondary-sip" style={{ fontSize: 12 }} onClick={() => setModalPw(true)}>
            Cambiar contraseña
          </button>
        </div>
        {msgPw && <div style={{ padding: '0 20px 16px', fontSize: 12, color: 'var(--green)' }}> {msgPw}</div>}
      </div>

      {/* Modal cambiar contraseña */}
      {modalPw && createPortal(
        <>
          <div onClick={() => setModalPw(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201, width: '100%', maxWidth: 400, background: '#0d0f12', border: '1px solid #252b35', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1c2028', background: '#131619', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Cambiar contraseña</div>
              <button onClick={() => setModalPw(false)} style={{ background: 'transparent', border: 'none', color: '#4a5060', fontSize: 18, cursor: 'pointer' }}>x</button>
            </div>
            <form onSubmit={cambiarPassword}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label className="field-label">Nueva contraseña</label>
                  <input type="password" required className="form-control-sip" value={pwForm.nueva} onChange={e => setPwForm(p => ({ ...p, nueva: e.target.value }))} placeholder="Mínimo 6 caracteres" />
                </div>
                <div className="field">
                  <label className="field-label">Confirmar contraseña</label>
                  <input type="password" required className="form-control-sip" value={pwForm.confirmar} onChange={e => setPwForm(p => ({ ...p, confirmar: e.target.value }))} placeholder="Repite la contraseña" />
                </div>
                {errPw && <div style={{ fontSize: 12, color: 'var(--red)' }}> {errPw}</div>}
              </div>
              <div style={{ padding: '14px 24px', borderTop: '1px solid #1c2028', background: '#131619', display: 'flex', gap: 10 }}>
                <button type="button" className="btn-secondary-sip" style={{ flex: 1 }} onClick={() => setModalPw(false)}>Cancelar</button>
                <button type="submit" className="btn-primary-sip" style={{ flex: 2 }}>Actualizar contraseña</button>
              </div>
            </form>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}