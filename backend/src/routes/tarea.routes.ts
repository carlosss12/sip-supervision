import { Router } from 'express'
import {
  getTareas,
  crearTarea,
  subirEvidencia,
  validarTarea,
  cerrarTurno,
} from '../controllers/tarea.controller'
import {
  authMiddleware,
  soloSupervisor,
  soloGuardia,
} from '../middlewares/auth.middleware'

const router = Router()

router.get('/tareas',             authMiddleware,                    getTareas)
router.post('/tareas',            authMiddleware, soloSupervisor,    crearTarea)
router.post('/evidencias',        authMiddleware, soloGuardia,       subirEvidencia)
router.put('/tareas/:id/validar', authMiddleware, soloSupervisor,    validarTarea)
router.post('/turnos/cerrar',     authMiddleware, soloSupervisor,    cerrarTurno)

export default router