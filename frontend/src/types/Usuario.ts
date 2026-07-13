export type RolUsuario    = 'SUPERVISOR' | 'GUARDIA'
export type TurnoGuardia = 'MANANA' | 'TARDE' | 'NOCHE'

export const TURNO_LABEL: Record<TurnoGuardia, string> = {
  MANANA: 'Mañana (06:00 – 14:00)',
  TARDE:  'Tarde  (14:00 – 22:00)',
  NOCHE:  'Noche  (22:00 – 06:00)',
}

export interface Usuario {
  id:       number
  nombre:   string
  email:    string
  rol:      RolUsuario
}

export interface Guardia {
  id:       number
  nombre:   string
  email:    string
  rut:      string | null
  telefono: string | null
  turno:    TurnoGuardia | null
  activo:   boolean
}

export interface CrearGuardiaPayload {
  nombre:   string
  email:    string
  password: string
  rut:      string
  telefono: string
  turno:    TurnoGuardia
}