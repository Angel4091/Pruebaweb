import { Router } from 'express';
import { requireFields } from '../../middlewares/validate.js';
import { permitir, deSuSucursal, TODOS, CAJA, GESTION } from '../../middlewares/roles.js';
import { obtenerCaja } from '../caja/caja.service.js';
import { sucursalDeVenta } from './ventas.service.js';
import * as ventas from './ventas.controller.js';

const router = Router();

// La caja (al vender) o la venta (al consultarla o anularla) deben ser de la sucursal del usuario.
const cajaPropia = deSuSucursal(async (req) => (await obtenerCaja(req.body.cajaId)).sucursalId);
const ventaPropia = deSuSucursal((req) => sucursalDeVenta(req.params.id));

router.get('/ventas', permitir(CAJA), ventas.listar);
router.get('/ventas/:id', permitir(TODOS), ventaPropia, ventas.obtener);
router.post('/ventas', permitir(TODOS), requireFields(['cajaId', 'items']), cajaPropia, ventas.crear);
router.patch('/ventas/:id/anular', permitir(GESTION), ventaPropia, ventas.anular);

export default router;
