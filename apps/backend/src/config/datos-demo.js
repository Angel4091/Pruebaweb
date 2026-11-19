import bcrypt from 'bcryptjs';
import { buildSeed } from '../../../../database/seeds/seed.mjs';
import { config } from './env.js';
import { insertarFilas } from './database.js';

/**
 * Carga los datos de demostración en PostgreSQL.
 *
 * Los datos salen de database/seeds/seed.mjs, que genera el menú, el inventario
 * y un historial de 14 días de ventas contado desde hoy, para que Inicio y
 * Pronóstico siempre tengan datos recientes. También crea un usuario por rol
 * con la contraseña de SEED_PASSWORD.
 *
 * Debe ejecutarse dentro de una transacción: borra todo y lo vuelve a cargar.
 */

/** Orden en que se vacían las tablas (truncate ... cascade resuelve las dependencias). */
const TABLAS = [
  'bitacora', 'configuracion', 'planilla_detalles', 'planillas', 'movimientos_inventario',
  'pagos_cuentas', 'cuentas_por_pagar', 'compra_detalles', 'compras', 'orden_compra_detalles',
  'ordenes_compra', 'venta_detalles', 'ventas', 'correlativos', 'turnos', 'usuarios', 'empleados',
  'clientes', 'existencias_reventa', 'recetas', 'productos', 'categorias', 'existencias', 'insumos',
  'proveedores', 'cajas', 'sucursales',
];

/** Un usuario por rol, cada uno ligado a un empleado del seed. */
export const USUARIOS_DEMO = [
  { email: 'admin@origenes.test', rol: 'admin', empleadoId: 'emp-001', sucursalId: null },
  { email: 'gerente@origenes.test', rol: 'gerente', empleadoId: 'emp-008', sucursalId: 'suc-sanmiguel' },
  { email: 'cajero@origenes.test', rol: 'cajero', empleadoId: 'emp-004', sucursalId: 'suc-central' },
  { email: 'barista@origenes.test', rol: 'barista', empleadoId: 'emp-007', sucursalId: 'suc-central' },
];

/** Exige una contraseña de al menos 12 caracteres para los usuarios de prueba. */
export function validarSeedPassword(password = config.seedPassword) {
  if (!password || password.length < 12) {
    throw new Error('SEED_PASSWORD no es segura: configúrala en apps/backend/.env con al menos 12 caracteres.');
  }
  return password;
}

const json = (valor) => (valor === null || valor === undefined ? null : JSON.stringify(valor));

