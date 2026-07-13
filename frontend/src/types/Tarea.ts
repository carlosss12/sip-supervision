export type PrioridadTarea = 'NORMAL' | 'URGENTE'
export type EstadoTarea    = 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA'

export interface TareaUsuario {
  id:     number
  nombre: string
  email:  string
}

export interface Tarea {
  id:            number
  descripcion:   string
  zona:          string
  prioridad:     PrioridadTarea
  estado:        EstadoTarea
  evidencia:     string | null
  fotoUrl:       string | null
  observacion:   string | null
  creadaEn:      string
  actualizadaEn: string
  guardia:       TareaUsuario | null
  supervisor:    Pick<TareaUsuario, 'id' | 'nombre'> | null
}

export interface EvidenciaPayload {
  tareaId:    number
  comentario: string
  fotoBase64: string
}

export interface ValidarTareaPayload {
  estado:       'APROBADA' | 'RECHAZADA'
  observacion?: string
}