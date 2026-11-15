import { Router } from 'express';
import { requireFields } from '../middlewares/validate.js';
import * as ventas from '../controllers/ventas.controller.js';
import * as inv from '../controllers/inventario.controller.js';
import * as caja from '../controllers/caja.controller.js';
import * as compras from '../controllers/compras.controller.js';
import * as rrhh from '../controllers/rrhh.controller.js';
import * as gen from '../controllers/general.controller.js';

/**
 * Rutas REST de la API. Convención:
 *   GET    /recurso          → listar
 *   GET    /recurso/:id      → obtener
 *   POST   /recurso          → crear (201)
 *   PUT    /recurso/:id      → actualizar
 *   PATCH  /recurso/:id/...  → acción sobre el recurso
 *   DELETE /recurso/:id      → eliminar / dar de baja
 */
const router = Router();
const sucursal = requireFieldsQuery('sucursalId');

/** Exige parámetros de consulta. */
function requireFieldsQuery(...fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => !req.query[f]);
    if (missing.length) return res.status(400).json({ error: `Falta el parámetro de consulta: ${missing.join(', ')}` });
    return next();
  };
}

router.get('/salud', gen.salud);
router.post('/sistema/reiniciar', gen.reiniciar);

// General
router.get('/sucursales', gen.sucursales);
router.get('/dashboard', sucursal, gen.tablero);
router.get('/notificaciones', sucursal, gen.notificaciones);
router.get('/buscar', gen.buscar);
router.get('/clientes', gen.listarClientes);
router.post('/clientes', requireFields(['nombre']), gen.crearCliente);
router.get('/configuracion', gen.obtenerConfiguracion);
router.put('/configuracion', gen.actualizarConfiguracion);
router.get('/configuracion/fuentes', gen.fuentes);

// Ventas (POS)
router.get('/ventas', ventas.listar);
router.get('/ventas/:id', ventas.obtener);
router.post('/ventas', requireFields(['cajaId', 'items']), ventas.crear);
router.patch('/ventas/:id/anular', ventas.anular);

// Productos, recetas e inventario
router.get('/categorias', inv.listarCategorias);
router.get('/productos', inv.listarProductos);
router.get('/productos/:id', inv.obtenerProducto);
router.post('/productos', requireFields(['nombre', 'precio', 'categoriaId']), inv.crearProducto);
router.put('/productos/:id', inv.actualizarProducto);
router.delete('/productos/:id', inv.eliminarProducto);

router.get('/insumos', sucursal, inv.listarInsumos);
router.post('/insumos', requireFields(['nombre', 'unidad', 'stockMinimo', 'costoUnitario']), inv.crearInsumo);
router.put('/insumos/:id', inv.actualizarInsumo);
router.get('/inventario/resumen', sucursal, inv.resumen);
router.get('/inventario/alertas', sucursal, inv.alertas);
router.get('/inventario/movimientos', inv.movimientos);
router.post('/inventario/entradas', requireFields(['sucursalId', 'cantidad']), inv.registrarEntrada);

// Caja y turnos
router.get('/cajas', sucursal, caja.listar);
router.get('/cajas/:id/resumen', caja.resumen);
router.post('/cajas/:id/apertura', caja.abrir);
router.post('/cajas/:id/cierre', requireFields(['efectivoContado']), caja.cerrar);
router.get('/turnos', sucursal, caja.historial);
router.get('/caja/metodos-pago', sucursal, caja.porMetodo);

// Compras y proveedores
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

// Recursos humanos y planilla
router.get('/empleados', rrhh.listarEmpleados);
router.get('/empleados/cargos', rrhh.cargos);
router.post('/empleados', requireFields(['nombre', 'cargo', 'salarioMensual']), rrhh.crearEmpleado);
router.put('/empleados/:id', rrhh.actualizarEmpleado);
router.delete('/empleados/:id', rrhh.eliminarEmpleado);
router.get('/planillas', rrhh.listarPlanillas);
router.get('/planillas/calculo', rrhh.calcularPlanilla);
router.get('/planillas/:id', rrhh.obtenerPlanilla);
router.post('/planillas', rrhh.generarPlanilla);
router.patch('/planillas/:id/pagar', rrhh.pagarPlanilla);

// Pronóstico
router.get('/pronostico', sucursal, gen.pronostico);

export default router;
