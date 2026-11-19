import { pool, insertarFilas } from '../../config/database.js';
import { unaFila, todas } from '../../utils/filas.js';

/* ---------- Proveedores ---------- */

const COLUMNAS_PROVEEDOR = 'id, nombre, nit, nrc, telefono, correo, contacto, dias_credito';

export async function listarProveedores(db = pool) {
  return todas(await db.query(`select ${COLUMNAS_PROVEEDOR} from proveedores where activo order by orden`));
}

export async function obtenerProveedor(id, db = pool) {
  return unaFila(await db.query(`select ${COLUMNAS_PROVEEDOR} from proveedores where id = $1`, [id]));
}

export async function existeProveedorConNombre(nombre, excluirId, db = pool) {
  const sql = 'select 1 from proveedores where lower(nombre) = lower($1) and ($2::text is null or id <> $2)';
  const resultado = await db.query(sql, [nombre, excluirId ?? null]);
  return resultado.rowCount > 0;
}

export async function crearProveedor(p, db = pool) {
  const sql = `
    insert into proveedores (id, nombre, nit, nrc, telefono, correo, contacto, dias_credito)
    values ($1, $2, $3, $4, $5, $6, $7, $8)
    returning ${COLUMNAS_PROVEEDOR}`;
  return unaFila(await db.query(sql, [p.id, p.nombre, p.nit, p.nrc, p.telefono, p.correo, p.contacto, p.diasCredito]));
}

export async function guardarProveedor(p, db = pool) {
  const sql = `
    update proveedores
    set nombre = $2, nit = $3, nrc = $4, telefono = $5, correo = $6, contacto = $7, dias_credito = $8, actualizado_en = now()
    where id = $1
    returning ${COLUMNAS_PROVEEDOR}`;
  return unaFila(await db.query(sql, [p.id, p.nombre, p.nit, p.nrc, p.telefono, p.correo, p.contacto, p.diasCredito]));
}

export async function contarProveedores(db = pool) {
  const resultado = await db.query('select count(*) as total from proveedores where activo');
  return resultado.rows[0].total;
}

/* ---------- Compras ---------- */

const SELECT_COMPRA = `
  select c.id, c.numero_factura, c.proveedor_id, c.proveedor_nombre, c.sucursal_id, c.tipo, c.descripcion, c.fecha,
         c.subtotal, c.iva, c.total, c.condicion, c.orden_compra_id, c.version,
         coalesce((select json_agg(json_build_object(
                    'insumo_id', d.insumo_id, 'nombre', d.nombre, 'cantidad', d.cantidad,
                    'costo_unitario', d.costo_unitario, 'total', d.total) order by d.id)
                   from compra_detalles d where d.compra_id = c.id), '[]'::json) as items
  from compras c`;

export async function existeFactura(numeroFactura, proveedorId, db = pool) {
  const sql = "select 1 from compras where numero_factura = $1 and coalesce(proveedor_id, '') = coalesce($2, '')";
  const resultado = await db.query(sql, [numeroFactura, proveedorId ?? null]);
  return resultado.rowCount > 0;
}

/** Siguiente número interno de compra (com-0001, com-0002…). */
export async function siguienteNumeroCompra(db) {
  const resultado = await db.query("select nextval('compras_numero_seq') as numero");
  return resultado.rows[0].numero;
}

