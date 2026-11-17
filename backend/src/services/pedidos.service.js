import { db } from '../config/db.js';
import { AppError, notFound } from '../utils/AppError.js';
import { round2 } from '../utils/money.js';
import { newId } from '../utils/ids.js';
import { toDateKey } from '../utils/dates.js';
import { calcularTotales } from '../utils/totales.js';
import { calcularRequerimientos, validarExistencias, validarSucursal } from './inventario.service.js';

/**
 * Pedidos (comandas de cocina).
 *
 * - origen "pos": se crea automáticamente al registrar una venta en caja.
 * - origen "en_linea": lo hace un cliente desde el menú; se cobra en caja
 *   (se convierte en venta) antes de entregarse.
 *
 * Flujo de estados: recibido → en_preparacion → listo → entregado
 * (cancelado solo mientras está "recibido" y sin cobrar).
 */
export const ESTADOS = ['recibido', 'en_preparacion', 'listo', 'entregado', 'cancelado'];
const SIGUIENTE = { recibido: 'en_preparacion', en_preparacion: 'listo', listo: 'entregado' };
const ACTIVOS = ['recibido', 'en_preparacion', 'listo'];

function siguienteNumero() {
  db.data.correlativoPedidos = (db.data.correlativoPedidos ?? 0) + 1;
  return `P-${String(db.data.correlativoPedidos).padStart(4, '0')}`;
}

function nuevoPedido(datos) {
  const ahora = new Date().toISOString();
  return { id: newId('ped'), numero: siguienteNumero(), fecha: ahora, historial: [{ estado: 'recibido', fecha: ahora }], estado: 'recibido', ...datos };
}

/** Crea la comanda de cocina de una venta del POS (o enlaza la venta a un pedido en línea). */
export function registrarComanda(venta, pedidoId = null) {
  if (pedidoId) {
    const pedido = db.collection('pedidos').find((p) => p.id === pedidoId);
    if (pedido) pedido.ventaId = venta.id;
    return pedido;
  }
  const pedido = nuevoPedido({
    origen: 'pos',
    sucursalId: venta.sucursalId,
    tipoOrden: venta.tipoOrden,
    clienteId: venta.clienteId,
    usuarioId: null,
    items: venta.items.map(({ productoId, nombre, cantidad, precioUnitario, total }) => ({ productoId, nombre, cantidad, precioUnitario, total })),
    subtotal: venta.subtotal,
    iva: venta.iva,
    total: venta.total,
    notas: '',
    direccion: '',
    metodoPago: venta.metodoPago,
    ventaId: venta.id,
  });
  db.collection('pedidos').push(pedido);
  return pedido;
}

/** Pedido en línea de un cliente: valida productos y existencias, pero el inventario se descuenta al cobrar. */
export function crearPedidoEnLinea(usuario, data) {
  const { sucursalId, tipoOrden = 'para_llevar', items, notas = '', direccion = '', metodoPago = 'efectivo' } = data;
  validarSucursal(sucursalId);
  if (!['para_llevar', 'delivery'].includes(tipoOrden)) throw new AppError('Los pedidos en línea son para llevar o a domicilio', 422);
  if (tipoOrden === 'delivery' && !String(direccion).trim()) throw new AppError('Escribe la dirección de entrega', 422);
  if (!['efectivo', 'tarjeta', 'bitcoin'].includes(metodoPago)) throw new AppError('Método de pago inválido', 422);
  if (!Array.isArray(items) || items.length === 0) throw new AppError('Tu pedido está vacío', 422);

  const productos = db.collection('productos');
  const lineas = items.map((it) => {
    const cantidad = Number(it.cantidad);
    const prod = productos.find((p) => p.id === it.productoId && p.activo);
    if (!prod) throw new AppError('Uno de los productos ya no está disponible', 422);
    if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 50) throw new AppError(`Cantidad inválida para ${prod.nombre}`, 422);
    return { productoId: prod.id, nombre: prod.nombre, cantidad, precioUnitario: prod.precio, total: round2(prod.precio * cantidad) };
  });
  validarExistencias(calcularRequerimientos(lineas), sucursalId);

  const pedido = nuevoPedido({
    origen: 'en_linea',
    sucursalId,
    tipoOrden,
    clienteId: usuario.clienteId,
    usuarioId: usuario.id,
    clienteNombre: usuario.nombre,
    items: lineas,
    ...calcularTotales(lineas),
    notas: String(notas).slice(0, 200),
    direccion: String(direccion).slice(0, 200),
    metodoPago,
    ventaId: null,
  });
  db.collection('pedidos').push(pedido);
  db.save();
  return pedido;
}

/** Pedidos de una sucursal. `activos=true` devuelve solo los que siguen en proceso. */
export function listarPedidos({ sucursalId, activos, origen, porCobrar } = {}) {
  const hoy = toDateKey();
  return db
    .collection('pedidos')
    .filter((p) => !sucursalId || p.sucursalId === sucursalId)
    .filter((p) => !origen || p.origen === origen)
    .filter((p) => (activos === 'true' || activos === true ? ACTIVOS.includes(p.estado) : toDateKey(p.fecha) === hoy))
    .filter((p) => !(porCobrar === 'true' || porCobrar === true) || (p.origen === 'en_linea' && !p.ventaId && p.estado !== 'cancelado'))
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export const listarMisPedidos = (usuario) =>
  db
    .collection('pedidos')
    .filter((p) => p.usuarioId === usuario.id)
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 20);

export function obtenerPedido(id) {
  const pedido = db.collection('pedidos').find((p) => p.id === id);
  if (!pedido) throw notFound('Pedido');
  return pedido;
}

/** Avanza el pedido al siguiente estado o lo cancela, respetando las reglas del flujo. */
export function cambiarEstado(id, estado, usuario) {
  const pedido = obtenerPedido(id);
  if (!ESTADOS.includes(estado)) throw new AppError('Estado inválido', 422);

  if (estado === 'cancelado') {
    const esDueno = usuario.rol === 'cliente' && pedido.usuarioId === usuario.id;
    if (usuario.rol === 'cliente' && !esDueno) throw new AppError('No tienes permiso para cancelar este pedido', 403);
    if (pedido.estado !== 'recibido' || pedido.ventaId) throw new AppError('Solo se puede cancelar un pedido recibido que aún no se ha cobrado', 409);
  } else {
    if (usuario.rol === 'cliente') throw new AppError('No tienes permiso para cambiar el estado del pedido', 403);
    if (SIGUIENTE[pedido.estado] !== estado) {
      throw new AppError(`El pedido está "${pedido.estado.replace('_', ' ')}" y no puede pasar a "${estado.replace('_', ' ')}"`, 409);
    }
    if (estado === 'entregado' && pedido.origen === 'en_linea' && !pedido.ventaId) {
      throw new AppError('Cobra el pedido en caja antes de entregarlo', 409);
    }
  }
  pedido.estado = estado;
  pedido.historial.push({ estado, fecha: new Date().toISOString(), usuario: usuario.nombre });
  db.save();
  return pedido;
}
