export interface Usuario {
  id: number;
  nombre: string;
  rol: 'SUPERVISOR' | 'GUARDIA';
  email: string;
}