import { calcularPronostico } from './pronostico.service.js';

/** GET /api/pronostico?sucursalId=&dias= */
export const obtener = async (req, res) =>
  res.json(await calcularPronostico(req.query.sucursalId, Math.min(Number(req.query.dias) || 7, 30)));
