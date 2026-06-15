import { Router } from 'express';
import { 
  getTareas, 
  crearTarea, 
  subirEvidencia, 
  validarTarea, 
  cerrarTurno 
} from '../controllers/tarea.controller';

const router = Router();

// Definición explícita de rutas para calzar con el Frontend externo
router.get('/tareas', getTareas);
router.post('/tareas', crearTarea);
router.post('/evidencias', subirEvidencia);
router.put('/tareas/:id/validar', validarTarea);
router.post('/turnos/cerrar', cerrarTurno);

export default router;