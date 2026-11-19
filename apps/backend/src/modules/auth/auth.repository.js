import { pool } from '../../config/database.js';
import { unaFila } from '../../utils/filas.js';

/** Usuario con su hash de contraseña, solo para validar el inicio de sesión. */
export async function buscarPorEmail(email, db = pool) {
  const sql = `
    select id, nombre, email, password_hash, rol, sucursal_id, activo
    from usuarios
    where lower(email) = lower($1)`;
  return unaFila(await db.query(sql, [email]));
}

/** Datos públicos del usuario (sin el hash), con el nombre de su sucursal. */
export async function obtenerUsuario(id, db = pool) {
  const sql = `
    select u.id, u.nombre, u.email, u.rol, u.sucursal_id, s.nombre as sucursal_nombre, u.activo
    from usuarios u
    left join sucursales s on s.id = u.sucursal_id
    where u.id = $1`;
  return unaFila(await db.query(sql, [id]));
}
