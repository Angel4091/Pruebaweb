import { AppError } from '../utils/AppError.js';

/**
 * Valida que el body tenga los campos requeridos.
 * @param {string[]} fields
 */
export const requireFields = (fields) => (req, res, next) => {
  const body = req.body ?? {};
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length > 0) {
    throw new AppError(`Faltan campos requeridos: ${missing.join(', ')}`, 422, { missing });
  }
  next();
};

/** Exige parámetros de consulta, por ejemplo ?sucursalId=. */
export const requireQuery = (...fields) => (req, res, next) => {
  const missing = fields.filter((f) => !req.query[f]);
  if (missing.length > 0) throw new AppError(`Falta el parámetro de consulta: ${missing.join(', ')}`, 400);
  next();
};

/** Atajo para las rutas que trabajan sobre una sucursal. */
export const conSucursal = requireQuery('sucursalId');
