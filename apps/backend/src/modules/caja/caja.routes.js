import { Router } from 'express';
import { requireFields, conSucursal } from '../../middlewares/validate.js';
import { permitir, deSuSucursal, TODOS, CAJA } from '../../middlewares/roles.js';
import { obtenerCaja } from './caja.service.js';
import * as caja from './caja.controller.js';

const router = Router();

const cajaPropia = deSuSucursal(async (req) => (await obtenerCaja(req.params.id)).sucursalId);

// El POS de cualquier rol necesita ver qué cajas están abiertas para cobrar.
router.get('/cajas', permitir(TODOS), conSucursal, caja.listar);
router.get('/cajas/:id/resumen', permitir(CAJA), cajaPropia, caja.resumen);
router.post('/cajas/:id/apertura', permitir(CAJA), cajaPropia, caja.abrir);
router.post('/cajas/:id/cierre', permitir(CAJA), cajaPropia, requireFields(['efectivoContado']), caja.cerrar);
router.get('/turnos', permitir(CAJA), conSucursal, caja.historial);
router.get('/caja/metodos-pago', permitir(CAJA), conSucursal, caja.porMetodo);

export default router;
