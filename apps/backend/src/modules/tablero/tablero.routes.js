import { Router } from 'express';
import { conSucursal } from '../../middlewares/validate.js';
import { permitir, TODOS } from '../../middlewares/roles.js';
import * as tablero from './tablero.controller.js';

const router = Router();

router.get('/dashboard', permitir(TODOS), conSucursal, tablero.dashboard);
router.get('/notificaciones', permitir(TODOS), conSucursal, tablero.notificaciones);
router.get('/buscar', permitir(TODOS), tablero.buscar);

export default router;
