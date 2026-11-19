import { pool } from '../../config/database.js';
import { unaFila, todas } from '../../utils/filas.js';

/* ---------- Insumos ---------- */

// Existencia de cada sucursal como objeto: { "suc-central": 12, "suc-sanmiguel": 9 }.
const STOCK_POR_SUCURSAL = `
  (select coalesce(json_object_agg(x.sucursal_id, x.cantidad), '{}'::json)
   from existencias x where x.insumo_id = i.id) as stock`;

const COLUMNAS_INSUMO = `i.id, i.nombre, i.unidad, i.stock_minimo, i.costo_unitario, i.proveedor_id, i.arte, i.version, ${STOCK_POR_SUCURSAL}`;

/** Insumos activos con su existencia en la sucursal y el nombre del proveedor. */
export async function listarInsumos(sucursalId, db = pool) {
  const sql = `
    select ${COLUMNAS_INSUMO},
           coalesce(e.cantidad, 0) as existencia,
           coalesce(p.nombre, '—') as proveedor_nombre
    from insumos i
    left join existencias e on e.insumo_id = i.id and e.sucursal_id = $1
    left join proveedores p on p.id = i.proveedor_id
    where i.activo
    order by i.orden`;
  return todas(await db.query(sql, [sucursalId]));
}

/** Datos mínimos de cada insumo para calcular costos y disponibilidad de recetas. */
export async function listarInsumosBasicos(sucursalId, db = pool) {
  const sql = `
    select i.id, i.nombre, i.unidad, i.costo_unitario, coalesce(e.cantidad, 0) as existencia
    from insumos i
    left join existencias e on e.insumo_id = i.id and e.sucursal_id = $1`;
  return todas(await db.query(sql, [sucursalId ?? null]));
}

export async function obtenerInsumo(id, db = pool) {
  return unaFila(await db.query(`select ${COLUMNAS_INSUMO} from insumos i where i.id = $1`, [id]));
}

/** Bloquea la fila del insumo hasta que termine la transacción (para recalcular su costo). */
export async function bloquearInsumo(id, db) {
  const sql = 'select id, nombre, unidad, costo_unitario from insumos where id = $1 for update';
  return unaFila(await db.query(sql, [id]));
}

export async function crearInsumo(ins, db) {
  await db.query(
    `insert into insumos (id, nombre, unidad, stock_minimo, costo_unitario, proveedor_id, arte)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [ins.id, ins.nombre, ins.unidad, ins.stockMinimo, ins.costoUnitario, ins.proveedorId, ins.arte],
  );
  // Un insumo nuevo arranca con existencia 0 en todas las sucursales.
  await db.query(
    'insert into existencias (insumo_id, sucursal_id, cantidad) select $1, id, 0 from sucursales',
    [ins.id],
  );
  return obtenerInsumo(ins.id, db);
}

export async function guardarInsumo(ins, db = pool) {
  await db.query(
    `update insumos
     set nombre = $2, unidad = $3, stock_minimo = $4, costo_unitario = $5, proveedor_id = $6,
         version = version + 1, actualizado_en = now()
     where id = $1`,
    [ins.id, ins.nombre, ins.unidad, ins.stockMinimo, ins.costoUnitario, ins.proveedorId ?? null],
  );
  return obtenerInsumo(ins.id, db);
}

export async function actualizarCosto(id, costoUnitario, db) {
  await db.query(
    'update insumos set costo_unitario = $2, version = version + 1, actualizado_en = now() where id = $1',
    [id, costoUnitario],
  );
}

/* ---------- Existencias ---------- */

/**
 * Suma (o resta, con delta negativo) a la existencia de una sucursal y devuelve el nuevo valor.
 * Si la fila no existe y el delta es positivo, la crea. El check de la tabla impide quedar en negativo.
 */
export async function sumarExistencia(insumoId, sucursalId, delta, db) {
  const actualizada = await db.query(
    'update existencias set cantidad = cantidad + $3 where insumo_id = $1 and sucursal_id = $2 returning cantidad',
    [insumoId, sucursalId, delta],
  );
  if (actualizada.rowCount > 0) return actualizada.rows[0].cantidad;
  const creada = await db.query(
    'insert into existencias (insumo_id, sucursal_id, cantidad) values ($1, $2, $3) returning cantidad',
    [insumoId, sucursalId, delta],
  );
  return creada.rows[0].cantidad;
}

/** Existencia total del insumo en todas las sucursales (para el costo promedio ponderado). */
export async function existenciaTotal(insumoId, db) {
  const resultado = await db.query('select coalesce(sum(greatest(cantidad, 0)), 0) as total from existencias where insumo_id = $1', [insumoId]);
  return resultado.rows[0].total;
}

/**
 * Lee y bloquea las existencias de varios insumos en una sucursal. Mientras dure la
 * transacción, otra venta no puede descontar los mismos insumos al mismo tiempo.
 */
export async function bloquearExistencias(insumoIds, sucursalId, db) {
  if (insumoIds.length === 0) return new Map();
  const sql = `
    select i.id, i.nombre, i.unidad, coalesce(e.cantidad, 0) as cantidad
    from insumos i
    left join existencias e on e.insumo_id = i.id and e.sucursal_id = $1
    where i.id = any($2::varchar[])
    order by i.id
    for update of i`;
  const filas = todas(await db.query(sql, [sucursalId, insumoIds]));
  return new Map(filas.map((f) => [f.id, f]));
}

/* ---------- Movimientos ---------- */

export async function registrarMovimiento(m, db) {
  await db.query(
    `insert into movimientos_inventario (tipo, insumo_id, producto_id, sucursal_id, cantidad, referencia, motivo)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [m.tipo, m.insumoId ?? null, m.productoId ?? null, m.sucursalId, m.cantidad, m.referencia ?? '', m.motivo ?? ''],
  );
}

export async function listarMovimientos(sucursalId, limite, db = pool) {
  const sql = `
    select id, fecha, tipo, insumo_id, producto_id, sucursal_id, cantidad, referencia, motivo
    from movimientos_inventario
    where ($1::text is null or sucursal_id = $1)
    order by id desc
    limit $2`;
  return todas(await db.query(sql, [sucursalId || null, limite]));
}
