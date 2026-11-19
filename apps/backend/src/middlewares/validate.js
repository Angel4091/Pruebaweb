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
