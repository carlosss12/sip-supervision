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


router.post('/login', login)
router.get('/guardias',        authMiddleware, soloSupervisor, getGuardias)
router.get('/guardias/todos',  authMiddleware, soloSupervisor, getTodosGuardias)
router.post('/guardias',       authMiddleware, soloSupervisor, crearGuardia)
router.put('/guardias/:id',    authMiddleware, soloSupervisor, actualizarGuardia)
router.delete('/guardias/:id', authMiddleware, soloSupervisor, eliminarGuardia)

export default router