import { Router } from 'express';
import { login, getGuardias } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.get('/guardias', getGuardias);

export default router;