import { pool } from '../../config/database.js';
import { unaFila, todas } from '../../utils/filas.js';

const COLUMNAS_TURNO = `
  t.id, t.caja_id, t.sucursal_id, t.fecha, t.turno, t.responsable, t.monto_inicial, t.denominaciones,
  t.apertura, t.cierre, t.estado, t.efectivo_contado, t.total_ventas, t.total_efectivo, t.total_tarjeta,
  t.total_bitcoin, t.ordenes, t.efectivo_esperado, t.diferencia, t.observaciones`;

/** Convierte la fila al formato de la API: los totales de un turno cerrado van agrupados. */
function aTurno(fila) {
  if (!fila) return null;
  const {
    totalVentas, totalEfectivo, totalTarjeta, totalBitcoin, ordenes, efectivoEsperado, diferencia, ...turno
  } = fila;
  return {
    ...turno,
    totales: turno.estado === 'cerrada'
      ? { ventas: totalVentas, efectivo: totalEfectivo, tarjeta: totalTarjeta, bitcoin: totalBitcoin, ordenes, efectivoEsperado, diferencia }
      : null,
  };
}

/* ---------- Cajas ---------- */

export async function obtenerCaja(id, db = pool) {
  return unaFila(await db.query('select id, nombre, sucursal_id from cajas where id = $1', [id]));
}

export async function listarCajas(sucursalId, db = pool) {
  return todas(await db.query('select id, nombre, sucursal_id from cajas where sucursal_id = $1 order by nombre', [sucursalId]));
}

/* ---------- Turnos ---------- */

export async function turnoAbierto(cajaId, db = pool) {
  const sql = `select ${COLUMNAS_TURNO} from turnos t where t.caja_id = $1 and t.estado = 'abierta'`;
  return aTurno(unaFila(await db.query(sql, [cajaId])));
}

/** Igual que turnoAbierto, pero bloquea la fila hasta que termine la transacción. */
export async function bloquearTurnoAbierto(cajaId, db) {
  const sql = `select ${COLUMNAS_TURNO} from turnos t where t.caja_id = $1 and t.estado = 'abierta' for update`;
  return aTurno(unaFila(await db.query(sql, [cajaId])));
}

export async function obtenerTurno(id, db = pool) {
  return aTurno(unaFila(await db.query(`select ${COLUMNAS_TURNO} from turnos t where t.id = $1`, [id])));
}

/** Totales de un turno calculados a partir de sus ventas emitidas. */
export async function totalesTurno(turnoId, db = pool) {
  const sql = `
    select coalesce(sum(total), 0) as ventas,
           coalesce(sum(total) filter (where metodo_pago = 'efectivo'), 0) as efectivo,
           coalesce(sum(total) filter (where metodo_pago = 'tarjeta'), 0) as tarjeta,
           coalesce(sum(total) filter (where metodo_pago = 'bitcoin'), 0) as bitcoin,
           count(*) as ordenes
    from ventas
    where turno_id = $1 and estado = 'emitida'`;
  return unaFila(await db.query(sql, [turnoId]));
}

export async function insertarTurno(t, db = pool) {
  await db.query(
    `insert into turnos (id, caja_id, sucursal_id, fecha, turno, responsable, monto_inicial, denominaciones, apertura, estado, abierto_por)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'abierta', $10)`,
    [t.id, t.cajaId, t.sucursalId, t.fecha, t.turno, t.responsable, t.montoInicial,
      t.denominaciones ? JSON.stringify(t.denominaciones) : null, t.apertura, t.abiertoPor ?? null],
  );
  return obtenerTurno(t.id, db);
}

export async function cerrarTurno(id, c, db) {
  await db.query(
    `update turnos
     set estado = 'cerrada', cierre = now(), efectivo_contado = $2, total_ventas = $3, total_efectivo = $4,
         total_tarjeta = $5, total_bitcoin = $6, ordenes = $7, efectivo_esperado = $8, diferencia = $9, observaciones = $10,
         cerrado_por = $11
     where id = $1`,
    [id, c.efectivoContado, c.ventas, c.efectivo, c.tarjeta, c.bitcoin, c.ordenes, c.efectivoEsperado, c.diferencia, c.observaciones,
      c.cerradoPor ?? null],
  );
  return obtenerTurno(id, db);
}

/** Turnos de una sucursal desde una fecha, con el nombre de la caja. Los más recientes primero. */
export async function listarTurnos(sucursalId, desdeFecha, db = pool) {
  const sql = `
    select ${COLUMNAS_TURNO}, c.nombre as caja_nombre
    from turnos t
    join cajas c on c.id = t.caja_id
    where t.sucursal_id = $1 and t.fecha >= $2
    order by t.apertura desc`;
  return todas(await db.query(sql, [sucursalId, desdeFecha])).map(aTurno);
}

/** Total vendido por método de pago en un rango de fechas. */
export async function ventasPorMetodo(sucursalId, desde, hasta, db = pool) {
  const sql = `
    select metodo_pago, coalesce(sum(total), 0) as monto
    from ventas
    where sucursal_id = $1 and estado = 'emitida' and fecha >= $2 and fecha < $3
    group by metodo_pago`;
  return todas(await db.query(sql, [sucursalId, desde, hasta]));
}
