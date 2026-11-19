import { AppError } from '../utils/AppError.js';
import { verificarToken, obtenerUsuario } from '../modules/auth/auth.service.js';

/**
 * Exige un token "Authorization: Bearer <jwt>" válido.
 * - Sin token o con otro esquema → 401 "Token requerido".
 * - Firma, emisor, audiencia o vencimiento inválidos → 401.
 * Además busca al usuario en la base: si lo desactivaron, su token deja de servir
 * de inmediato y el rol siempre es el actual (no el que tenía al iniciar sesión).
 */
export async function autenticar(req, res, next) {
  const encabezado = req.headers.authorization ?? '';
  if (!encabezado.startsWith('Bearer ')) throw new AppError('Token requerido', 401);

  let datos;
  try {
    datos = verificarToken(encabezado.slice('Bearer '.length).trim());
  } catch {
    throw new AppError('Token inválido o vencido', 401);
  }
  const usuario = await obtenerUsuario(Number(datos.sub));
  if (!usuario || !usuario.activo) throw new AppError('Token inválido o vencido', 401);
  req.usuario = usuario;
  next();
}
