import { pool, withTransaction } from '../../config/database.js';
import { AppError, notFound } from '../../utils/AppError.js';
import { round2, desglosarIva } from '../../utils/money.js';
import { newId } from '../../utils/ids.js';
import { leerPaginacion, leerRangoFechas, paginado } from '../../utils/filtros.js';
import { calcularRequerimientos, validarExistencias, aplicarConsumo } from '../inventario/inventario.service.js';
import { obtenerCaja, METODOS_PAGO } from '../caja/caja.service.js';
import { obtenerCliente } from '../general/general.service.js';
import * as repo from './ventas.repository.js';
import * as cajaRepo from '../caja/caja.repository.js';
import * as generalRepo from '../general/general.repository.js';
import * as productosRepo from '../productos/productos.repository.js';

export const TIPOS_COMPROBANTE = ['FCF', 'CCF'];
export const TIPOS_ORDEN = ['comer_aqui', 'para_llevar', 'delivery'];

/**
 * Totales de la venta. Los precios del menú ya incluyen el IVA (D-14): el cliente paga
 * la suma de las líneas, y de ahí se separan el valor sin IVA (subtotal) y el 13 %.
 * La factura de consumidor final muestra el total con el IVA incluido; el crédito fiscal,
 * el subtotal, el IVA y el total. En ambos casos el total es el mismo.
 */
export function calcularTotales(items) {
  return desglosarIva(items.map((it) => round2(it.cantidad * it.precioUnitario)));
}

/** Número de comprobante con el formato "CCF-01-000045". */
export const formatoNumero = (tipo, codigoSucursal, correlativo) => `${tipo}-${codigoSucursal}-${String(correlativo).padStart(6, '0')}`;

/** Productos de la venta indexados por id (con su receta). */
async function cargarProductos(ids, db) {
  const productos = await productosRepo.obtenerProductos([...new Set(ids)], db);
  return new Map(productos.map((p) => [p.id, p]));
}

/** Valida cantidades y productos, y agrupa líneas repetidas del mismo producto. */
function normalizarItems(items, productos) {
  if (!Array.isArray(items) || items.length === 0) throw new AppError('La orden debe tener al menos un producto', 422);
  const agrupados = new Map();
  for (const item of items) {
    const cantidad = Number(item.cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) throw new AppError('Las cantidades deben ser números enteros mayores que cero', 422);
    const prod = productos.get(item.productoId);
    if (!prod || !prod.activo) throw new AppError(`El producto ${item.productoId} no existe o está inactivo`, 422);
    const previo = agrupados.get(prod.id);
    agrupados.set(prod.id, { productoId: prod.id, nombre: prod.nombre, precioUnitario: prod.precio, cantidad: (previo?.cantidad ?? 0) + cantidad });
  }
  return [...agrupados.values()].map((it) => ({ ...it, total: round2(it.cantidad * it.precioUnitario) }));
}

/**
 * Venta con datos de cliente, sucursal y caja para imprimir el comprobante.
 * Las consultas van una tras otra: dentro de una transacción todas usan la misma
 * conexión, y una conexión solo atiende una consulta a la vez.
 */
async function detalleVenta(venta, db = pool) {
  const cliente = await generalRepo.obtenerCliente(venta.clienteId, db);
  const sucursal = await generalRepo.obtenerSucursal(venta.sucursalId, db);
  const caja = await cajaRepo.obtenerCaja(venta.cajaId, db);
  return { ...venta, cliente, sucursal, caja };
}

/**
 * Registra una venta del POS en una sola transacción:
 * 1. Valida caja abierta, comprobante y cliente (el CCF exige NIT y NRC).
 * 2. Calcula IVA y total, valida el pago.
 * 3. Bloquea y verifica las existencias de los insumos de cada receta (o del producto de reventa).
 * 4. Asigna el correlativo, guarda la venta y descuenta el inventario.
 * Si cualquier paso falla, no se guarda nada (ni se consume el correlativo).
 */
