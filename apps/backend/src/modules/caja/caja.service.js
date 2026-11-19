import { withTransaction } from '../../config/database.js';
import { AppError, notFound } from '../../utils/AppError.js';
import { round2 } from '../../utils/money.js';
import { newId } from '../../utils/ids.js';
import { toDateKey, turnoActual, addDays, rangoDelDia } from '../../utils/dates.js';
import { validarSucursal } from '../general/general.service.js';
import * as repo from './caja.repository.js';

export const METODOS_PAGO = ['efectivo', 'tarjeta', 'bitcoin'];
export const DENOMINACIONES = [1, 5, 10, 20];

export async function obtenerCaja(cajaId, db) {
  const caja = await repo.obtenerCaja(cajaId, db);
  if (!caja) throw notFound('Caja');
  return caja;
}

export const turnoAbierto = (cajaId, db) => repo.turnoAbierto(cajaId, db);

/** Agrega los totales en vivo a un turno abierto (los cerrados ya los tienen guardados). */
async function conTotales(turno, db) {
  if (!turno) return null;
  if (turno.estado === 'cerrada') return turno;
  const totales = await repo.totalesTurno(turno.id, db);
  return { ...turno, totales: { ...totales, efectivoEsperado: round2(turno.montoInicial + totales.efectivo) } };
}

export async function listarCajas(sucursalId) {
  await validarSucursal(sucursalId);
  const cajas = await repo.listarCajas(sucursalId);
  return Promise.all(
    cajas.map(async (c) => {
      const turno = await repo.turnoAbierto(c.id);
      return { ...c, estado: turno ? 'abierta' : 'cerrada', turno: await conTotales(turno) };
    }),
  );
}

/** Apertura de caja: registra el fondo inicial y su desglose por denominación. */
export async function abrirCaja(cajaId, { montoInicial, denominaciones, responsable = 'Cajero de turno' } = {}) {
  const caja = await obtenerCaja(cajaId);
  if (await repo.turnoAbierto(cajaId)) throw new AppError(`${caja.nombre} ya tiene un turno abierto`, 409);
  let monto = Number(montoInicial);
  if (denominaciones && typeof denominaciones === 'object') {
    const suma = Object.entries(denominaciones).reduce((a, [valor, cantidad]) => a + Number(valor) * Number(cantidad || 0), 0);
    if (montoInicial === undefined || montoInicial === null || montoInicial === '') monto = suma;
    else if (round2(suma) !== round2(monto)) {
      throw new AppError(`El desglose de billetes ($${suma.toFixed(2)}) no coincide con el monto inicial`, 422);
    }
  }
  if (!(monto >= 0) || Number.isNaN(monto)) throw new AppError('El monto inicial debe ser un número mayor o igual a cero', 422);
  const ahora = new Date();
  // El índice único turnos_un_abierto_por_caja impide dos aperturas simultáneas de la misma caja.
  const turno = await repo.insertarTurno({
    id: newId('tur'),
    cajaId,
    sucursalId: caja.sucursalId,
    fecha: toDateKey(ahora),
    turno: turnoActual(ahora),
    responsable,
    montoInicial: round2(monto),
    denominaciones: denominaciones ?? null,
    apertura: ahora,
  });
  return conTotales(turno);
}

/** Resumen en vivo del turno abierto de una caja. */
export async function resumenCaja(cajaId) {
  await obtenerCaja(cajaId);
  const turno = await repo.turnoAbierto(cajaId);
  if (!turno) throw new AppError('La caja no tiene un turno abierto', 409);
  return conTotales(turno);
}

/**
 * Cierre de caja: cuadra el efectivo contado contra el esperado
 * (fondo inicial + ventas en efectivo) y guarda los totales por método de pago.
 * Bloquea el turno para que no entren ventas mientras se cierra.
 */
export async function cerrarCaja(cajaId, { efectivoContado, observaciones = '' } = {}) {
  const contado = Number(efectivoContado);
  if (Number.isNaN(contado) || contado < 0) throw new AppError('El efectivo contado debe ser un número mayor o igual a cero', 422);
  return withTransaction(async (client) => {
    await obtenerCaja(cajaId, client);
    const turno = await repo.bloquearTurnoAbierto(cajaId, client);
    if (!turno) throw new AppError('La caja no tiene un turno abierto', 409);
    const totales = await repo.totalesTurno(turno.id, client);
    const efectivoEsperado = round2(turno.montoInicial + totales.efectivo);
    return repo.cerrarTurno(turno.id, {
      ...totales,
      efectivoContado: round2(contado),
      efectivoEsperado,
      diferencia: round2(contado - efectivoEsperado),
      observaciones: String(observaciones ?? ''),
    }, client);
  });
}

/** Historial de turnos de una sucursal en los últimos N días. */
export async function historialTurnos(sucursalId, dias = 7) {
  await validarSucursal(sucursalId);
  const desde = toDateKey(addDays(new Date(), -(Number(dias) - 1)));
  const turnos = await repo.listarTurnos(sucursalId, desde);
  return Promise.all(turnos.map((t) => conTotales(t)));
}

/** Ventas del día por método de pago (todas las cajas de la sucursal). */
export async function ventasPorMetodo(sucursalId, fecha = toDateKey()) {
  await validarSucursal(sucursalId);
  const { desde, hasta } = rangoDelDia(fecha);
  const filas = await repo.ventasPorMetodo(sucursalId, desde, hasta);
  const montoDe = (metodo) => round2(filas.find((f) => f.metodoPago === metodo)?.monto ?? 0);
  const total = round2(filas.reduce((a, f) => a + f.monto, 0));
  const metodos = METODOS_PAGO.map((metodo) => {
    const monto = montoDe(metodo);
    return { metodo, monto, porcentaje: total > 0 ? Math.round((monto / total) * 100) : 0 };
  });
  return { fecha, total, metodos };
}
