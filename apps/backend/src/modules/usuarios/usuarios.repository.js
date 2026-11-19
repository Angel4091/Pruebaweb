import { pool } from '../../config/database.js';
import { unaFila, todas } from '../../utils/filas.js';

const SELECT_USUARIO = `
  select u.id, u.nombre, u.email, u.rol, u.sucursal_id, s.nombre as sucursal_nombre,
         u.empleado_id, u.activo, u.creado_en
  from usuarios u
  left join sucursales s on s.id = u.sucursal_id`;

export async function listarUsuarios(db = pool) {
  return todas(await db.query(`${SELECT_USUARIO} order by u.activo desc, u.nombre`));
}

export async function obtenerUsuario(id, db = pool) {
  return unaFila(await db.query(`${SELECT_USUARIO} where u.id = $1`, [id]));
}

export async function existeEmail(email, excluirId, db = pool) {
  const sql = 'select 1 from usuarios where lower(email) = lower($1) and ($2::bigint is null or id <> $2)';
  const resultado = await db.query(sql, [email, excluirId ?? null]);
  return resultado.rowCount > 0;
}

/** Cuántos administradores activos quedan (para no dejar el sistema sin ninguno). */
export async function contarAdminsActivos(db = pool) {
  const resultado = await db.query("select count(*) as total from usuarios where rol = 'admin' and activo");
  return resultado.rows[0].total;
}

export async function crearUsuario(u, db = pool) {
  const resultado = await db.query(
    `insert into usuarios (nombre, email, password_hash, rol, sucursal_id, empleado_id)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [u.nombre, u.email, u.passwordHash, u.rol, u.sucursalId, u.empleadoId],
  );
  return obtenerUsuario(resultado.rows[0].id, db);
}

export async function guardarUsuario(u, db = pool) {
  await db.query(
    `update usuarios
     set nombre = $2, email = $3, rol = $4, sucursal_id = $5, empleado_id = $6, activo = $7, actualizado_en = now()
     where id = $1`,
    [u.id, u.nombre, u.email, u.rol, u.sucursalId, u.empleadoId, u.activo],
  );
  return obtenerUsuario(u.id, db);
}

export async function cambiarPassword(id, passwordHash, db = pool) {
  await db.query('update usuarios set password_hash = $2, actualizado_en = now() where id = $1', [id, passwordHash]);
}
