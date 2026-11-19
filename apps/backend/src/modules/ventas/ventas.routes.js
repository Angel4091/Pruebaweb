import { Router } from 'express';
import { requireFields } from '../../middlewares/validate.js';
import * as ventas from './ventas.controller.js';

const router = Router();

router.get('/ventas', ventas.listar);
router.get('/ventas/:id', ventas.obtener);
router.post('/ventas', requireFields(['cajaId', 'items']), ventas.crear);
router.patch('/ventas/:id/anular', ventas.anular);

export default router;
