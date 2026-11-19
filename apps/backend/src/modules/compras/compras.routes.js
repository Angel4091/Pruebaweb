import { Router } from 'express';
import { requireFields } from '../../middlewares/validate.js';
import { permitir, deSuSucursal, TODOS, GESTION } from '../../middlewares/roles.js';
import { sucursalDeCuenta } from './compras.service.js';
import * as compras from './compras.controller.js';

const router = Router();

// El abono a una cuenta por pagar solo lo hace la sucursal que hizo la compra.
const cuentaPropia = deSuSucursal((req) => sucursalDeCuenta(req.params.id));

// Inventario muestra los proveedores al registrar una entrada; el resto es de gestión.
router.get('/proveedores', permitir(TODOS), compras.listarProveedores);
router.get('/proveedores/:id', permitir(TODOS), compras.obtenerProveedor);
router.post('/proveedores', permitir(GESTION), requireFields(['nombre']), compras.crearProveedor);
router.put('/proveedores/:id', permitir(GESTION), compras.actualizarProveedor);
router.delete('/proveedores/:id', permitir(GESTION), compras.desactivarProveedor);

router.get('/compras', permitir(GESTION), compras.listarCompras);
router.get('/compras/resumen', permitir(GESTION), compras.resumen);
router.post('/compras', permitir(GESTION), requireFields(['numeroFactura', 'sucursalId']), compras.crearCompra);

router.get('/cuentas-por-pagar', permitir(GESTION), compras.listarCuentas);
router.patch('/cuentas-por-pagar/:id/pagar', permitir(GESTION), cuentaPropia, compras.pagarCuenta);

router.get('/ordenes-compra', permitir(GESTION), compras.listarOrdenes);
router.post('/ordenes-compra', permitir(GESTION), requireFields(['sucursalId', 'pedidos']), compras.crearOrdenes);

export default router;
