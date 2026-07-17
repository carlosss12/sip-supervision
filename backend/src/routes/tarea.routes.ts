import { Router } from 'express'
import {
  getTareas,
  crearTarea,
  subirEvidencia,
  validarTarea,
  cerrarTurno,
  iniciarTurno,
  getTurnoActivo,
  getHistorialTurnos,
} from '../controllers/tarea.controller'
import {
  authMiddleware,
  soloSupervisor,
  soloGuardia,
} from '../middlewares/auth.middleware'

const router = Router()

router.get('/tareas',             authMiddleware,                 getTareas)
router.post('/tareas',            authMiddleware, soloSupervisor, crearTarea)
router.post('/evidencias',        authMiddleware, soloGuardia,    subirEvidencia)
router.put('/tareas/:id/validar', authMiddleware, soloSupervisor, validarTarea)
router.get('/turnos/activo',    authMiddleware, getTurnoActivo)
router.post('/turnos/iniciar',   authMiddleware, soloSupervisor, iniciarTurno)
router.post('/turnos/cerrar',     authMiddleware, soloSupervisor, cerrarTurno)
router.get('/turnos/historial',   authMiddleware, soloSupervisor, getHistorialTurnos)

export default router