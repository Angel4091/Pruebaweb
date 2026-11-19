import { Router } from 'express';
import { permitir, SOLO_ADMIN } from '../../middlewares/roles.js';
import * as bitacora from './bitacora.controller.js';

const router = Router();

// Quién cambió qué y cuándo: solo lo consulta el admin (D-18).
router.get('/bitacora', permitir(SOLO_ADMIN), bitacora.listar);

export default router;
