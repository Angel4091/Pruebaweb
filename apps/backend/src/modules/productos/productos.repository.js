import { pool } from '../../config/database.js';
import { unaFila, todas } from '../../utils/filas.js';

// Receta como arreglo [{ insumo_id, cantidad }] y existencias de reventa como objeto por sucursal.
const SELECT_PRODUCTO = `
  select p.id, p.nombre, p.precio, p.categoria_id, p.tipo, p.descripcion, p.arte, p.imagen,
         p.costo, p.stock_minimo, p.activo, p.version,
         coalesce((select json_agg(json_build_object('insumo_id', r.insumo_id, 'cantidad', r.cantidad) order by r.orden)
                   from recetas r where r.producto_id = p.id), '[]'::json) as receta,
         (select json_object_agg(x.sucursal_id, x.cantidad)
          from existencias_reventa x where x.producto_id = p.id) as stock
  from productos p`;

/** Productos del menú. activo: true (por defecto), false o null (todos). */
export async function listarProductos({ categoriaId, texto, activo = true } = {}, db = pool) {
  const sql = `${SELECT_PRODUCTO}
    where ($1::boolean is null or p.activo = $1)
      and ($2::text is null or p.categoria_id = $2)
      and ($3::text is null or strpos(lower(p.nombre), $3) > 0)
    order by p.orden`;
  return todas(await db.query(sql, [activo, categoriaId || null, texto || null]));
}

export async function obtenerProducto(id, db = pool) {
  return unaFila(await db.query(`${SELECT_PRODUCTO} where p.id = $1`, [id]));
}

/** Varios productos por id (para armar una venta). */
export async function obtenerProductos(ids, db = pool) {
  return todas(await db.query(`${SELECT_PRODUCTO} where p.id = any($1::varchar[])`, [ids]));
}

export async function crearProducto(p, db) {
  await db.query(
    `insert into productos (id, nombre, precio, categoria_id, tipo, descripcion, arte, imagen, costo, stock_minimo)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [p.id, p.nombre, p.precio, p.categoriaId, p.tipo, p.descripcion, p.arte, p.imagen, p.costo ?? 0, p.stockMinimo ?? 0],
  );
}

/**
 * Guarda el producto solo si sigue en la versión que se leyó (bloqueo optimista, D-19).
 * Devuelve false si alguien lo modificó antes: el servicio responde 409.
 */
export async function guardarProducto(p, versionLeida, db) {
  const resultado = await db.query(
    `update productos
     set nombre = $2, precio = $3, categoria_id = $4, descripcion = $5, imagen = $6, activo = $7,
         costo = $8, stock_minimo = $9, version = version + 1, actualizado_en = now()
     where id = $1 and version = $10`,
    [p.id, p.nombre, p.precio, p.categoriaId, p.descripcion, p.imagen, p.activo, p.costo ?? 0, p.stockMinimo ?? 0, versionLeida],
  );
  return resultado.rowCount > 0;
}

/** Reemplaza la receta completa de un producto elaborado. */
export async function reemplazarReceta(productoId, receta, db) {
  await db.query('delete from recetas where producto_id = $1', [productoId]);
  for (const r of receta) {
    await db.query('insert into recetas (producto_id, insumo_id, cantidad) values ($1, $2, $3)', [productoId, r.insumoId, r.cantidad]);
  }
}

/* ---------- Existencias de reventa ---------- */

export async function crearExistenciasReventa(productoId, db) {
  await db.query(
    'insert into existencias_reventa (producto_id, sucursal_id, cantidad) select $1, id, 0 from sucursales',
    [productoId],
  );
}

/** Igual que sumarExistencia de insumos, pero para productos de reventa (por unidad). */
export async function sumarExistenciaReventa(productoId, sucursalId, delta, db) {
  const actualizada = await db.query(
    'update existencias_reventa set cantidad = cantidad + $3 where producto_id = $1 and sucursal_id = $2 returning cantidad',
    [productoId, sucursalId, delta],
  );
  if (actualizada.rowCount > 0) return actualizada.rows[0].cantidad;
  const creada = await db.query(
    'insert into existencias_reventa (producto_id, sucursal_id, cantidad) values ($1, $2, $3) returning cantidad',
    [productoId, sucursalId, delta],
  );
  return creada.rows[0].cantidad;
}

/** Lee y bloquea las existencias de varios productos de reventa en una sucursal. */
export async function bloquearExistenciasReventa(productoIds, sucursalId, db) {
  if (productoIds.length === 0) return new Map();
  const sql = `
    select p.id, p.nombre, coalesce(x.cantidad, 0) as cantidad
    from productos p
    left join existencias_reventa x on x.producto_id = p.id and x.sucursal_id = $1
    where p.id = any($2::varchar[])
    order by p.id
    for update of p`;
  const filas = todas(await db.query(sql, [sucursalId, productoIds]));
  return new Map(filas.map((f) => [f.id, f]));
}

/** Productos de reventa activos con su existencia en la sucursal. */
export async function listarReventa(sucursalId, db = pool) {
  const sql = `
    select p.id, p.nombre, p.costo, p.stock_minimo, coalesce(x.cantidad, 0) as existencia
    from productos p
    left join existencias_reventa x on x.producto_id = p.id and x.sucursal_id = $1
    where p.tipo = 'reventa' and p.activo
    order by p.orden`;
  return todas(await db.query(sql, [sucursalId]));
}

/* ---------- Categorías ---------- */

export async function listarCategorias(db = pool) {
  return todas(await db.query('select id, nombre from categorias order by orden'));
}

export async function existeCategoria(id, db = pool) {
  const resultado = await db.query('select 1 from categorias where id = $1', [id]);
  return resultado.rowCount > 0;
}
