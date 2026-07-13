import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import apiClient from '../api/client'
import { Guardia, TurnoGuardia } from '../types/Usuario'

interface Props {
  guardia?: Guardia
  onCerrar: () => void
  onGuardado: () => void
}

const TURNO_COLOR: Record<TurnoGuardia, string> = {
  MANANA: '#f5a623',
  TARDE:  '#3b82f6',
  NOCHE:  '#a855f7',
}

// ── Formatea RUT chileno automáticamente ────────────────────────────────────
function formatearRut(valor: string): string {
  // Extrae solo dígitos y la letra K
  const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpio.length === 0) return ''

  const cuerpo = limpio.slice(0, -1)   // todos menos el dígito verificador
  const dv     = limpio.slice(-1)       // último carácter (dígito verificador)

  if (cuerpo.length === 0) return dv

  // Agrega puntos cada 3 dígitos desde la derecha
  const cuerpoFormateado = cuerpo
    .split('').reverse().join('')
    .replace(/(\d{3})(?=\d)/g, '$1.')
    .split('').reverse().join('')

  return `${cuerpoFormateado}-${dv}`
}

// ── Genera email automático desde nombre ────────────────────────────────────
function generarEmail(nombre: string): string {
  const partes = nombre.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (partes.length < 2) return ''
  const inicial   = partes[0].charAt(0)
  const apellido  = partes[1]
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z]/g, '')
  return `${inicial}${apellido}@sip.cl`
}

// ── Extrae primeros 5 dígitos del RUT como contraseña ──────────────────────
function generarPassword(rut: string): string {
  const soloDigitos = rut.replace(/[^0-9]/g, '')
  return soloDigitos.slice(0, 5)
}

