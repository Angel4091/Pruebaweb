import { pool } from '../../config/database.js';
import { todas } from '../../utils/filas.js';

/**
 * Consumo de insumos de cada venta emitida desde una fecha: cada línea vendida se
 * explota con la receta del producto (cantidad de la receta × unidades vendidas).
 */
export async function consumoDesde(sucursalId, desde, db = pool) {
  const sql = `
    select v.fecha, r.insumo_id, r.cantidad * d.cantidad as cantidad
    from ventas v
    join venta_detalles d on d.venta_id = v.id
    join recetas r on r.producto_id = d.producto_id
    where v.sucursal_id = $1 and v.estado = 'emitida' and v.fecha >= $2`;
  return todas(await db.query(sql, [sucursalId, desde]));
}