export async function cargarDatosDemo(client, { password = config.seedPassword, ahora = new Date() } = {}) {
  const clave = validarSeedPassword(password);
  const d = buildSeed(ahora);

  await client.query(`truncate table ${TABLAS.join(', ')} restart identity cascade`);

  await insertarFilas(client, 'sucursales', ['id', 'codigo', 'nombre', 'direccion', 'telefono'],
    d.sucursales.map((s) => [s.id, s.codigo, s.nombre, s.direccion ?? '', s.telefono ?? '']));

  await insertarFilas(client, 'cajas', ['id', 'sucursal_id', 'nombre'], d.cajas.map((c) => [c.id, c.sucursalId, c.nombre]));

  await insertarFilas(client, 'categorias', ['id', 'nombre'], d.categorias.map((c) => [c.id, c.nombre]));

  await insertarFilas(client, 'proveedores', ['id', 'nombre', 'nit', 'nrc', 'telefono', 'correo', 'contacto', 'dias_credito'],
    d.proveedores.map((p) => [p.id, p.nombre, p.nit ?? '', p.nrc ?? '', p.telefono ?? '', p.correo ?? '', p.contacto ?? '', p.diasCredito ?? 0]));

  await insertarFilas(client, 'insumos', ['id', 'nombre', 'unidad', 'stock_minimo', 'costo_unitario', 'proveedor_id', 'arte'],
    d.insumos.map((i) => [i.id, i.nombre, i.unidad, i.stockMinimo, i.costoUnitario, i.proveedorId ?? null, i.arte ?? 'grano']));

  await insertarFilas(client, 'existencias', ['insumo_id', 'sucursal_id', 'cantidad'],
    d.insumos.flatMap((i) => d.sucursales.map((s) => [i.id, s.id, i.stock?.[s.id] ?? 0])));

  await insertarFilas(client, 'productos',
    ['id', 'nombre', 'precio', 'categoria_id', 'tipo', 'descripcion', 'arte', 'imagen', 'costo', 'stock_minimo', 'activo'],
    d.productos.map((p) => [p.id, p.nombre, p.precio, p.categoriaId, p.tipo, p.descripcion ?? '', p.arte ?? 'pupusa', p.imagen ?? null,
      p.costo ?? 0, p.stockMinimo ?? 0, p.activo !== false]));

  await insertarFilas(client, 'recetas', ['producto_id', 'insumo_id', 'cantidad'],
    d.productos.flatMap((p) => (p.receta ?? []).map((r) => [p.id, r.insumoId, r.cantidad])));

  await insertarFilas(client, 'existencias_reventa', ['producto_id', 'sucursal_id', 'cantidad'],
    d.productos.filter((p) => p.tipo === 'reventa').flatMap((p) => d.sucursales.map((s) => [p.id, s.id, p.stock?.[s.id] ?? 0])));

  await insertarFilas(client, 'clientes', ['id', 'nombre', 'tipo', 'nit', 'nrc', 'giro', 'direccion', 'telefono'],
    d.clientes.map((c) => [c.id, c.nombre, c.tipo, c.nit ?? '', c.nrc ?? '', c.giro ?? '', c.direccion ?? '', c.telefono ?? '']));

  await insertarFilas(client, 'empleados',
    ['id', 'nombre', 'cargo', 'sucursal_id', 'salario_mensual', 'dui', 'afp', 'telefono', 'fecha_ingreso', 'estado'],
    d.empleados.map((e) => [e.id, e.nombre, e.cargo, e.sucursalId, e.salarioMensual, e.dui ?? '', e.afp ?? '', e.telefono ?? '',
      e.fechaIngreso, e.estado ?? 'activo']));

  // Todos los usuarios de prueba comparten la contraseña de SEED_PASSWORD.
  const hash = await bcrypt.hash(clave, 12);
  const empleados = new Map(d.empleados.map((e) => [e.id, e]));
  await insertarFilas(client, 'usuarios', ['nombre', 'email', 'password_hash', 'rol', 'sucursal_id', 'empleado_id'],
    USUARIOS_DEMO.map((u) => [empleados.get(u.empleadoId)?.nombre ?? u.rol, u.email, hash, u.rol, u.sucursalId, u.empleadoId]));

  await insertarFilas(client, 'turnos',
    ['id', 'caja_id', 'sucursal_id', 'fecha', 'turno', 'responsable', 'monto_inicial', 'denominaciones', 'apertura', 'cierre', 'estado',
      'efectivo_contado', 'total_ventas', 'total_efectivo', 'total_tarjeta', 'total_bitcoin', 'ordenes', 'efectivo_esperado', 'diferencia', 'observaciones'],
    d.turnos.map((t) => [t.id, t.cajaId, t.sucursalId, t.fecha, t.turno, t.responsable, t.montoInicial, json(t.denominaciones), t.apertura,
      t.cierre ?? null, t.estado, t.efectivoContado ?? null, t.totales?.ventas ?? null, t.totales?.efectivo ?? null, t.totales?.tarjeta ?? null,
      t.totales?.bitcoin ?? null, t.totales?.ordenes ?? null, t.totales?.efectivoEsperado ?? null, t.totales?.diferencia ?? null, t.observaciones ?? '']));

  await insertarFilas(client, 'correlativos', ['sucursal_id', 'tipo', 'ultimo'],
    d.sucursales.flatMap((s) => ['FCF', 'CCF'].map((tipo) => [s.id, tipo, d.correlativos?.[s.id]?.[tipo] ?? 0])));

  await insertarFilas(client, 'ventas',
    ['id', 'numero', 'tipo_comprobante', 'sucursal_id', 'caja_id', 'turno_id', 'fecha', 'tipo_orden', 'cliente_id', 'metodo_pago', 'referencia_pago',
      'subtotal', 'iva', 'total', 'monto_recibido', 'cambio', 'estado', 'motivo_anulacion'],
    d.ventas.map((v) => [v.id, v.numero, v.tipoComprobante, v.sucursalId, v.cajaId, v.turnoId, v.fecha, v.tipoOrden, v.clienteId, v.metodoPago,
      v.referenciaPago ?? '', v.subtotal, v.iva, v.total, v.montoRecibido, v.cambio ?? 0, v.estado, v.motivoAnulacion ?? null]));

  await insertarFilas(client, 'venta_detalles', ['venta_id', 'producto_id', 'nombre', 'cantidad', 'precio_unitario', 'total'],
    d.ventas.flatMap((v) => v.items.map((it) => [v.id, it.productoId, it.nombre, it.cantidad, it.precioUnitario, it.total])));

  await insertarFilas(client, 'ordenes_compra', ['id', 'proveedor_id', 'proveedor_nombre', 'sucursal_id', 'fecha', 'total', 'estado', 'compra_id'],
    d.ordenesCompra.map((o) => [o.id, o.proveedorId ?? null, o.proveedorNombre ?? '', o.sucursalId, o.fecha, o.total, o.estado, o.compraId ?? null]));

  await insertarFilas(client, 'orden_compra_detalles', ['orden_id', 'insumo_id', 'nombre', 'unidad', 'cantidad', 'costo_estimado'],
    d.ordenesCompra.flatMap((o) => o.items.map((i) => [o.id, i.insumoId, i.nombre, i.unidad, i.cantidad, i.costoEstimado ?? 0])));

  await insertarFilas(client, 'compras',
    ['id', 'numero_factura', 'proveedor_id', 'proveedor_nombre', 'sucursal_id', 'tipo', 'descripcion', 'fecha', 'subtotal', 'iva', 'total', 'condicion', 'orden_compra_id'],
    d.compras.map((c) => [c.id, c.numeroFactura, c.proveedorId ?? null, c.proveedorNombre ?? '', c.sucursalId, c.tipo, c.descripcion ?? '', c.fecha,
      c.subtotal, c.iva, c.total, c.condicion, c.ordenCompraId ?? null]));

  await insertarFilas(client, 'compra_detalles', ['compra_id', 'insumo_id', 'nombre', 'cantidad', 'costo_unitario', 'total'],
    d.compras.flatMap((c) => (c.items ?? []).map((i) => [c.id, i.insumoId, i.nombre, i.cantidad, i.costoUnitario, i.total])));

  if (d.correlativoCompras > 0) {
    await client.query('select setval($1::regclass, $2, true)', ['compras_numero_seq', d.correlativoCompras]);
  }

  await insertarFilas(client, 'cuentas_por_pagar',
    ['id', 'compra_id', 'proveedor_id', 'proveedor_nombre', 'numero_factura', 'monto', 'saldo', 'fecha_vencimiento'],
    d.cuentasPorPagar.map((c) => [c.id, c.compraId, c.proveedorId ?? null, c.proveedorNombre ?? '', c.numeroFactura, c.monto, c.saldo, c.fechaVencimiento]));

  await insertarFilas(client, 'pagos_cuentas', ['cuenta_id', 'fecha', 'monto'],
    d.cuentasPorPagar.flatMap((c) => (c.pagos ?? []).map((p) => [c.id, p.fecha, p.monto])));

  await insertarFilas(client, 'movimientos_inventario', ['fecha', 'tipo', 'insumo_id', 'producto_id', 'sucursal_id', 'cantidad', 'referencia', 'motivo'],
    d.movimientosInventario.map((m) => [m.fecha, m.tipo, m.insumoId ?? null, m.productoId ?? null, m.sucursalId, m.cantidad, m.referencia ?? '', m.motivo ?? '']));

  await insertarFilas(client, 'planillas', ['id', 'periodo_inicio', 'periodo_fin', 'etiqueta', 'fecha_generacion', 'fecha_pago', 'estado'],
    d.planillas.map((p) => [p.id, p.periodo.inicio, p.periodo.fin, p.periodo.etiqueta, p.fechaGeneracion, p.fechaPago ?? null, p.estado]));

  await insertarFilas(client, 'planilla_detalles',
    ['planilla_id', 'empleado_id', 'nombre', 'cargo', 'salario_quincenal', 'isss', 'afp', 'base_gravada', 'renta', 'tramo_renta', 'total_deducciones', 'liquido'],
    d.planillas.flatMap((p) => p.detalles.map((x) => [p.id, x.empleadoId, x.nombre, x.cargo, x.salarioQuincenal, x.isss, x.afp, x.baseGravada,
      x.renta, x.tramoRenta, x.totalDeducciones, x.liquido])));

  await client.query('insert into configuracion (id, datos) values (1, $1)', [json(d.configuracion)]);

  return {
    productos: d.productos.length,
    insumos: d.insumos.length,
    ventas: d.ventas.length,
    usuarios: USUARIOS_DEMO.length,
  };
}