export default function ModalGuardia({ guardia, onCerrar, onGuardado }: Props) {
  const esEdicion = !!guardia

  const [form, setForm] = useState({
    nombre:   guardia?.nombre   ?? '',
    email:    guardia?.email    ?? '',
    password: '',
    rut:      guardia?.rut      ?? '',
    telefono: guardia?.telefono ?? '+569',
    turno:    (guardia?.turno   ?? 'MANANA') as TurnoGuardia,
  })

  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // ── Autogenera email y password cuando cambia nombre o RUT ────────────────
  useEffect(() => {
    if (esEdicion) return
    setForm(prev => ({
      ...prev,
      email:    generarEmail(prev.nombre),
      password: generarPassword(prev.rut),
    }))
  }, [form.nombre, form.rut, esEdicion])

  // ── Handlers con validación en tiempo real ────────────────────────────────

  const handleNombre = (v: string) => {
    // Solo letras, espacios y tildes
    const filtrado = v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')
    setForm(p => ({ ...p, nombre: filtrado }))
    if (filtrado.trim().split(/\s+/).length < 2) {
      setErrores(e => ({ ...e, nombre: 'Ingresa nombre y apellido' }))
    } else {
      setErrores(e => { const s = { ...e }; delete s.nombre; return s })
    }
  }

  const handleRut = (v: string) => {
    // Solo permite dígitos y K mientras escribe, formatea al vuelo
    const soloPermitidos = v.replace(/[^0-9kK.\-]/g, '')
    const formateado = formatearRut(soloPermitidos)
    setForm(p => ({ ...p, rut: formateado }))

    // Valida largo mínimo
    const digitos = formateado.replace(/[^0-9kK]/g, '')
    if (digitos.length < 7) {
      setErrores(e => ({ ...e, rut: 'RUT incompleto' }))
    } else {
      setErrores(e => { const s = { ...e }; delete s.rut; return s })
    }
  }

  const handleTelefono = (v: string) => {
    // Siempre mantiene +569 al inicio, solo agrega dígitos
    const prefijo  = '+569'
    const sinPref  = v.startsWith(prefijo) ? v.slice(prefijo.length) : v
    const soloNum  = sinPref.replace(/\D/g, '').slice(0, 8)  // máximo 8 dígitos
    const resultado = prefijo + soloNum
    setForm(p => ({ ...p, telefono: resultado }))

    if (soloNum.length < 8) {
      setErrores(e => ({ ...e, telefono: `Faltan ${8 - soloNum.length} dígitos` }))
    } else {
      setErrores(e => { const s = { ...e }; delete s.telefono; return s })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validación final antes de enviar
    const nuevosErrores: Record<string, string> = {}
    if (form.nombre.trim().split(/\s+/).length < 2)
      nuevosErrores.nombre = 'Ingresa nombre y apellido'
    if (!esEdicion && form.rut.replace(/[^0-9kK]/g, '').length < 7)
      nuevosErrores.rut = 'RUT incompleto'
    if (form.telefono.length < 12)
      nuevosErrores.telefono = 'Teléfono incompleto'

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores); return
    }

    setLoading(true)
    try {
      if (esEdicion) {
        const payload: any = { ...form }
        if (!payload.password) delete payload.password
        await apiClient.put(`/guardias/${guardia!.id}`, payload)
      } else {
        await apiClient.post('/guardias', form)
      }
      onGuardado()
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (campo: string): React.CSSProperties => ({
    width: '100%', padding: '10px 13px',
    background: '#131619',
    border: `1px solid ${errores[campo] ? '#ef4444' : '#252b35'}`,
    borderRadius: 10, color: '#e6e8ed', outline: 'none',
    fontSize: 14, fontFamily: 'var(--font)',
    transition: 'border-color .15s',
  })

  return createPortal(
    <>
      {/* Overlay */}
      <div onClick={onCerrar} style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
      }} />

      {/* Ventana flotante */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 201,
        width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        background: '#0d0f12',
        border: '1px solid #252b35',
        borderRadius: 16,
        boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,166,35,0.08)',
        animation: 'modalIn .2s ease',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #1c2028',
          background: '#131619',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, zIndex: 1,
        }}>
          <div>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '.12em',
              color: '#f5a623', textTransform: 'uppercase',
              fontFamily: 'var(--mono)', marginBottom: 6,
            }}>
              {esEdicion ? 'Editar registro' : 'Nuevo registro'}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#e6e8ed' }}>
              {esEdicion ? `Modificar — ${guardia!.nombre}` : 'Registrar guardia de seguridad'}
            </div>
          </div>
          <button onClick={onCerrar} style={{
            background: 'transparent', border: 'none',
            color: '#4a5060', fontSize: 18, cursor: 'pointer',
            lineHeight: 1, padding: '2px 4px',
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Nombre */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8b92a1', letterSpacing: '.04em' }}>
                Nombre completo <span style={{ color: '#f5a623' }}>*</span>
              </label>
              <input
                required
                style={inputStyle('nombre')}
                value={form.nombre}
                onChange={e => handleNombre(e.target.value)}
                placeholder="Ej: Juan Pérez González"
                onFocus={e => !errores.nombre && (e.target.style.borderColor = '#f5a623')}
                onBlur={e  => !errores.nombre && (e.target.style.borderColor = '#252b35')}
              />
              {errores.nombre && (
                <span style={{ fontSize: 11, color: '#ef4444' }}>⚠ {errores.nombre}</span>
              )}
            </div>

            {/* RUT y Teléfono */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#8b92a1', letterSpacing: '.04em' }}>
                  RUT <span style={{ color: '#f5a623' }}>*</span>
                </label>
                <input
                  required
                  style={inputStyle('rut')}
                  value={form.rut}
                  onChange={e => handleRut(e.target.value)}
                  placeholder="12.345.678-9"
                  maxLength={12}
                  onFocus={e => !errores.rut && (e.target.style.borderColor = '#f5a623')}
                  onBlur={e  => !errores.rut && (e.target.style.borderColor = '#252b35')}
                />
                {errores.rut && (
                  <span style={{ fontSize: 11, color: '#ef4444' }}>⚠ {errores.rut}</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#8b92a1', letterSpacing: '.04em' }}>
                  Teléfono <span style={{ color: '#f5a623' }}>*</span>
                </label>
                <input
                  required
                  style={inputStyle('telefono')}
                  value={form.telefono}
                  onChange={e => handleTelefono(e.target.value)}
                  placeholder="+56912345678"
                  onFocus={e => !errores.telefono && (e.target.style.borderColor = '#f5a623')}
                  onBlur={e  => !errores.telefono && (e.target.style.borderColor = '#252b35')}
                />
                {errores.telefono && (
                  <span style={{ fontSize: 11, color: '#ef4444' }}>⚠ {errores.telefono}</span>
                )}
              </div>
            </div>

            {/* Email — autogenerado */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8b92a1', letterSpacing: '.04em' }}>
                Email institucional
                {!esEdicion && (
                  <span style={{ marginLeft: 8, fontSize: 10, color: '#4a5060', fontWeight: 400 }}>
                    (generado automáticamente)
                  </span>
                )}
              </label>
              <input
                type="email"
                style={{ ...inputStyle('email'), color: esEdicion ? '#e6e8ed' : '#8b92a1' }}
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="inicial.apellido@sip.cl"
                readOnly={!esEdicion}
              />
            </div>

            {/* Contraseña — autogenerada */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8b92a1', letterSpacing: '.04em' }}>
                Contraseña
                {!esEdicion && (
                  <span style={{ marginLeft: 8, fontSize: 10, color: '#4a5060', fontWeight: 400 }}>
                    (primeros 5 dígitos del RUT)
                  </span>
                )}
                {esEdicion && (
                  <span style={{ marginLeft: 8, fontSize: 10, color: '#4a5060', fontWeight: 400 }}>
                    (dejar vacío para no cambiar)
                  </span>
                )}
              </label>
              <input
                type={esEdicion ? 'password' : 'text'}
                style={{ ...inputStyle('password'), color: esEdicion ? '#e6e8ed' : '#8b92a1', letterSpacing: esEdicion ? 'normal' : '.3em' }}
                value={form.password}
                onChange={e => esEdicion && setForm(p => ({ ...p, password: e.target.value }))}
                placeholder={esEdicion ? '••••••••' : ''}
                readOnly={!esEdicion}
              />
            </div>

            {/* Turno */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8b92a1', letterSpacing: '.04em' }}>
                Turno asignado <span style={{ color: '#f5a623' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(['MANANA', 'TARDE', 'NOCHE'] as TurnoGuardia[]).map(t => {
                  const activo = form.turno === t
                  const color  = TURNO_COLOR[t]
                  return (
                    <button key={t} type="button" onClick={() => setForm(p => ({ ...p, turno: t }))}
                      style={{
                        padding: '12px 8px', borderRadius: 10,
                        border: `1px solid ${activo ? color + '55' : '#252b35'}`,
                        background: activo ? color + '15' : '#131619',
                        color: activo ? color : '#4a5060',
                        fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', transition: 'all .15s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      }}>
                      <span style={{ fontSize: 18 }}>
                        {t === 'MANANA' ? '🌅' : t === 'TARDE' ? '🌤' : '🌙'}
                      </span>
                      <span>{t === 'MANANA' ? 'Mañana' : t === 'TARDE' ? 'Tarde' : 'Noche'}</span>
                      <span style={{ fontSize: 9, fontWeight: 400, opacity: .7 }}>
                        {t === 'MANANA' ? '06:00–14:00' : t === 'TARDE' ? '14:00–22:00' : '22:00–06:00'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)',
                borderRadius: 8, color: '#ef4444', fontSize: 13,
              }}>
                ⚠ {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 24px', borderTop: '1px solid #1c2028',
            background: '#131619', display: 'flex', gap: 10,
            position: 'sticky', bottom: 0,
          }}>
            <button type="button" onClick={onCerrar}
              className="btn-secondary-sip" style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="btn-primary-sip" style={{ flex: 2 }}>
              {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear guardia'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>,
    document.body
  )
}