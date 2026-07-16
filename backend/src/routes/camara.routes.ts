import { Router } from 'express'
import { getCamaras, getSnapshot } from '../controllers/camara.controller'
import { authMiddleware, soloSupervisor } from '../middlewares/auth.middleware'

const router = Router()
router.get('/camaras',              authMiddleware, soloSupervisor, getCamaras)
router.get('/camaras/:id/snapshot', authMiddleware, soloSupervisor, getSnapshot)
export default router