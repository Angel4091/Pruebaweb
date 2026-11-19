import { Router } from 'express';
import { conSucursal } from '../../middlewares/validate.js';
import * as tablero from './tablero.service.js';

const router = Router();

router.get('/dashboard', conSucursal, async (req, res) => res.json(await tablero.obtenerDashboard(req.query.sucursalId)));
router.get('/notificaciones', conSucursal, async (req, res) => res.json(await tablero.obtenerNotificaciones(req.query.sucursalId)));
router.get('/buscar', async (req, res) => res.json(await tablero.buscar(req.query.q)));

export default router;
