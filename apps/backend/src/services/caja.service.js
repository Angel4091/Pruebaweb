import { db } from '../config/db.js';
import { AppError, notFound } from '../utils/AppError.js';
import { round2 } from '../utils/money.js';
import { newId } from '../utils/ids.js';
import { toDateKey, turnoActual, addDays } from '../utils/dates.js';
import { validarSucursal } from './inventario.service.js';

export const METODOS_PAGO = ['efectivo', 'tarjeta', 'bitcoin'];
export const DENOMINACIONES = [1, 5, 10, 20];

export function obtenerCaja(cajaId) {
  const caja = db.collection('cajas').find((c) => c.id === cajaId);
  if (!caja) throw notFound('Caja');
  return caja;
}

/** Turno (sesión de caja) abierto para una caja, si existe. */
export const turnoAbierto = (cajaId) => db.collection('turnos').find((t) => t.cajaId === cajaId && t.estado === 'abierta');

/** Totales de un turno calculados a partir de sus ventas emitidas. */
export function totalesTurno(turnoId) {
  const ventas = db.collection('ventas').filter((v) => v.turnoId === turnoId && v.estado === 'emitida');
  const porMetodo = (m) => round2(ventas.filter((v) => v.metodoPago === m).reduce((a, v) => a + v.total, 0));
  return {
    ventas: round2(ventas.reduce((a, v) => a + v.total, 0)),
    efectivo: porMetodo('efectivo'),
    tarjeta: porMetodo('tarjeta'),
    bitcoin: porMetodo('bitcoin'),
    ordenes: ventas.length,
  };
}

function conTotales(turno) {
  if (!turno) return null;
  if (turno.estado === 'cerrada') return turno;
  const totales = totalesTurno(turno.id);
  return { ...turno, totales: { ...totales, efectivoEsperado: round2(turno.montoInicial + totales.efectivo) } };
}

export function listarCajas(sucursalId) {
  validarSucursal(sucursalId);
  return db
    .collection('cajas')
    .filter((c) => c.sucursalId === sucursalId)
    .map((c) => {
      const turno = turnoAbierto(c.id);
      return { ...c, estado: turno ? 'abierta' : 'cerrada', turno: conTotales(turno) };
    });
}

/** Apertura de caja: registra el fondo inicial y su desglose por denominación. */
export function abrirCaja(cajaId, { montoInicial, denominaciones, responsable = 'Cajero de turno' }) {
  const caja = obtenerCaja(cajaId);
  if (turnoAbierto(cajaId)) throw new AppError(`${caja.nombre} ya tiene un turno abierto`, 409);
  let monto = Number(montoInicial);
  if (denominaciones && typeof denominaciones === 'object') {
    const sumaDenominaciones = Object.entries(denominaciones).reduce((a, [valor, cantidad]) => a + Number(valor) * Number(cantidad || 0), 0);
    if (montoInicial === undefined || montoInicial === null || montoInicial === '') monto = sumaDenominaciones;
    else if (round2(sumaDenominaciones) !== round2(monto)) {
      throw new AppError(`El desglose de billetes ($${sumaDenominaciones.toFixed(2)}) no coincide con el monto inicial`, 422);
    }
  }
  if (!(monto >= 0) || Number.isNaN(monto)) throw new AppError('El monto inicial debe ser un número mayor o igual a cero', 422);
  const ahora = new Date();
  const turno = {
    id: newId('tur'),
    cajaId,
    sucursalId: caja.sucursalId,
    fecha: toDateKey(ahora),
    turno: turnoActual(ahora),
    responsable,
    montoInicial: round2(monto),
    denominaciones: denominaciones ?? null,
    apertura: ahora.toISOString(),
    cierre: null,
    estado: 'abierta',
    efectivoContado: null,
    totales: null,
  };
  db.collection('turnos').push(turno);
  db.save();
  return conTotales(turno);
}

/** Resumen en vivo del turno abierto de una caja. */
export function resumenCaja(cajaId) {
  obtenerCaja(cajaId);
  const turno = turnoAbierto(cajaId);
  if (!turno) throw new AppError('La caja no tiene un turno abierto', 409);
  return conTotales(turno);
}

/**
 * Cierre de caja: cuadra el efectivo contado contra el esperado
 * (fondo inicial + ventas en efectivo) y guarda los totales por método de pago.
 */
export function cerrarCaja(cajaId, { efectivoContado, observaciones = '' }) {
  obtenerCaja(cajaId);
  const turno = turnoAbierto(cajaId);
  if (!turno) throw new AppError('La caja no tiene un turno abierto', 409);
  const contado = Number(efectivoContado);
  if (Number.isNaN(contado) || contado < 0) throw new AppError('El efectivo contado debe ser un número mayor o igual a cero', 422);
  const totales = totalesTurno(turno.id);
  const efectivoEsperado = round2(turno.montoInicial + totales.efectivo);
  turno.efectivoContado = round2(contado);
  turno.totales = { ...totales, efectivoEsperado, diferencia: round2(contado - efectivoEsperado) };
  turno.estado = 'cerrada';
  turno.cierre = new Date().toISOString();
  turno.observaciones = observaciones;
  db.save();
  return turno;
}

/** Historial de turnos de una sucursal en los últimos N días. */
export function historialTurnos(sucursalId, dias = 7) {
  validarSucursal(sucursalId);
  const desde = toDateKey(addDays(new Date(), -(Number(dias) - 1)));
  const cajas = db.collection('cajas');
  return db
    .collection('turnos')
    .filter((t) => t.sucursalId === sucursalId && t.fecha >= desde)
    .map((t) => ({ ...conTotales(t), cajaNombre: cajas.find((c) => c.id === t.cajaId)?.nombre }))
    .sort((a, b) => b.apertura.localeCompare(a.apertura));
}

/** Ventas del día por método de pago (todas las cajas de la sucursal). */
export function ventasPorMetodo(sucursalId, fecha = toDateKey()) {
  validarSucursal(sucursalId);
  const ventas = db
    .collection('ventas')
    .filter((v) => v.sucursalId === sucursalId && v.estado === 'emitida' && toDateKey(v.fecha) === fecha);
  const total = round2(ventas.reduce((a, v) => a + v.total, 0));
  const metodos = METODOS_PAGO.map((metodo) => {
    const monto = round2(ventas.filter((v) => v.metodoPago === metodo).reduce((a, v) => a + v.total, 0));
    return { metodo, monto, porcentaje: total > 0 ? Math.round((monto / total) * 100) : 0 };
  });
  return { fecha, total, metodos };
}
