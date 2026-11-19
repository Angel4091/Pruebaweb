import * as auth from './auth.service.js';
import { registrar } from '../bitacora/bitacora.service.js';

/** POST /api/auth/login — devuelve { token, expira, usuario }. El inicio de sesión queda en la bitácora. */
export const login = async (req, res) => {
  const sesion = await auth.iniciarSesion(req.body);
  await registrar({ usuarioId: sesion.usuario.id, accion: 'inicio_sesion', entidad: 'sesion' });
  res.json(sesion);
};

/** GET /api/auth/me — datos del usuario dueño del token (los deja el middleware autenticar). */
export const yo = (req, res) => res.json(req.usuario);
