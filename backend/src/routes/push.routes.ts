import { Router } from 'express'
import { getVapidPublicKey, suscribir } from '../controllers/push.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()
router.get('/push/vapid-public-key', authMiddleware, getVapidPublicKey)
router.post('/push/suscribir',       authMiddleware, suscribir)
export default router