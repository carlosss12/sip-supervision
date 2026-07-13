import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import apiClient from '../api/client'
import { Guardia, TurnoGuardia } from '../types/Usuario'
import { IconSun, IconCloud, IconMoon, IconX } from './Icons'

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

const TURNO_LABEL: Record<TurnoGuardia, string> = {
  MANANA: 'Manana',
  TARDE:  'Tarde',
  NOCHE:  'Noche',
}

const TURNO_HORARIO: Record<TurnoGuardia, string> = {
  MANANA: '06:00 - 14:00',
  TARDE:  '14:00 - 22:00',
  NOCHE:  '22:00 - 06:00',
}

function formatearRut(valor: string): string {
  const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpio.length === 0) return ''
  const cuerpo = limpio.slice(0, -1)
  const dv     = limpio.slice(-1)
  if (cuerpo.length === 0) return dv
  const cuerpoFormateado = cuerpo
    .split('').reverse().join('')
    .replace(/(\d{3})(?=\d)/g, '$1.')
    .split('').reverse().join('')
  return cuerpoFormateado + '-' + dv
}

function generarEmail(nombre: string): string {
  const partes = nombre.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (partes.length < 2) return ''
  const inicial  = partes[0].charAt(0)
  const apellido = partes[1]
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')
  return inicial + apellido + '@sip.cl'
}

