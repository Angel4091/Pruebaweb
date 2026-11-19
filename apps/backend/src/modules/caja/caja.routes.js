import { Router } from 'express';
import { requireFields, conSucursal } from '../../middlewares/validate.js';
import * as caja from './caja.controller.js';

const router = Router();

router.get('/cajas', conSucursal, caja.listar);
router.get('/cajas/:id/resumen', caja.resumen);
router.post('/cajas/:id/apertura', caja.abrir);
router.post('/cajas/:id/cierre', requireFields(['efectivoContado']), caja.cerrar);
router.get('/turnos', conSucursal, caja.historial);
router.get('/caja/metodos-pago', conSucursal, caja.porMetodo);

export default router;
