import * as auth from './auth.service.js';

/** POST /api/auth/login — devuelve { token, expira, usuario }. */
export const login = async (req, res) => res.json(await auth.iniciarSesion(req.body));

/** GET /api/auth/me — datos del usuario dueño del token (los deja el middleware autenticar). */
export const yo = (req, res) => res.json(req.usuario);