function generarPassword(rut: string): string {
  return rut.replace(/[^0-9]/g, '').slice(0, 5)
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

  useEffect(() => {
    if (esEdicion) return
    setForm(prev => ({
      ...prev,
      email:    generarEmail(prev.nombre),
      password: generarPassword(prev.rut),
    }))
  }, [form.nombre, form.rut, esEdicion])

  const handleNombre = (v: string) => {
    const filtrado = v.replace(/[^a-zA-Z\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1\u00fc\u00dc\s]/g, '')
    setForm(p => ({ ...p, nombre: filtrado }))
    if (filtrado.trim().split(/\s+/).length < 2) {
      setErrores(e => ({ ...e, nombre: 'Ingresa nombre y apellido' }))
    } else {
      setErrores(e => { const s = { ...e }; delete s.nombre; return s })
    }
  }

  const handleRut = (v: string) => {
    const formateado = formatearRut(v)
    setForm(p => ({ ...p, rut: formateado }))
    const digitos = formateado.replace(/[^0-9kK]/g, '')
    if (digitos.length < 7) {
      setErrores(e => ({ ...e, rut: 'RUT incompleto' }))
    } else {
      setErrores(e => { const s = { ...e }; delete s.rut; return s })
    }
  }

  const handleTelefono = (v: string) => {
    const prefijo = '+569'
    const sinPref = v.startsWith(prefijo) ? v.slice(prefijo.length) : v
    const soloNum = sinPref.replace(/\D/g, '').slice(0, 8)
    const resultado = prefijo + soloNum
    setForm(p => ({ ...p, telefono: resultado }))
    if (soloNum.length < 8) {
      setErrores(e => ({ ...e, telefono: 'Faltan ' + (8 - soloNum.length) + ' digitos' }))
    } else {
      setErrores(e => { const s = { ...e }; delete s.telefono; return s })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const nuevosErrores: Record<string, string> = {}
    if (form.nombre.trim().split(/\s+/).length < 2)
      nuevosErrores.nombre = 'Ingresa nombre y apellido'
    if (!esEdicion && form.rut.replace(/[^0-9kK]/g, '').length < 7)
      nuevosErrores.rut = 'RUT incompleto'
    if (form.telefono.length < 12)
      nuevosErrores.telefono = 'Telefono incompleto'
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores); return
    }
    setLoading(true)
    try {
      if (esEdicion) {
        const payload: Record<string, string> = { ...form }
        if (!payload.password) delete payload.password
        await apiClient.put('/guardias/' + guardia!.id, payload)
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
    border: '1px solid ' + (errores[campo] ? '#ef4444' : '#252b35'),
    borderRadius: 10, color: '#e6e8ed', outline: 'none',
    fontSize: 14, fontFamily: 'var(--font)',
    transition: 'border-color .15s',
  })

  const TurnoIcon = ({ t, activo }: { t: TurnoGuardia; activo: boolean }) => {
    const color = activo ? TURNO_COLOR[t] : '#4a5060'
    if (t === 'MANANA') return <IconSun  size={18} color={color} />
    if (t === 'TARDE')  return <IconCloud size={18} color={color} />
    return <IconMoon size={18} color={color} />
  }

  return createPortal(
    <div>
      <div
        onClick={onCerrar}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
        }}
      />

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
        boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
        animation: 'modalIn .2s ease',
      }}>

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
              {esEdicion ? 'Modificar datos &#8212; ' + guardia!.nombre : 'Registrar guardia de seguridad'}
            </div>
          </div>
          <button
            onClick={onCerrar}
            style={{ background: 'transparent', border: 'none', color: '#4a5060', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <IconX size={16} color="#4a5060" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8b92a1', letterSpacing: '.04em' }}>
                Nombre completo <span style={{ color: '#f5a623' }}>*</span>
              </label>
              <input
                required style={inputStyle('nombre')}
                value={form.nombre}
                onChange={e => handleNombre(e.target.value)}
                placeholder="Ej: Juan Perez Gonzalez"
                onFocus={e => { if (!errores.nombre) e.target.style.borderColor = '#f5a623' }}
                onBlur={e  => { if (!errores.nombre) e.target.style.borderColor = '#252b35' }}
              />
              {errores.nombre && (
                <span style={{ fontSize: 11, color: '#ef4444' }}>{errores.nombre}</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#8b92a1', letterSpacing: '.04em' }}>
                  RUT <span style={{ color: '#f5a623' }}>*</span>
                </label>
                <input
                  required style={inputStyle('rut')}
                  value={form.rut}
                  onChange={e => handleRut(e.target.value)}
                  placeholder="12.345.678-9"
                  maxLength={12}
                  onFocus={e => { if (!errores.rut) e.target.style.borderColor = '#f5a623' }}
                  onBlur={e  => { if (!errores.rut) e.target.style.borderColor = '#252b35' }}
                />
                {errores.rut && (
                  <span style={{ fontSize: 11, color: '#ef4444' }}>{errores.rut}</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#8b92a1', letterSpacing: '.04em' }}>
                  Telefono <span style={{ color: '#f5a623' }}>*</span>
                </label>
                <input
                  required style={inputStyle('telefono')}
                  value={form.telefono}
                  onChange={e => handleTelefono(e.target.value)}
                  onFocus={e => { if (!errores.telefono) e.target.style.borderColor = '#f5a623' }}
                  onBlur={e  => { if (!errores.telefono) e.target.style.borderColor = '#252b35' }}
                />
                {errores.telefono && (
                  <span style={{ fontSize: 11, color: '#ef4444' }}>{errores.telefono}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8b92a1', letterSpacing: '.04em' }}>
                Email institucional
                {!esEdicion && (
                  <span style={{ marginLeft: 8, fontSize: 10, color: '#4a5060', fontWeight: 400 }}>
                    (generado automaticamente)
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8b92a1', letterSpacing: '.04em' }}>
                Contrasena
                {!esEdicion && (
                  <span style={{ marginLeft: 8, fontSize: 10, color: '#4a5060', fontWeight: 400 }}>
                    (primeros 5 digitos del RUT)
                  </span>
                )}
                {esEdicion && (
                  <span style={{ marginLeft: 8, fontSize: 10, color: '#4a5060', fontWeight: 400 }}>
                    (dejar vacio para no cambiar)
                  </span>
                )}
              </label>
              <input
                type={esEdicion ? 'password' : 'text'}
                style={{ ...inputStyle('password'), color: esEdicion ? '#e6e8ed' : '#8b92a1', letterSpacing: esEdicion ? 'normal' : '.3em' }}
                value={form.password}
                onChange={e => esEdicion && setForm(p => ({ ...p, password: e.target.value }))}
                placeholder={esEdicion ? '&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;' : ''}
                readOnly={!esEdicion}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8b92a1', letterSpacing: '.04em' }}>
                Turno asignado <span style={{ color: '#f5a623' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(['MANANA', 'TARDE', 'NOCHE'] as TurnoGuardia[]).map(t => {
                  const activo = form.turno === t
                  const color  = TURNO_COLOR[t]
                  return (
                    <button key={t} type="button"
                      onClick={() => setForm(p => ({ ...p, turno: t }))}
                      style={{
                        padding: '12px 8px', borderRadius: 10,
                        border: '1px solid ' + (activo ? color + '55' : '#252b35'),
                        background: activo ? color + '15' : '#131619',
                        color: activo ? color : '#4a5060',
                        fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', transition: 'all .15s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      }}>
                      <TurnoIcon t={t} activo={activo} />
                      <span>{TURNO_LABEL[t]}</span>
                      <span style={{ fontSize: 9, fontWeight: 400, opacity: .7 }}>
                        {TURNO_HORARIO[t]}
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
                {error}
              </div>
            )}
          </div>

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
    </div>,
    document.body
  )
}