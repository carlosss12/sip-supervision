import { Router } from 'express'
import {
  login,
  getGuardias,
  getTodosGuardias,
  crearGuardia,
  actualizarGuardia,
  eliminarGuardia,
} from '../controllers/auth.controller'
import { authMiddleware, soloSupervisor } from '../middlewares/auth.middleware'

const router = Router()

// Pública
router.post('/login', login)

// Guardias del turno activo (para el selector de tareas)
router.get('/guardias',        authMiddleware, soloSupervisor, getGuardias)

// CRUD completo de guardias (gestión)
router.get('/guardias/todos',  authMiddleware, soloSupervisor, getTodosGuardias)
router.post('/guardias',       authMiddleware, soloSupervisor, crearGuardia)
router.put('/guardias/:id',    authMiddleware, soloSupervisor, actualizarGuardia)
router.delete('/guardias/:id', authMiddleware, soloSupervisor, eliminarGuardia)

export default router