export async function insertarCompra(c, db) {
  await db.query(
    `insert into compras (id, numero_factura, proveedor_id, proveedor_nombre, sucursal_id, tipo, descripcion, fecha,
                          subtotal, iva, total, condicion, orden_compra_id)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [c.id, c.numeroFactura, c.proveedorId, c.proveedorNombre, c.sucursalId, c.tipo, c.descripcion, c.fecha,
      c.subtotal, c.iva, c.total, c.condicion, c.ordenCompraId],
  );
  await insertarFilas(db, 'compra_detalles', ['compra_id', 'insumo_id', 'nombre', 'cantidad', 'costo_unitario', 'total'],
    c.items.map((i) => [c.id, i.insumoId, i.nombre, i.cantidad, i.costoUnitario, i.total]));
}

export async function obtenerCompra(id, db = pool) {
  return unaFila(await db.query(`${SELECT_COMPRA} where c.id = $1`, [id]));
}

export async function listarCompras({ sucursalId, tipo } = {}, db = pool) {
  const sql = `${SELECT_COMPRA}
    where ($1::text is null or c.sucursal_id = $1) and ($2::text is null or c.tipo = $2)
    order by c.fecha desc, c.id desc`;
  return todas(await db.query(sql, [sucursalId || null, tipo || null]));
}

/** Total de compras de insumos (costo) y de gastos en un rango de fechas. */
export async function totalesPorTipo(desde, hasta, db = pool) {
  const sql = `
    select coalesce(sum(total) filter (where tipo = 'costo'), 0) as costos,
           coalesce(sum(total) filter (where tipo = 'gasto'), 0) as gastos
    from compras
    where fecha >= $1 and fecha < $2`;
  return unaFila(await db.query(sql, [desde, hasta]));
}

/* ---------- Cuentas por pagar ---------- */

const SELECT_CUENTA = `
  select c.id, c.compra_id, c.proveedor_id, c.proveedor_nombre, c.numero_factura, c.monto, c.saldo, c.fecha_vencimiento,
         coalesce((select json_agg(json_build_object('fecha', p.fecha, 'monto', p.monto) order by p.id)
                   from pagos_cuentas p where p.cuenta_id = c.id), '[]'::json) as pagos
  from cuentas_por_pagar c`;

export async function insertarCuenta(c, db) {
  await db.query(
    `insert into cuentas_por_pagar (id, compra_id, proveedor_id, proveedor_nombre, numero_factura, monto, saldo, fecha_vencimiento)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [c.id, c.compraId, c.proveedorId, c.proveedorNombre, c.numeroFactura, c.monto, c.saldo, c.fechaVencimiento],
  );
}

export async function obtenerCuenta(id, db = pool) {
  return unaFila(await db.query(`${SELECT_CUENTA} where c.id = $1`, [id]));
}

export async function listarCuentas(db = pool) {
  return todas(await db.query(`${SELECT_CUENTA} order by c.fecha_vencimiento, c.id`));
}

/** Cuentas con saldo que vencen antes de una fecha (para las notificaciones). */
export async function cuentasPorVencer(limite, db = pool) {
  return todas(await db.query(`${SELECT_CUENTA} where c.saldo > 0 and c.fecha_vencimiento <= $1 order by c.fecha_vencimiento`, [limite]));
}

export async function bloquearCuenta(id, db) {
  return unaFila(await db.query('select id, saldo from cuentas_por_pagar where id = $1 for update', [id]));
}

export async function registrarPago(cuentaId, monto, nuevoSaldo, db) {
  await db.query('insert into pagos_cuentas (cuenta_id, monto) values ($1, $2)', [cuentaId, monto]);
  await db.query('update cuentas_por_pagar set saldo = $2 where id = $1', [cuentaId, nuevoSaldo]);
}

/* ---------- Órdenes de compra ---------- */

const SELECT_ORDEN = `
  select o.id, o.proveedor_id, o.proveedor_nombre, o.sucursal_id, o.fecha, o.total, o.estado, o.compra_id,
         coalesce((select json_agg(json_build_object(
                    'insumo_id', d.insumo_id, 'nombre', d.nombre, 'unidad', d.unidad,
                    'cantidad', d.cantidad, 'costo_estimado', d.costo_estimado) order by d.id)
                   from orden_compra_detalles d where d.orden_id = o.id), '[]'::json) as items
  from ordenes_compra o`;

export async function insertarOrden(o, db) {
  await db.query(
    `insert into ordenes_compra (id, proveedor_id, proveedor_nombre, sucursal_id, fecha, total, estado)
     values ($1, $2, $3, $4, $5, $6, 'pendiente')`,
    [o.id, o.proveedorId, o.proveedorNombre, o.sucursalId, o.fecha, o.total],
  );
  await insertarFilas(db, 'orden_compra_detalles', ['orden_id', 'insumo_id', 'nombre', 'unidad', 'cantidad', 'costo_estimado'],
    o.items.map((i) => [o.id, i.insumoId, i.nombre, i.unidad, i.cantidad, i.costoEstimado]));
}

export async function obtenerOrden(id, db = pool) {
  return unaFila(await db.query(`${SELECT_ORDEN} where o.id = $1`, [id]));
}

export async function listarOrdenes(estado, db = pool) {
  return todas(await db.query(`${SELECT_ORDEN} where ($1::text is null or o.estado = $1) order by o.fecha desc, o.id desc`, [estado || null]));
}

export async function marcarOrdenRecibida(id, compraId, db) {
  await db.query("update ordenes_compra set estado = 'recibida', compra_id = $2 where id = $1", [id, compraId]);
}
