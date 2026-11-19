import { Router } from 'express';
import { requireFields } from '../../middlewares/validate.js';
import * as compras from './compras.controller.js';

const router = Router();

router.get('/proveedores', compras.listarProveedores);
router.post('/proveedores', requireFields(['nombre']), compras.crearProveedor);
router.put('/proveedores/:id', compras.actualizarProveedor);

router.get('/compras', compras.listarCompras);
router.get('/compras/resumen', compras.resumen);
router.post('/compras', requireFields(['numeroFactura', 'sucursalId']), compras.crearCompra);

router.get('/cuentas-por-pagar', compras.listarCuentas);
router.patch('/cuentas-por-pagar/:id/pagar', compras.pagarCuenta);

router.get('/ordenes-compra', compras.listarOrdenes);
router.post('/ordenes-compra', requireFields(['sucursalId', 'pedidos']), compras.crearOrdenes);

export default router;
