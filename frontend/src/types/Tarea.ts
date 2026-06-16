import { Usuario } from './Usuario';

export interface Tarea {
  id: number;
  descripcion: string;
  zona: string;
  prioridad: 'NORMAL' | 'URGENTE';
  estado: 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA';
  evidencia: string | null;
  fotoUrl: string | null;
  observacion: string | null;
  guardia?: Usuario;
}