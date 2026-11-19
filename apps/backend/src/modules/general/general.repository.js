import { pool } from '../../config/database.js';
import { unaFila, todas } from '../../utils/filas.js';

/* ---------- Sucursales ---------- */

export async function listarSucursales(db = pool) {
  return todas(await db.query('select id, codigo, nombre, direccion, telefono from sucursales order by codigo'));
}

export async function obtenerSucursal(id, db = pool) {
  return unaFila(await db.query('select id, codigo, nombre, direccion, telefono from sucursales where id = $1', [id]));
}

/* ---------- Clientes ---------- */

const COLUMNAS_CLIENTE = 'id, nombre, tipo, nit, nrc, giro, direccion, telefono, activo';

/** Clientes que coinciden con el texto (nombre, NIT o NRC). activo: true (por defecto), false o null (todos). */
export async function listarClientes({ texto, activo = true } = {}, db = pool) {
  const sql = `
    select ${COLUMNAS_CLIENTE}
    from clientes
    where ($2::boolean is null or activo = $2)
      and ($1::text is null or strpos(lower(nombre), $1) > 0 or strpos(nit, $1) > 0 or strpos(nrc, $1) > 0)
    order by orden`;
  return todas(await db.query(sql, [texto || null, activo]));
}

export async function guardarCliente(c, db = pool) {
  const sql = `
    update clientes
    set nombre = $2, tipo = $3, nit = $4, nrc = $5, giro = $6, direccion = $7, telefono = $8, activo = $9
    where id = $1
    returning ${COLUMNAS_CLIENTE}`;
  return unaFila(await db.query(sql, [c.id, c.nombre, c.tipo, c.nit, c.nrc, c.giro, c.direccion, c.telefono, c.activo]));
}

export async function obtenerCliente(id, db = pool) {
  return unaFila(await db.query(`select ${COLUMNAS_CLIENTE} from clientes where id = $1`, [id]));
}

export async function crearCliente(c, db = pool) {
  const sql = `
    insert into clientes (id, nombre, tipo, nit, nrc, giro, direccion, telefono)
    values ($1, $2, $3, $4, $5, $6, $7, $8)
    returning ${COLUMNAS_CLIENTE}`;
  return unaFila(await db.query(sql, [c.id, c.nombre, c.tipo, c.nit, c.nrc, c.giro, c.direccion, c.telefono]));
}

/* ---------- Identidad visual ---------- */

export async function obtenerConfiguracion(db = pool) {
  const resultado = await db.query('select datos from configuracion where id = 1');
  return resultado.rows[0]?.datos ?? null;
}

export async function guardarConfiguracion(datos, db = pool) {
  const sql = `
    insert into configuracion (id, datos) values (1, $1)
    on conflict (id) do update set datos = excluded.datos, actualizado_en = now()
    returning datos`;
  const resultado = await db.query(sql, [JSON.stringify(datos)]);
  return resultado.rows[0].datos;
}
