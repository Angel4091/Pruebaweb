import { db } from '../config/db.js';
import { AppError, notFound } from '../utils/AppError.js';
import { round2 } from '../utils/money.js';
import { calcularTotales } from '../utils/totales.js';
import { newId } from '../utils/ids.js';
import { toDateKey } from '../utils/dates.js';
import { calcularRequerimientos, validarExistencias, aplicarConsumo } from './inventario.service.js';
import { obtenerCaja, turnoAbierto, METODOS_PAGO } from './caja.service.js';
import { registrarComanda } from './pedidos.service.js';

export { calcularTotales };

export const TIPOS_COMPROBANTE = ['FCF', 'CCF'];
export const TIPOS_ORDEN = ['comer_aqui', 'para_llevar', 'delivery'];


/** Siguiente correlativo por sucursal y tipo, p. ej. "CCF-01-000045". */
function siguienteCorrelativo(sucursal, tipo) {
  const correlativos = db.data.correlativos;
  correlativos[sucursal.id] ??= { FCF: 0, CCF: 0 };
  correlativos[sucursal.id][tipo] += 1;
  return `${tipo}-${sucursal.codigo}-${String(correlativos[sucursal.id][tipo]).padStart(6, '0')}`;
}

function normalizarItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new AppError('La orden debe tener al menos un producto', 422);
  const productos = db.collection('productos');
  const agrupados = new Map();
  for (const item of items) {
    const cantidad = Number(item.cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) throw new AppError('Las cantidades deben ser números enteros mayores que cero', 422);
    const prod = productos.find((p) => p.id === item.productoId && p.activo);
    if (!prod) throw new AppError(`El producto ${item.productoId} no existe o está inactivo`, 422);
    const previo = agrupados.get(prod.id);
    agrupados.set(prod.id, { productoId: prod.id, nombre: prod.nombre, precioUnitario: prod.precio, cantidad: (previo?.cantidad ?? 0) + cantidad });
  }
  return [...agrupados.values()].map((it) => ({ ...it, total: round2(it.cantidad * it.precioUnitario) }));
}

/**
 * Registra una venta en el POS:
 * 1. Valida caja abierta, comprobante y cliente (el CCF exige NIT y NRC).
 * 2. Calcula IVA y total, valida el pago.
 * 3. Descuenta del inventario los insumos de cada receta (o el producto de reventa).
 * 4. Asigna el correlativo del comprobante.
 */