export async function crearVenta(data, usuario = null) {
  const {
    cajaId, tipoComprobante = 'FCF', tipoOrden = 'comer_aqui', clienteId = 'cli-cf', metodoPago = 'efectivo', montoRecibido, referenciaPago = '',
  } = data;

  return withTransaction(async (client) => {
    const caja = await obtenerCaja(cajaId, client);
    // Bloquear el turno evita que la caja se cierre mientras se registra la venta.
    const turno = await cajaRepo.bloquearTurnoAbierto(cajaId, client);
    if (!turno) throw new AppError(`${caja.nombre} está cerrada. Abre la caja antes de cobrar.`, 409);
    if (!TIPOS_COMPROBANTE.includes(tipoComprobante)) throw new AppError('Tipo de comprobante inválido (FCF o CCF)', 422);
    if (!TIPOS_ORDEN.includes(tipoOrden)) throw new AppError('Tipo de orden inválido', 422);
    if (!METODOS_PAGO.includes(metodoPago)) throw new AppError('Método de pago inválido', 422);

    const cliente = await obtenerCliente(clienteId, client);
    if (!cliente.activo) throw new AppError(`El cliente ${cliente.nombre} está desactivado`, 422);
    if (tipoComprobante === 'CCF' && (!cliente.nit || !cliente.nrc)) {
      throw new AppError('El Comprobante de Crédito Fiscal requiere un cliente con NIT y NRC', 422);
    }

    const productos = await cargarProductos((Array.isArray(data.items) ? data.items : []).map((i) => i.productoId), client);
    const items = normalizarItems(data.items, productos);
    const { subtotal, iva, total } = calcularTotales(items);

    let recibido = total;
    if (metodoPago === 'efectivo') {
      recibido = montoRecibido === undefined || montoRecibido === '' || montoRecibido === null ? total : round2(montoRecibido);
      if (!(recibido >= total)) throw new AppError(`El monto recibido ($${Number(recibido || 0).toFixed(2)}) es menor que el total ($${total.toFixed(2)})`, 422);
    }

    const requerimientos = calcularRequerimientos(items, productos);
    await validarExistencias(requerimientos, caja.sucursalId, client);

    const sucursal = await generalRepo.obtenerSucursal(caja.sucursalId, client);
    const correlativo = await repo.siguienteCorrelativo(sucursal.id, tipoComprobante, client);
    const venta = {
      id: newId('ven'),
      numero: formatoNumero(tipoComprobante, sucursal.codigo, correlativo),
      tipoComprobante,
      sucursalId: sucursal.id,
      cajaId,
      turnoId: turno.id,
      fecha: new Date(),
      tipoOrden,
      clienteId,
      metodoPago,
      referenciaPago: String(referenciaPago ?? ''),
      items,
      subtotal,
      iva,
      total,
      montoRecibido: recibido,
      cambio: round2(recibido - total),
      creadoPor: usuario?.id ?? null,
    };
    await repo.insertarVenta(venta, client);
    await aplicarConsumo(requerimientos, sucursal.id, venta.numero, -1, client);
    return detalleVenta(await repo.obtenerVenta(venta.id, client), client);
  });
}

/** Sucursal de una venta (para validar el acceso); 404 si no existe. */
export async function sucursalDeVenta(id) {
  const venta = await repo.obtenerVenta(id);
  if (!venta) throw notFound('Venta');
  return venta.sucursalId;
}

export async function obtenerVenta(id) {
  const venta = await repo.obtenerVenta(id);
  if (!venta) throw notFound('Venta');
  return detalleVenta(venta);
}

/**
 * Ventas paginadas en el servidor. Filtros: sucursal, rango de fechas (?desde=&hasta=,
 * o ?fecha= para un solo día), tipo de comprobante y estado (emitida o anulada).
 */
export async function listarVentas({ sucursalId, fecha, desde, hasta, tipoComprobante, estado, pagina, porPagina } = {}) {
  if (tipoComprobante && !TIPOS_COMPROBANTE.includes(tipoComprobante)) throw new AppError('tipoComprobante debe ser FCF o CCF', 400);
  if (estado && !['emitida', 'anulada'].includes(estado)) throw new AppError('estado debe ser emitida o anulada', 400);
  const rango = leerRangoFechas(fecha ? { desde: fecha, hasta: fecha } : { desde, hasta });
  const paginacion = leerPaginacion({ pagina, porPagina });
  const { filas, total } = await repo.listarVentas({ sucursalId, ...rango, tipoComprobante, estado }, paginacion);
  return paginado(filas, total, paginacion);
}

/** Anula una venta del turno abierto y devuelve los insumos al inventario. */
export async function anularVenta(id, motivo = '') {
  return withTransaction(async (client) => {
    const bloqueada = await repo.bloquearVenta(id, client);
    if (!bloqueada) throw notFound('Venta');
    if (bloqueada.estado === 'anulada') throw new AppError('La venta ya está anulada', 409);
    const turno = await cajaRepo.obtenerTurno(bloqueada.turnoId, client);
    if (turno?.estado !== 'abierta') throw new AppError('Solo se pueden anular ventas de un turno abierto', 409);

    const venta = await repo.obtenerVenta(id, client);
    const productos = await cargarProductos(venta.items.map((i) => i.productoId), client);
    await aplicarConsumo(calcularRequerimientos(venta.items, productos), venta.sucursalId, `Anulación ${venta.numero}`, 1, client);
    await repo.anularVenta(id, String(motivo ?? ''), client);
    return detalleVenta(await repo.obtenerVenta(id, client), client);
  });
}
