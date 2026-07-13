import { Router } from 'express'
import { getIncidencias, crearIncidencia, actualizarIncidencia } from '../controllers/incidencia.controller'
import { authMiddleware, soloSupervisor } from '../middlewares/auth.middleware'

const router = Router()

router.get('/incidencias',        authMiddleware, soloSupervisor, getIncidencias)
router.post('/incidencias',       authMiddleware, soloSupervisor, crearIncidencia)
router.put('/incidencias/:id',    authMiddleware, soloSupervisor, actualizarIncidencia)

export default router