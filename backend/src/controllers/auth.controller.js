import * as auth from '../services/auth.service.js';

/** POST /api/auth/login — devuelve { token, usuario }. */
export const login = (req, res) => res.json(auth.login(req.body));

/** POST /api/auth/registro — crea una cuenta de cliente. */
export const registro = (req, res) => res.status(201).json(auth.registrarCliente(req.body));

/** GET /api/auth/yo — datos del usuario de la sesión. */
export const yo = (req, res) => res.json(req.usuario);
