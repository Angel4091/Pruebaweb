import { Router } from 'express';
import { requireFields, conSucursal } from '../../middlewares/validate.js';
import * as inv from './inventario.controller.js';

const router = Router();

router.get('/insumos', conSucursal, inv.listarInsumos);
router.post('/insumos', requireFields(['nombre', 'unidad', 'stockMinimo', 'costoUnitario']), inv.crearInsumo);
router.put('/insumos/:id', inv.actualizarInsumo);

router.get('/inventario/resumen', conSucursal, inv.resumen);
router.get('/inventario/alertas', conSucursal, inv.alertas);
router.get('/inventario/movimientos', inv.movimientos);
router.post('/inventario/entradas', requireFields(['sucursalId', 'cantidad']), inv.registrarEntrada);

export default router;
