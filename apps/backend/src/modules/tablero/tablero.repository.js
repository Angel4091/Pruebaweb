import { pool } from '../../config/database.js';
import { todas } from '../../utils/filas.js';

/** Fecha y total de las ventas emitidas de una sucursal en un rango. */
export async function ventasEnRango(sucursalId, desde, hasta, db = pool) {
  const sql = `
    select fecha, total
    from ventas
    where sucursal_id = $1 and estado = 'emitida' and fecha >= $2 and fecha < $3`;
  return todas(await db.query(sql, [sucursalId, desde, hasta]));
}

/** Productos con más unidades vendidas en el rango. */
export async function masVendidos(sucursalId, desde, hasta, limite, db = pool) {
  const sql = `
    select d.producto_id as id, p.nombre, p.arte, sum(d.cantidad) as cantidad
    from ventas v
    join venta_detalles d on d.venta_id = v.id
    join productos p on p.id = d.producto_id
    where v.sucursal_id = $1 and v.estado = 'emitida' and v.fecha >= $2 and v.fecha < $3
    group by d.producto_id, p.nombre, p.arte
    order by cantidad desc, min(v.fecha)
    limit $4`;
  return todas(await db.query(sql, [sucursalId, desde, hasta, limite]));
}

/** Total vendido por cada sucursal en el rango. */
export async function totalesPorSucursal(desde, hasta, db = pool) {
  const sql = `
    select s.id, s.nombre, coalesce(sum(v.total), 0) as total
    from sucursales s
    left join ventas v on v.sucursal_id = s.id and v.estado = 'emitida' and v.fecha >= $1 and v.fecha < $2
    group by s.id, s.nombre, s.codigo
    order by s.codigo`;
  return todas(await db.query(sql, [desde, hasta]));
}

/* ---------- Búsqueda global ---------- */

const LIMITE_BUSQUEDA = 12;

export async function buscarProductos(texto, db = pool) {
  const sql = 'select id, nombre from productos where activo and strpos(lower(nombre), $1) > 0 order by orden limit $2';
  return todas(await db.query(sql, [texto, LIMITE_BUSQUEDA]));
}

export async function buscarInsumos(texto, db = pool) {
  const sql = 'select id, nombre from insumos where activo and strpos(lower(nombre), $1) > 0 order by orden limit $2';
  return todas(await db.query(sql, [texto, LIMITE_BUSQUEDA]));
}

export async function buscarEmpleados(texto, db = pool) {
  const sql = `
    select id, nombre, cargo from empleados
    where strpos(lower(nombre), $1) > 0 or strpos(lower(cargo), $1) > 0
    order by orden limit $2`;
  return todas(await db.query(sql, [texto, LIMITE_BUSQUEDA]));
}

export async function buscarProveedores(texto, db = pool) {
  const sql = 'select id, nombre from proveedores where activo and strpos(lower(nombre), $1) > 0 order by orden limit $2';
  return todas(await db.query(sql, [texto, LIMITE_BUSQUEDA]));
}

export async function buscarComprobantes(texto, db = pool) {
  const sql = 'select id, numero from ventas where strpos(lower(numero), $1) > 0 order by fecha desc limit 5';
  return todas(await db.query(sql, [texto]));
}
