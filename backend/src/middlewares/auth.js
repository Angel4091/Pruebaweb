import { config } from '../config/env.js';
import { verificarToken } from '../utils/seguridad.js';
import { obtenerUsuario, perfil } from '../services/auth.service.js';

/** Exige un token válido en "Authorization: Bearer <token>" y deja el usuario en req.usuario. */
export function autenticar(req, res, next) {
  const [tipo, token] = String(req.headers.authorization ?? '').split(' ');
  const payload = tipo === 'Bearer' ? verificarToken(token, config.jwtSecret) : null;
  const usuario = payload && obtenerUsuario(payload.sub);
  if (!usuario) return res.status(401).json({ error: 'Tu sesión no es válida o venció. Inicia sesión de nuevo.' });
  req.usuario = perfil(usuario);
  return next();
}

/** Permite el paso solo a los roles indicados (se usa después de autenticar). */
export const autorizar = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario?.rol)) {
    return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
  }
  return next();
};

/** Atajo: autenticar + autorizar en un solo arreglo de middlewares. */
export const solo = (...roles) => [autenticar, autorizar(...roles)];
