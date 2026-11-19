import * as tablero from './tablero.service.js';

export const dashboard = async (req, res) => res.json(await tablero.obtenerDashboard(req.query.sucursalId));
export const notificaciones = async (req, res) => res.json(await tablero.obtenerNotificaciones(req.query.sucursalId));
export const buscar = async (req, res) => res.json(await tablero.buscar(req.query.q, req.usuario));
