import { Router } from 'express';
import { requireFields, conSucursal } from '../../middlewares/validate.js';
import { permitir, TODOS, GESTION } from '../../middlewares/roles.js';
import * as inv from './inventario.controller.js';

const router = Router();

// Cajeros y baristas consultan existencias; solo admin y gerente las modifican.
router.get('/insumos', permitir(TODOS), conSucursal, inv.listarInsumos);
router.post('/insumos', permitir(GESTION), requireFields(['nombre', 'unidad', 'stockMinimo', 'costoUnitario']), inv.crearInsumo);
router.put('/insumos/:id', permitir(GESTION), inv.actualizarInsumo);

router.get('/inventario/resumen', permitir(TODOS), conSucursal, inv.resumen);
router.get('/inventario/alertas', permitir(TODOS), conSucursal, inv.alertas);
router.get('/inventario/movimientos', permitir(TODOS), inv.movimientos);
router.post('/inventario/entradas', permitir(GESTION), requireFields(['sucursalId', 'cantidad']), inv.registrarEntrada);

export default router;
