import { Router } from 'express';
import { conSucursal } from '../../middlewares/validate.js';
import { permitir, GESTION } from '../../middlewares/roles.js';
import * as pronostico from './pronostico.controller.js';

const router = Router();

router.get('/pronostico', permitir(GESTION), conSucursal, pronostico.obtener);

export default router;