export function crearVenta(data) {
  const { cajaId, tipoComprobante = 'FCF', tipoOrden = 'comer_aqui', clienteId = 'cli-cf', metodoPago = 'efectivo', montoRecibido, referenciaPago = '', pedidoId = null } = data;
  const caja = obtenerCaja(cajaId);
  const sucursal = db.collection('sucursales').find((s) => s.id === caja.sucursalId);
  const turno = turnoAbierto(cajaId);
  if (!turno) throw new AppError(`${caja.nombre} está cerrada. Abre la caja antes de cobrar.`, 409);
  if (!TIPOS_COMPROBANTE.includes(tipoComprobante)) throw new AppError('Tipo de comprobante inválido (FCF o CCF)', 422);
  if (!TIPOS_ORDEN.includes(tipoOrden)) throw new AppError('Tipo de orden inválido', 422);
  if (!METODOS_PAGO.includes(metodoPago)) throw new AppError('Método de pago inválido', 422);

  // Cobro de un pedido en línea: debe existir, ser de esta sucursal y no estar cobrado ni cancelado.
  if (pedidoId) {
    const pedido = db.collection('pedidos').find((p) => p.id === pedidoId);
    if (!pedido || pedido.origen !== 'en_linea') throw new AppError('El pedido en línea no existe', 404);
    if (pedido.sucursalId !== caja.sucursalId) throw new AppError('El pedido es de otra sucursal', 409);
    if (pedido.ventaId) throw new AppError(`El pedido ${pedido.numero} ya fue cobrado`, 409);
    if (pedido.estado === 'cancelado') throw new AppError(`El pedido ${pedido.numero} fue cancelado`, 409);
  }

  const cliente = db.collection('clientes').find((c) => c.id === clienteId);
  if (!cliente) throw notFound('Cliente');
  if (tipoComprobante === 'CCF' && (!cliente.nit || !cliente.nrc)) {
    throw new AppError('El Comprobante de Crédito Fiscal requiere un cliente con NIT y NRC', 422);
  }

  const items = normalizarItems(data.items);
  const { subtotal, iva, total } = calcularTotales(items);

  let recibido = total;
  if (metodoPago === 'efectivo') {
    recibido = montoRecibido === undefined || montoRecibido === '' ? total : round2(montoRecibido);
    if (recibido < total) throw new AppError(`El monto recibido ($${recibido.toFixed(2)}) es menor que el total ($${total.toFixed(2)})`, 422);
  }

  const requerimientos = calcularRequerimientos(items);
  validarExistencias(requerimientos, sucursal.id);

  const venta = {
    id: newId('ven'),
    numero: siguienteCorrelativo(sucursal, tipoComprobante),
    tipoComprobante,
    sucursalId: sucursal.id,
    cajaId,
    turnoId: turno.id,
    fecha: new Date().toISOString(),
    tipoOrden,
    clienteId,
    metodoPago,
    referenciaPago,
    items,
    subtotal,
    iva,
    total,
    montoRecibido: recibido,
    cambio: round2(recibido - total),
    estado: 'emitida',
  };
  aplicarConsumo(requerimientos, sucursal.id, venta.numero, -1);
  db.collection('ventas').push(venta);
  // Cada venta genera su comanda para cocina (o se enlaza al pedido en línea que se cobró).
  const pedido = registrarComanda(venta, pedidoId);
  venta.pedidoId = pedido?.id ?? null;
  db.save();
  return detalleVenta(venta);
}

/** Venta con datos de cliente, sucursal y caja para imprimir el comprobante. */
export function detalleVenta(venta) {
  return {
    ...venta,
    cliente: db.collection('clientes').find((c) => c.id === venta.clienteId),
    sucursal: db.collection('sucursales').find((s) => s.id === venta.sucursalId),
    caja: db.collection('cajas').find((c) => c.id === venta.cajaId),
  };
}

export function obtenerVenta(id) {
  const venta = db.collection('ventas').find((v) => v.id === id);
  if (!venta) throw notFound('Venta');
  return detalleVenta(venta);
}

export function listarVentas({ sucursalId, fecha, tipoComprobante, limite = 100 } = {}) {
  return db
    .collection('ventas')
    .filter((v) => !sucursalId || v.sucursalId === sucursalId)
    .filter((v) => !fecha || toDateKey(v.fecha) === fecha)
    .filter((v) => !tipoComprobante || v.tipoComprobante === tipoComprobante)
    .slice(-Number(limite))
    .reverse();
}

/** Anula una venta del turno abierto y devuelve los insumos al inventario. */
export function anularVenta(id, motivo = '') {
  const venta = db.collection('ventas').find((v) => v.id === id);
  if (!venta) throw notFound('Venta');
  if (venta.estado === 'anulada') throw new AppError('La venta ya está anulada', 409);
  const turno = db.collection('turnos').find((t) => t.id === venta.turnoId);
  if (turno?.estado !== 'abierta') throw new AppError('Solo se pueden anular ventas de un turno abierto', 409);
  aplicarConsumo(calcularRequerimientos(venta.items), venta.sucursalId, `Anulación ${venta.numero}`, 1);
  venta.estado = 'anulada';
  venta.motivoAnulacion = motivo;
  // La comanda del POS se cancela; un pedido en línea vuelve a quedar pendiente de cobro.
  const pedido = db.collection('pedidos').find((p) => p.ventaId === venta.id);
  if (pedido?.origen === 'pos') {
    pedido.estado = 'cancelado';
    pedido.historial.push({ estado: 'cancelado', fecha: new Date().toISOString(), usuario: 'Anulación de venta' });
  } else if (pedido) {
    pedido.ventaId = null;
  }
  db.save();
  return detalleVenta(venta);
}
