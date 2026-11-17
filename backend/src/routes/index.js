import { Router } from 'express';
import { requireFields } from '../middlewares/validate.js';
import { autenticar, solo } from '../middlewares/auth.js';
import * as auth from '../controllers/auth.controller.js';
import * as ventas from '../controllers/ventas.controller.js';
import * as inv from '../controllers/inventario.controller.js';
import * as caja from '../controllers/caja.controller.js';
import * as compras from '../controllers/compras.controller.js';
import * as rrhh from '../controllers/rrhh.controller.js';
import * as gen from '../controllers/general.controller.js';
import * as pedidos from '../controllers/pedidos.controller.js';

/**
 * Rutas REST de la API. Convención:
 *   GET    /recurso          → listar
 *   GET    /recurso/:id      → obtener
 *   POST   /recurso          → crear (201)
 *   PUT    /recurso/:id      → actualizar
 *   PATCH  /recurso/:id/...  → acción sobre el recurso
 *   DELETE /recurso/:id      → eliminar / dar de baja
 *
 * Permisos por rol (401 sin sesión, 403 sin permiso):
 *   administrador → todo
 *   cajero        → punto de venta, caja y cobro de pedidos en línea
 *   cocinero      → cocina, inventario/recetas y pronóstico
 *   cliente       → menú y sus propios pedidos
 */
const router = Router();

const ADMIN = solo('administrador');
const VENTAS = solo('administrador', 'cajero');
const COCINA = solo('administrador', 'cocinero');
const PERSONAL = solo('administrador', 'cajero', 'cocinero');
const MENU = solo('administrador', 'cajero', 'cocinero', 'cliente');
const PEDIDOS = solo('administrador', 'cajero', 'cocinero');

/** Exige parámetros de consulta. */
function requireFieldsQuery(...fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => !req.query[f]);
    if (missing.length) return res.status(400).json({ error: `Falta el parámetro de consulta: ${missing.join(', ')}` });
    return next();
  };
}
const sucursal = requireFieldsQuery('sucursalId');

// Públicas
router.get('/salud', gen.salud);
router.post('/auth/login', requireFields(['correo', 'password']), auth.login);
router.post('/auth/registro', requireFields(['nombre', 'correo', 'password']), auth.registro);
router.get('/configuracion', gen.obtenerConfiguracion);
router.get('/sucursales', gen.sucursales);

// Sesión
router.get('/auth/yo', autenticar, auth.yo);

// General
router.post('/sistema/reiniciar', ADMIN, gen.reiniciar);
router.get('/dashboard', ADMIN, sucursal, gen.tablero);
router.get('/notificaciones', PERSONAL, sucursal, gen.notificaciones);
router.get('/buscar', PERSONAL, gen.buscar);
router.get('/clientes', VENTAS, gen.listarClientes);
router.post('/clientes', VENTAS, requireFields(['nombre']), gen.crearCliente);
router.put('/configuracion', ADMIN, gen.actualizarConfiguracion);
router.get('/configuracion/fuentes', ADMIN, gen.fuentes);

// Ventas (POS)
router.get('/ventas', VENTAS, ventas.listar);
router.get('/ventas/:id', VENTAS, ventas.obtener);
router.post('/ventas', VENTAS, requireFields(['cajaId', 'items']), ventas.crear);
router.patch('/ventas/:id/anular', VENTAS, ventas.anular);

// Pedidos: cocina, cobro en caja y pedidos en línea de clientes
router.get('/pedidos', PEDIDOS, sucursal, pedidos.listar);
router.get('/pedidos/mios', solo('cliente'), pedidos.mios);
router.post('/pedidos', solo('cliente'), requireFields(['sucursalId', 'items']), pedidos.crear);
router.patch('/pedidos/:id/estado', MENU, requireFields(['estado']), pedidos.cambiarEstado);

// Menú, productos y recetas
router.get('/categorias', MENU, inv.listarCategorias);
router.get('/productos', MENU, inv.listarProductos);
router.get('/productos/:id', MENU, inv.obtenerProducto);
router.post('/productos', ADMIN, requireFields(['nombre', 'precio', 'categoriaId']), inv.crearProducto);
router.put('/productos/:id', ADMIN, inv.actualizarProducto);
router.delete('/productos/:id', ADMIN, inv.eliminarProducto);

// Inventario
router.get('/insumos', COCINA, sucursal, inv.listarInsumos);
router.post('/insumos', ADMIN, requireFields(['nombre', 'unidad', 'stockMinimo', 'costoUnitario']), inv.crearInsumo);
router.put('/insumos/:id', ADMIN, inv.actualizarInsumo);
router.get('/inventario/resumen', COCINA, sucursal, inv.resumen);
router.get('/inventario/alertas', COCINA, sucursal, inv.alertas);
router.get('/inventario/movimientos', COCINA, inv.movimientos);
router.post('/inventario/entradas', COCINA, requireFields(['sucursalId', 'cantidad']), inv.registrarEntrada);

// Caja y turnos
router.get('/cajas', VENTAS, sucursal, caja.listar);
router.get('/cajas/:id/resumen', VENTAS, caja.resumen);
router.post('/cajas/:id/apertura', VENTAS, caja.abrir);
router.post('/cajas/:id/cierre', VENTAS, requireFields(['efectivoContado']), caja.cerrar);
router.get('/turnos', VENTAS, sucursal, caja.historial);
router.get('/caja/metodos-pago', VENTAS, sucursal, caja.porMetodo);

// Compras y proveedores (solo administración; la cocina puede ver proveedores para pedir)
router.get('/proveedores', COCINA, compras.listarProveedores);
router.post('/proveedores', ADMIN, requireFields(['nombre']), compras.crearProveedor);
router.put('/proveedores/:id', ADMIN, compras.actualizarProveedor);
router.get('/compras', ADMIN, compras.listarCompras);
router.get('/compras/resumen', ADMIN, compras.resumen);
router.post('/compras', ADMIN, requireFields(['numeroFactura', 'sucursalId']), compras.crearCompra);
router.get('/cuentas-por-pagar', ADMIN, compras.listarCuentas);
router.patch('/cuentas-por-pagar/:id/pagar', ADMIN, compras.pagarCuenta);
router.get('/ordenes-compra', ADMIN, compras.listarOrdenes);
router.post('/ordenes-compra', COCINA, requireFields(['sucursalId', 'pedidos']), compras.crearOrdenes);

// Recursos humanos y planilla (solo administración)
router.get('/empleados', ADMIN, rrhh.listarEmpleados);
router.get('/empleados/cargos', ADMIN, rrhh.cargos);
router.post('/empleados', ADMIN, requireFields(['nombre', 'cargo', 'salarioMensual']), rrhh.crearEmpleado);
router.put('/empleados/:id', ADMIN, rrhh.actualizarEmpleado);
router.delete('/empleados/:id', ADMIN, rrhh.eliminarEmpleado);
router.get('/planillas', ADMIN, rrhh.listarPlanillas);
router.get('/planillas/calculo', ADMIN, rrhh.calcularPlanilla);
router.get('/planillas/:id', ADMIN, rrhh.obtenerPlanilla);
router.post('/planillas', ADMIN, rrhh.generarPlanilla);
router.patch('/planillas/:id/pagar', ADMIN, rrhh.pagarPlanilla);

// Pronóstico
router.get('/pronostico', COCINA, sucursal, gen.pronostico);

export default router;
