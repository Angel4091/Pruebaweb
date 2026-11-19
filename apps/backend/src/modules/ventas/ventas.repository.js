import { pool, insertarFilas } from '../../config/database.js';
import { unaFila, todas } from '../../utils/filas.js';

// Cada venta trae sus líneas como arreglo "items".
const SELECT_VENTA = `
  select v.id, v.numero, v.tipo_comprobante, v.sucursal_id, v.caja_id, v.turno_id, v.fecha, v.tipo_orden,
         v.cliente_id, v.metodo_pago, v.referencia_pago, v.subtotal, v.iva, v.total, v.monto_recibido,
         v.cambio, v.estado, v.motivo_anulacion, v.version,
         coalesce((select json_agg(json_build_object(
                    'producto_id', d.producto_id, 'nombre', d.nombre, 'cantidad', d.cantidad,
                    'precio_unitario', d.precio_unitario, 'total', d.total) order by d.id)
                   from venta_detalles d where d.venta_id = v.id), '[]'::json) as items
  from ventas v`;

/**
 * Reserva el siguiente número de comprobante de la sucursal. La fila del
 * correlativo queda bloqueada hasta que termine la transacción, así dos cajas
 * nunca obtienen el mismo número.
 */
export async function siguienteCorrelativo(sucursalId, tipo, db) {
  const sql = `
    insert into correlativos (sucursal_id, tipo, ultimo) values ($1, $2, 1)
    on conflict (sucursal_id, tipo) do update set ultimo = correlativos.ultimo + 1
    returning ultimo`;
  const resultado = await db.query(sql, [sucursalId, tipo]);
  return resultado.rows[0].ultimo;
}

export async function insertarVenta(v, db) {
  await db.query(
    `insert into ventas (id, numero, tipo_comprobante, sucursal_id, caja_id, turno_id, fecha, tipo_orden, cliente_id,
                         metodo_pago, referencia_pago, subtotal, iva, total, monto_recibido, cambio, estado)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'emitida')`,
    [v.id, v.numero, v.tipoComprobante, v.sucursalId, v.cajaId, v.turnoId, v.fecha, v.tipoOrden, v.clienteId,
      v.metodoPago, v.referenciaPago, v.subtotal, v.iva, v.total, v.montoRecibido, v.cambio],
  );
  await insertarFilas(db, 'venta_detalles', ['venta_id', 'producto_id', 'nombre', 'cantidad', 'precio_unitario', 'total'],
    v.items.map((it) => [v.id, it.productoId, it.nombre, it.cantidad, it.precioUnitario, it.total]));
}

export async function obtenerVenta(id, db = pool) {
  return unaFila(await db.query(`${SELECT_VENTA} where v.id = $1`, [id]));
}

/** Bloquea la venta para anularla sin que otra petición la modifique a la vez. */
export async function bloquearVenta(id, db) {
  const sql = 'select id, numero, sucursal_id, turno_id, estado from ventas where id = $1 for update';
  return unaFila(await db.query(sql, [id]));
}

export async function anularVenta(id, motivo, db) {
  await db.query(
    "update ventas set estado = 'anulada', motivo_anulacion = $2, version = version + 1 where id = $1",
    [id, motivo],
  );
}

/** Ventas filtradas, de la más reciente a la más antigua. */
export async function listarVentas({ sucursalId, desde, hasta, tipoComprobante, limite }, db = pool) {
  const sql = `${SELECT_VENTA}
    where ($1::text is null or v.sucursal_id = $1)
      and ($2::timestamptz is null or v.fecha >= $2)
      and ($3::timestamptz is null or v.fecha < $3)
      and ($4::text is null or v.tipo_comprobante = $4)
    order by v.fecha desc, v.numero desc
    limit $5`;
  return todas(await db.query(sql, [sucursalId || null, desde ?? null, hasta ?? null, tipoComprobante || null, limite]));
}
