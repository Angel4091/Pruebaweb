import { Router } from 'express';
import { conSucursal } from '../../middlewares/validate.js';
import { calcularPronostico } from './pronostico.service.js';

const router = Router();

/** GET /api/pronostico?sucursalId=&dias= */
router.get('/pronostico', conSucursal, async (req, res) => {
  res.json(await calcularPronostico(req.query.sucursalId, Math.min(Number(req.query.dias) || 7, 30)));
});

export default router;
