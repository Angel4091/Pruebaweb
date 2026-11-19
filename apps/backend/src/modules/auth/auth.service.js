import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import * as repo from './auth.repository.js';

// Si el correo no existe se compara contra este hash igual, para que la respuesta
// tarde lo mismo y no revele qué correos están registrados.
const HASH_DE_RELLENO = bcrypt.hashSync('usuario-que-no-existe', 12);

const CREDENCIALES_INCORRECTAS = 'Correo o contraseña incorrectos';

/**
 * Inicio de sesión: compara la contraseña con el hash de bcrypt y, si coincide,
 * firma un JWT (HS256) con el id del usuario en "sub", su rol y su sucursal.
 */
export async function iniciarSesion({ email, password } = {}) {
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw new AppError('Correo y contraseña son obligatorios', 400);
  }
  const usuario = await repo.buscarPorEmail(email.trim());
  const coincide = await bcrypt.compare(password, usuario?.passwordHash ?? HASH_DE_RELLENO);
  if (!usuario || !usuario.activo || !coincide) throw new AppError(CREDENCIALES_INCORRECTAS, 401);

  const token = jwt.sign({ rol: usuario.rol, sucursalId: usuario.sucursalId }, config.jwt.secret, {
    subject: String(usuario.id),
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    algorithm: config.jwt.algorithm,
  });
  const { exp } = jwt.decode(token);
  return { token, expira: new Date(exp * 1000).toISOString(), usuario: await repo.obtenerUsuario(usuario.id) };
}

/** Verifica firma, algoritmo, emisor, audiencia y vencimiento. Lanza un error si algo no cuadra. */
export function verificarToken(token) {
  return jwt.verify(token, config.jwt.secret, {
    algorithms: [config.jwt.algorithm],
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
}

export const obtenerUsuario = (id) => repo.obtenerUsuario(id);
